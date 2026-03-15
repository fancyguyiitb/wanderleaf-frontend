'use client';

import { useCallback, useEffect, useMemo, useRef } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import {
  messagingApi,
  type ApiChatNotification,
} from '@/lib/api';
import { useAuthStore } from '@/lib/store';

export default function GlobalChatNotifications() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const authReady = useAuthStore((s) => s.authReady);

  const socketRef = useRef<WebSocket | null>(null);
  const toastKeysRef = useRef<Set<string>>(new Set());
  const currentOpenBookingRef = useRef<string | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const routerRef = useRef(router);
  routerRef.current = router;

  const currentBookingWithOpenChat = useMemo(() => {
    const match = pathname?.match(/^\/bookings\/([^/]+)$/);
    if (!match) return null;
    if (searchParams.get('chat') !== 'open') return null;
    return match[1];
  }, [pathname, searchParams]);

  useEffect(() => {
    currentOpenBookingRef.current = currentBookingWithOpenChat;
  }, [currentBookingWithOpenChat]);

  const connect = useCallback(() => {
    if (!authReady || !isAuthenticated || !user?.id) return;
    try {
      const socket = new WebSocket(messagingApi.getNotificationsWebSocketUrl());
      socketRef.current = socket;

      socket.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload?.type !== 'notification.message_created' || !payload.notification) return;

          const notification = payload.notification as ApiChatNotification;
          const { booking_id: bookingId, booking_title: bookingTitle, message } = notification;

          if (String(message.sender.id) === String(user.id)) return;
          if (currentOpenBookingRef.current === bookingId) return;

          const toastKey = `${notification.conversation_id}:${message.id}`;
          if (toastKeysRef.current.has(toastKey)) return;
          toastKeysRef.current.add(toastKey);

          toast(`${message.sender.name} sent a message`, {
            description:
              (message.is_encrypted ? 'Encrypted message' : message.body) ||
              message.attachment_name ||
              `Open chat for ${bookingTitle} to reply.`,
            action: {
              label: 'Open chat',
              onClick: () => routerRef.current.push(`/bookings/${bookingId}?chat=open`),
            },
          });
          window.dispatchEvent(new CustomEvent('inbox-update', { detail: { newMessage: true } }));
        } catch {
          // Ignore malformed websocket payloads
        }
      };

      socket.onclose = () => {
        if (socketRef.current === socket) {
          socketRef.current = null;
          reconnectTimeoutRef.current = setTimeout(connect, 3000);
        }
      };

      socket.onerror = () => socket.close();
    } catch {
      reconnectTimeoutRef.current = setTimeout(connect, 3000);
    }
  }, [authReady, isAuthenticated, user?.id]);

  useEffect(() => {
    if (!authReady || !isAuthenticated || !user?.id) {
      socketRef.current?.close();
      socketRef.current = null;
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      return;
    }
    connect();
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      socketRef.current?.close();
      socketRef.current = null;
    };
  }, [authReady, isAuthenticated, user?.id, connect]);

  return null;
}
