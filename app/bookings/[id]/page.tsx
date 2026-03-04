'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/navbar';
import Footer from '@/components/footer';
import RequireAuth from '@/components/require-auth';
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Users,
  Loader2,
  ExternalLink,
  Home,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { bookingsApi, type ApiBookingDetail } from '@/lib/api';
import { getAvatarUrl } from '@/lib/avatar';

const formatDate = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

const getStatusColor = (status: string) => {
  switch (status) {
    case 'confirmed':
    case 'completed':
      return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
    case 'pending_payment':
      return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400';
    case 'cancelled_by_guest':
    case 'cancelled_by_host':
    case 'refunded':
      return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
    default:
      return 'bg-muted text-muted-foreground';
  }
};

export default function BookingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const bookingId = params.id as string;

  const [booking, setBooking] = useState<ApiBookingDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!bookingId) return;
    setIsLoading(true);
    setError(null);
    bookingsApi
      .getById(bookingId)
      .then(setBooking)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load booking.'))
      .finally(() => setIsLoading(false));
  }, [bookingId]);

  const pageContent = isLoading ? (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 flex items-center justify-center py-24">
        <div className="flex flex-col items-center gap-4">
          <Loader2 size={40} className="animate-spin text-primary" />
          <p className="text-muted-foreground">Loading booking details...</p>
        </div>
      </main>
      <Footer />
    </div>
  ) : error || !booking ? (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-24 text-center">
        <h1 className="text-2xl font-bold text-foreground mb-4">
          {error || 'Booking not found'}
        </h1>
        <button
          onClick={() => router.push('/dashboard?tab=trips')}
          className="inline-flex items-center gap-2 text-primary hover:underline font-medium"
        >
          <ArrowLeft size={18} />
          Back to My Trips
        </button>
      </main>
      <Footer />
    </div>
  ) : (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        {/* Back link */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mb-8"
        >
          <Link
            href="/dashboard?tab=trips"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft size={18} />
            Back to My Trips
          </Link>
        </motion.div>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h1 className="font-playfair text-3xl md:text-4xl font-bold text-foreground">
              Booking Details
            </h1>
            <span
              className={`px-4 py-2 rounded-full text-sm font-medium ${getStatusColor(booking.status)}`}
            >
              {booking.status_display}
            </span>
          </div>
          <p className="text-muted-foreground mt-2">
            Confirmation #{booking.id.slice(0, 8).toUpperCase()}
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Property card - prominent link to view property */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
            >
              <Link href={`/property/${booking.listing.id}`}>
                <div className="card-elegant rounded-xl overflow-hidden group hover:shadow-xl transition-all duration-300 border-2 border-transparent hover:border-primary/20">
                  <div className="relative aspect-video bg-muted">
                    {booking.listing.images[0] ? (
                      <img
                        src={booking.listing.images[0]}
                        alt={booking.listing.title}
                        className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Home size={48} className="text-muted-foreground" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                      <span className="text-white font-semibold text-lg drop-shadow-lg">
                        {booking.listing.title}
                      </span>
                      <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/90 text-foreground text-sm font-medium">
                        <ExternalLink size={16} />
                        View property
                      </span>
                    </div>
                  </div>
                  <div className="p-5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10 text-primary">
                        <Home size={20} />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{booking.listing.title}</p>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <MapPin size={14} />
                          {booking.listing.location}
                        </p>
                      </div>
                    </div>
                    <span className="text-primary font-semibold group-hover:underline">
                      Check it out →
                    </span>
                  </div>
                </div>
              </Link>
            </motion.div>

            {/* Stay details */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="card-elegant p-6 rounded-xl"
            >
              <h2 className="font-playfair text-xl font-bold text-foreground mb-6">
                Stay details
              </h2>
              <div className="grid sm:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Check-in</p>
                  <p className="font-semibold text-foreground flex items-center gap-2">
                    <Calendar size={18} />
                    {formatDate(booking.check_in)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Check-out</p>
                  <p className="font-semibold text-foreground flex items-center gap-2">
                    <Calendar size={18} />
                    {formatDate(booking.check_out)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Guests</p>
                  <p className="font-semibold text-foreground flex items-center gap-2">
                    <Users size={18} />
                    {booking.num_guests} {booking.num_guests === 1 ? 'guest' : 'guests'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Duration</p>
                  <p className="font-semibold text-foreground">
                    {booking.num_nights} {booking.num_nights === 1 ? 'night' : 'nights'}
                  </p>
                </div>
              </div>
              {booking.special_requests && (
                <div className="mt-6 pt-6 border-t border-border">
                  <p className="text-sm text-muted-foreground mb-1">Special requests</p>
                  <p className="text-foreground">{booking.special_requests}</p>
                </div>
              )}
            </motion.div>
          </div>

          {/* Sidebar - price & host */}
          <div className="space-y-6">
            {/* Price summary */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="card-elegant p-6 rounded-xl sticky top-24"
            >
              <h3 className="font-semibold text-foreground mb-4">Price breakdown</h3>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    ${booking.price_per_night} × {booking.num_nights} nights
                  </span>
                  <span className="text-foreground font-medium">${booking.subtotal}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Service fee</span>
                  <span className="text-foreground font-medium">${booking.service_fee}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Cleaning fee</span>
                  <span className="text-foreground font-medium">${booking.cleaning_fee}</span>
                </div>
                <div className="flex justify-between text-lg font-bold pt-3 border-t border-border">
                  <span>Total</span>
                  <span className="text-primary">${booking.total_price}</span>
                </div>
              </div>
            </motion.div>

            {/* Host */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="card-elegant p-6 rounded-xl"
            >
              <h3 className="font-semibold text-foreground mb-4">Your host</h3>
              <div className="flex items-center gap-4">
                <img
                  src={getAvatarUrl(booking.host.avatar, booking.host.name)}
                  alt={booking.host.name}
                  className="w-14 h-14 rounded-full object-cover"
                />
                <div>
                  <p className="font-medium text-foreground">{booking.host.name}</p>
                  <p className="text-sm text-muted-foreground">{booking.host.email}</p>
                </div>
              </div>
              <Link
                href={`/property/${booking.listing.id}`}
                className="mt-4 flex items-center justify-center gap-2 w-full py-2.5 rounded-lg border border-primary text-primary font-medium hover:bg-primary/5 transition-colors"
              >
                <ExternalLink size={16} />
                View property listing
              </Link>
            </motion.div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );

  return <RequireAuth>{pageContent}</RequireAuth>;
}
