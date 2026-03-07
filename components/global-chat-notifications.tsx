'use client';

import { useEffect, useMemo, useRef } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import {
  bookingsApi,
  messagingApi,
  type ApiBooking,
  type ApiChatMessage,
  type ApiConversation,
} from '@/lib/api';
import { useAuthStore } from '@/lib/store';

type ConversationEntry = {
  bookingId: string;
  bookingTitle: string;
  conversation: ApiConversation;
};

const ACTIVE_CHAT_STATUSES = new Set(['pending_payment', 'confirmed']);

const uniqueBookings = (bookings: ApiBooking[]) => {
  const byId = new Map<string, ApiBooking>();
  bookings.forEach((booking) => {
    if (!ACTIVE_CHAT_STATUSES.has(booking.status)) return;
    byId.set(booking.id, booking);
  });
  return Array.from(byId.values());
};

export default function GlobalChatNotifications() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const authReady = useAuthStore((s) => s.authReady);

  const socketsRef = useRef<Map<string, WebSocket>>(new Map());
  const toastKeysRef = useRef<Set<string>>(new Set());

  const currentBookingWithOpenChat = useMemo(() => {
    const match = pathname?.match(/^\/bookings\/([^/]+)$/);
    if (!match) return null;
    if (searchParams.get('chat') !== 'open') return null;
    return match[1];
  }, [pathname, searchParams]);

  useEffect(() => {
    if (!authReady || !isAuthenticated || !user?.id) {
      socketsRef.current.forEach((socket) => socket.close());
      socketsRef.current.clear();
      return;
    }

    let cancelled = false;

    const connectNotifications = async () => {
      try {
        const [guestBookingsResponse, hostBookingsResponse] = await Promise.all([
          bookingsApi.list(),
          bookingsApi.listForHost(),
        ]);

        const guestBookings = Array.isArray(guestBookingsResponse)
          ? guestBookingsResponse
          : guestBookingsResponse.results;
        const hostBookings = Array.isArray(hostBookingsResponse)
          ? hostBookingsResponse
          : hostBookingsResponse.results;

        const activeBookings = uniqueBookings([...guestBookings, ...hostBookings]);

        const conversations = await Promise.all(
          activeBookings.map(async (booking) => {
            try {
              const conversation = await messagingApi.getConversationForBooking(booking.id);
              return {
                bookingId: booking.id,
                bookingTitle: booking.listing.title,
                conversation,
              } satisfies ConversationEntry;
            } catch {
              return null;
            }
          })
        );

        if (cancelled) return;

        const activeConversationIds = new Set<string>();

        conversations.forEach((entry) => {
          if (!entry || !entry.conversation.is_chat_available) return;

          const { bookingId, bookingTitle, conversation } = entry;
          activeConversationIds.add(conversation.id);

          if (socketsRef.current.has(conversation.id)) return;

          const socket = new WebSocket(messagingApi.getConversationWebSocketUrl(conversation.id));

          socket.onmessage = (event) => {
            try {
              const payload = JSON.parse(event.data);
              if (payload?.type !== 'message.created' || !payload.message) return;

              const message = payload.message as ApiChatMessage;
              if (String(message.sender.id) === String(user.id)) return;
              if (currentBookingWithOpenChat === bookingId) return;

              const toastKey = `${conversation.id}:${message.id}`;
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

          socket.onclose = () => {
            socketsRef.current.delete(conversation.id);
          };

          socketsRef.current.set(conversation.id, socket);
        });

        Array.from(socketsRef.current.entries()).forEach(([conversationId, socket]) => {
          if (!activeConversationIds.has(conversationId)) {
            socket.close();
            socketsRef.current.delete(conversationId);
          }
        });
      } catch {
        // Fail quietly; chat sheet itself still works when opened from a booking page.
      }
    };

    connectNotifications();
    const interval = window.setInterval(connectNotifications, 60000);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
      socketsRef.current.forEach((socket) => socket.close());
      socketsRef.current.clear();
    };
  }, [authReady, currentBookingWithOpenChat, isAuthenticated, router, user?.id]);

  return null;
}
