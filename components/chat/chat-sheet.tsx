'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Avatar,
  ConversationHeader,
} from '@chatscope/chat-ui-kit-react';
import { Loader2, Wifi, WifiOff } from 'lucide-react';
import {
  messagingApi,
  type ApiBookingDetail,
  type ApiChatMessage,
  type ApiConversation,
} from '@/lib/api';
import { getAvatarUrl } from '@/lib/avatar';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import ChatComposer from '@/components/chat/chat-composer';
import ChatThread from '@/components/chat/chat-thread';
import { useChatSocket } from '@/components/chat/use-chat-socket';

interface ChatSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  booking: ApiBookingDetail;
  currentUserId: string;
  isHost: boolean;
}

const upsertMessage = (previous: ApiChatMessage[], next: ApiChatMessage) => {
  const alreadyExists = previous.some((message) => message.id === next.id);
  if (alreadyExists) {
    return previous.map((message) => (message.id === next.id ? next : message));
  }
  return [...previous, next];
};

export default function ChatSheet({
  open,
  onOpenChange,
  booking,
  currentUserId,
  isHost,
}: ChatSheetProps) {
  const [conversation, setConversation] = useState<ApiConversation | null>(null);
  const [messages, setMessages] = useState<ApiChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSending, setIsSending] = useState(false);

  const counterpart = useMemo(
    () => (isHost ? booking.guest : booking.host),
    [booking.guest, booking.host, isHost]
  );

  const bootstrapConversation = useCallback(async () => {
    if (!open) return;
    setIsLoading(true);
    setError(null);

    try {
      const response = await messagingApi.getConversationForBooking(booking.id);
      setConversation(response);
      setMessages(response.messages);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load chat.');
    } finally {
      setIsLoading(false);
    }
  }, [booking.id, open]);

  useEffect(() => {
    if (!open) {
      setConversation(null);
      setMessages([]);
      setError(null);
      setDraft('');
      setSelectedFile(null);
      return;
    }
    bootstrapConversation();
  }, [bootstrapConversation, open]);

  const handleSocketMessage = useCallback((message: ApiChatMessage) => {
    setMessages((previous) => upsertMessage(previous, message));
  }, []);

  const handleSocketError = useCallback((message: string) => {
    setError(message);
  }, []);

  const { connectionState, sendMessage } = useChatSocket({
    conversationId: conversation?.id,
    enabled: open && Boolean(conversation?.is_chat_available),
    onMessage: handleSocketMessage,
    onError: handleSocketError,
  });

  const handleSend = useCallback(async (text: string) => {
    if (!conversation) return;

    const trimmedText = text.trim();
    if (!trimmedText && !selectedFile) return;

    setIsSending(true);
    setError(null);

    try {
      let attachmentPayload:
        | {
            attachment_url?: string;
            attachment_name?: string;
            attachment_mime?: string;
            attachment_bytes?: number | null;
            message_type?: 'image' | 'file';
          }
        | undefined;

      if (selectedFile) {
        const uploaded = await messagingApi.uploadAttachment(conversation.id, selectedFile);
        attachmentPayload = uploaded;
      }

      sendMessage({
        body: trimmedText,
        message_type: attachmentPayload?.message_type ?? 'text',
        attachment_url: attachmentPayload?.attachment_url,
        attachment_name: attachmentPayload?.attachment_name,
        attachment_mime: attachmentPayload?.attachment_mime,
        attachment_bytes: attachmentPayload?.attachment_bytes ?? null,
      });

      setDraft('');
      setSelectedFile(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send chat message.');
    } finally {
      setIsSending(false);
    }
  }, [conversation, selectedFile, sendMessage]);

  const connectionLabel = {
    idle: 'Loading chat',
    connecting: 'Connecting',
    open: 'Live',
    closed: 'Disconnected',
    error: 'Connection error',
  }[connectionState];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-2xl p-0">
        <SheetHeader className="border-b border-border px-6 py-4">
          <SheetTitle className="text-xl">Booking chat</SheetTitle>
          <SheetDescription>
            Message {counterpart.name} about your stay at {booking.listing.title}.
          </SheetDescription>
        </SheetHeader>

        <div className="flex h-[calc(100vh-92px)] flex-col">
          <div className="border-b border-border px-6 py-4">
            <ConversationHeader>
              <Avatar
                src={getAvatarUrl(counterpart.avatar, counterpart.name)}
                name={counterpart.name}
              />
              <ConversationHeader.Content
                userName={counterpart.name}
                info={counterpart.email}
              />
            </ConversationHeader>
            <div className="mt-3 flex justify-end">
              <div className="flex items-center gap-2 rounded-full border border-border px-3 py-1 text-xs text-muted-foreground">
                {connectionState === 'open' ? <Wifi size={14} /> : <WifiOff size={14} />}
                <span>{connectionLabel}</span>
              </div>
            </div>
          </div>

          <div className="min-h-0 flex-1">
            {isLoading ? (
              <div className="flex h-full items-center justify-center">
                <div className="flex items-center gap-3 text-muted-foreground">
                  <Loader2 size={18} className="animate-spin" />
                  <span>Loading conversation...</span>
                </div>
              </div>
            ) : error ? (
              <div className="flex h-full items-center justify-center px-6 text-center">
                <div className="space-y-3">
                  <p className="font-medium text-foreground">Unable to open chat</p>
                  <p className="text-sm text-muted-foreground">{error}</p>
                </div>
              </div>
            ) : conversation ? (
              <div className="flex h-full flex-col">
                <div className="border-b border-border bg-muted/20 px-6 py-3 text-sm text-muted-foreground">
                  Status: {conversation.booking_status_display}
                </div>
                <div className="min-h-0 flex-1">
                  <ChatThread messages={messages} currentUserId={currentUserId} />
                </div>
                <div className="border-t border-border px-4 py-4">
                  <ChatComposer
                    draft={draft}
                    onDraftChange={setDraft}
                    onSend={handleSend}
                    selectedFile={selectedFile}
                    onSelectFile={setSelectedFile}
                    disabled={isSending || connectionState !== 'open'}
                  />
                </div>
              </div>
            ) : (
              <div className="flex h-full items-center justify-center px-6 text-center text-sm text-muted-foreground">
                Chat is unavailable for this booking.
              </div>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
