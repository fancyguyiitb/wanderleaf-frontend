'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { messagingApi, type ApiChatMessage, type ApiEncryptedBody } from '@/lib/api';

type ConnectionState = 'idle' | 'connecting' | 'open' | 'closed' | 'error';

interface SendMessagePayload {
  body: string;
  encrypted_body?: ApiEncryptedBody;
  message_type?: 'text' | 'image' | 'file';
  attachment_url?: string;
  attachment_name?: string;
  attachment_mime?: string;
  attachment_bytes?: number | null;
}

interface UseChatSocketOptions {
  conversationId?: string;
  enabled: boolean;
  onMessage: (message: ApiChatMessage) => void;
  onError?: (message: string) => void;
}

export function useChatSocket({
  conversationId,
  enabled,
  onMessage,
  onError,
}: UseChatSocketOptions) {
  const socketRef = useRef<WebSocket | null>(null);
  const [connectionState, setConnectionState] = useState<ConnectionState>('idle');

  useEffect(() => {
    if (!enabled || !conversationId) {
      socketRef.current?.close();
      socketRef.current = null;
      setConnectionState('idle');
      return;
    }

    let active = true;
    setConnectionState('connecting');

    try {
      const socket = new WebSocket(messagingApi.getConversationWebSocketUrl(conversationId));
      socketRef.current = socket;

      socket.onopen = () => {
        if (!active) return;
        setConnectionState('open');
      };

      socket.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload?.type === 'message.created' && payload.message) {
            onMessage(payload.message as ApiChatMessage);
            return;
          }
          if (payload?.type === 'error' && payload.detail) {
            onError?.(String(payload.detail));
          }
        } catch {
          onError?.('Received an invalid chat message from the server.');
        }
      };

      socket.onerror = () => {
        if (!active) return;
        setConnectionState('error');
        onError?.('The chat connection ran into an unexpected error.');
      };

      socket.onclose = () => {
        if (!active) return;
        setConnectionState('closed');
      };
    } catch (error) {
      setConnectionState('error');
      onError?.(error instanceof Error ? error.message : 'Failed to open the chat connection.');
    }

    return () => {
      active = false;
      socketRef.current?.close();
      socketRef.current = null;
    };
  }, [conversationId, enabled, onError, onMessage]);

  const sendMessage = useCallback((payload: SendMessagePayload) => {
    const socket = socketRef.current;
    if (!socket || socket.readyState !== WebSocket.OPEN) {
      throw new Error('Chat is not connected yet.');
    }

    socket.send(
      JSON.stringify({
        action: 'message.send',
        payload,
      })
    );
  }, []);

  return { connectionState, sendMessage };
}
