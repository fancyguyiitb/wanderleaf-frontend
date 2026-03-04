'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/navbar';
import Footer from '@/components/footer';
import RequireAuth from '@/components/require-auth';
import { bookingsApi, type ApiBooking } from '@/lib/api';
import { Loader2, ArrowLeft, Calendar, MapPin, Users, Eye } from 'lucide-react';
import { motion } from 'framer-motion';

const formatDate = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

export default function HostPropertyBookingsPage() {
  const params = useParams();
  const router = useRouter();
  const listingId = params.listingId as string;

  const [bookings, setBookings] = useState<ApiBooking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!listingId) return;
    setIsLoading(true);
    setError(null);
    bookingsApi
      .listForHost({ listingId })
      .then((data) => {
        const list = Array.isArray(data) ? data : (data as { results: ApiBooking[] }).results;
        setBookings(list);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load bookings.'))
      .finally(() => setIsLoading(false));
  }, [listingId]);

  const pageContent = isLoading ? (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 flex items-center justify-center py-24">
        <div className="flex flex-col items-center gap-4">
          <Loader2 size={36} className="animate-spin text-primary" />
          <p className="text-muted-foreground">Loading bookings for this property...</p>
        </div>
      </main>
      <Footer />
    </div>
  ) : error ? (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-20 text-center">
        <h1 className="text-2xl font-bold text-foreground mb-4">Unable to load bookings</h1>
        <p className="text-muted-foreground mb-6">{error}</p>
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 text-primary hover:underline font-medium"
        >
          <ArrowLeft size={16} />
          Go back
        </button>
      </main>
      <Footer />
    </div>
  ) : (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 flex items-center justify-between gap-4"
        >
          <div className="space-y-1">
            <h1 className="font-playfair text-3xl font-bold text-foreground">Property bookings</h1>
            {bookings[0] && (
              <p className="text-muted-foreground flex items-center gap-2">
                <MapPin size={16} />
                {bookings[0].listing.title} — {bookings[0].listing.location}
              </p>
            )}
          </div>
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft size={16} />
            Back
          </button>
        </motion.div>

        {bookings.length === 0 ? (
          <div className="card-elegant rounded-xl p-10 text-center">
            <p className="text-lg font-medium text-foreground mb-2">No bookings yet</p>
            <p className="text-muted-foreground">
              When guests book this property, their reservations will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map((booking, index) => (
              <Link key={booking.id} href={`/bookings/${booking.id}`}>
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className="card-elegant rounded-xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border border-border hover:border-primary/30 hover:shadow-lg transition-all cursor-pointer group"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full overflow-hidden bg-muted flex items-center justify-center flex-shrink-0">
                      {booking.guest.avatar ? (
                        <img
                          src={booking.guest.avatar}
                          alt={booking.guest.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-sm font-semibold text-muted-foreground">
                          {booking.guest.name.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-foreground group-hover:text-primary transition-colors">
                        {booking.guest.name}
                      </p>
                      <p className="text-xs text-muted-foreground mb-2">{booking.guest.email}</p>
                      <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar size={14} />
                          {formatDate(booking.check_in)} – {formatDate(booking.check_out)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users size={14} />
                          {booking.num_guests} {booking.num_guests === 1 ? 'guest' : 'guests'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-end sm:items-center gap-3 sm:flex-col sm:items-end flex-1 sm:flex-none justify-between sm:justify-end">
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground mb-1">Total</p>
                      <p className="text-lg font-semibold text-primary">${booking.total_price}</p>
                    </div>
                    <div className="inline-flex items-center gap-2 text-xs px-3 py-1.5 rounded-full bg-muted text-muted-foreground">
                      <span className="font-medium capitalize">{booking.status_display}</span>
                      <Eye size={14} className="text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                  </div>
                </motion.div>
              </Link>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );

  return <RequireAuth>{pageContent}</RequireAuth>;
}

