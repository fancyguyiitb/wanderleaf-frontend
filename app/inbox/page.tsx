'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/navbar';
import Footer from '@/components/footer';
import RequireAuth from '@/components/require-auth';
import { Inbox, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { messagingApi, type ApiInboxItem } from '@/lib/api';
import { getAvatarUrl } from '@/lib/avatar';

function formatRelativeTime(dateStr: string | null): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return d.toLocaleDateString();
}

export default function InboxPage() {
  const router = useRouter();
  const [items, setItems] = useState<ApiInboxItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInbox = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const list = await messagingApi.listInbox();
      setItems(list);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load inbox.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInbox();
  }, [fetchInbox]);

  useEffect(() => {
    const handler = () => fetchInbox();
    window.addEventListener('inbox-update', handler);
    return () => window.removeEventListener('inbox-update', handler);
  }, [fetchInbox]);

  const handleItemClick = (bookingId: string) => {
    router.push(`/bookings/${bookingId}?chat=open`);
  };

  return (
    <RequireAuth>
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />

        <main className="flex-1 max-w-2xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-12">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="font-playfair text-4xl font-bold text-foreground">
              Inbox
            </h1>
            <p className="text-muted-foreground mt-2">
              Your conversations with hosts and guests
            </p>
          </motion.div>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <Loader2 size={40} className="animate-spin text-primary" />
              <p className="text-muted-foreground">Loading messages...</p>
            </div>
          ) : error ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="rounded-xl border border-border bg-card p-6 text-center"
            >
              <p className="text-destructive mb-4">{error}</p>
              <button
                onClick={fetchInbox}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
              >
                Try again
              </button>
            </motion.div>
          ) : items.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="rounded-xl border border-border bg-card p-12 text-center"
            >
              <Inbox size={48} className="mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                No messages yet
              </h3>
              <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                When you book a stay or host guests, your conversations will
                appear here.
              </p>
              <Link
                href="/"
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
              >
                Explore stays
              </Link>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-1 rounded-xl border border-border overflow-hidden bg-card"
            >
              {items.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleItemClick(item.booking_id)}
                  disabled={!item.is_chat_available}
                  className={`w-full flex items-center gap-4 p-4 text-left hover:bg-muted/50 transition-colors border-b border-border last:border-b-0 ${
                    !item.is_chat_available ? 'opacity-60 cursor-not-allowed' : ''
                  }`}
                >
                  <div className="relative flex-shrink-0">
                    <img
                      src={getAvatarUrl(
                        item.other_participant.avatar,
                        item.other_participant.name
                      )}
                      alt={item.other_participant.name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    {item.unread_count > 0 && (
                      <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1.5 flex items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-semibold">
                        {item.unread_count > 99 ? '99+' : item.unread_count}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`font-semibold text-foreground truncate ${
                          item.unread_count > 0 ? 'font-bold' : ''
                        }`}
                      >
                        {item.other_participant.name}
                      </span>
                      <span className="text-xs text-muted-foreground flex-shrink-0">
                        {formatRelativeTime(item.last_message_at)}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      {item.booking_title}
                    </p>
                    {item.last_message && (
                      <p
                        className={`text-sm truncate mt-0.5 ${
                          item.unread_count > 0
                            ? 'text-foreground font-medium'
                            : 'text-muted-foreground'
                        }`}
                      >
                        {item.last_message}
                      </p>
                    )}
                  </div>
                </button>
              ))}
            </motion.div>
          )}
        </main>

        <Footer />
      </div>
    </RequireAuth>
  );
}
