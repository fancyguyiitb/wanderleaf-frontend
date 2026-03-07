'use client';

import { useEffect, useMemo, useRef } from 'react';
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

  const currentBookingWithOpenChat = useMemo(() => {
    const match = pathname?.match(/^\/bookings\/([^/]+)$/);
    if (!match) return null;
    if (searchParams.get('chat') !== 'open') return null;
    return match[1];
  }, [pathname, searchParams]);

  useEffect(() => {
    currentOpenBookingRef.current = currentBookingWithOpenChat;
  }, [currentBookingWithOpenChat]);

  useEffect(() => {
    if (!authReady || !isAuthenticated || !user?.id) {
      socketRef.current?.close();
      socketRef.current = null;
      return;
    }

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
            message.body ||
            message.attachment_name ||
            `Open chat for ${bookingTitle} to reply.`,
          action: {
            label: 'Open chat',
            onClick: () => router.push(`/bookings/${bookingId}?chat=open`),
          },
        });
      } catch {
        // Ignore malformed websocket payloads here; booking-local chat handles explicit errors.
      }
    };

    return () => {
      socket.close();
      if (socketRef.current === socket) {
        socketRef.current = null;
      }
    };
  }, [authReady, isAuthenticated, router, user?.id]);

  return null;
}
