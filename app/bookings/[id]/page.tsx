'use client';

import { Suspense, useEffect, useState, useCallback, useRef } from 'react';
import Script from 'next/script';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/navbar';
import Footer from '@/components/footer';
import RequireAuth from '@/components/require-auth';
import CancelBookingDialog from '@/components/cancel-booking-dialog';
import ChatSheet from '@/components/chat/chat-sheet';
import WriteReviewModal from '@/components/write-review-modal';
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Users,
  Loader2,
  ExternalLink,
  Home,
  XCircle,
  CreditCard,
  AlertCircle,
  Clock,
  Star,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { bookingsApi, createIdempotencyKey, type ApiBookingDetail } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
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

const formatCountdown = (seconds: number) => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
};

declare global {
  interface Window {
    Razorpay?: new (opts: {
      key: string;
      amount?: number;
      currency?: string;
      order_id: string;
      name?: string;
      description?: string;
      prefill?: { name?: string; email?: string };
      handler: (r: { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string }) => void;
      modal?: { ondismiss?: () => void };
    }) => { open: () => void; on: (event: string, handler: () => void) => void };
  }
}

function BookingDetailPageContent() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const bookingId = params.id as string;

  const user = useAuthStore((s) => s.user);
  const [booking, setBooking] = useState<ApiBookingDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const [isRetryingPayment, setIsRetryingPayment] = useState(false);
  const [retryError, setRetryError] = useState<string | null>(null);
  const [isAutoCancelling, setIsAutoCancelling] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const retryPaymentIdempotencyKeyRef = useRef<string | null>(null);

  const refetchBooking = useCallback(() => {
    if (!bookingId) return;
    bookingsApi.getById(bookingId).then(setBooking);
  }, [bookingId]);

  const isHost = booking && user && String(user.id) === String(booking.host.id);
  const isCancelled = booking && (booking.status === 'cancelled_by_guest' || booking.status === 'cancelled_by_host');
  const cancelledByGuest = booking?.status === 'cancelled_by_guest';
  const cancelledByHost = booking?.status === 'cancelled_by_host';

  const handleCancel = async () => {
    if (!booking?.id || !booking.can_be_cancelled || isCancelling) return;
    setIsCancelling(true);
    setCancelError(null);
    try {
      const res = await bookingsApi.cancel(booking.id);
      setBooking(res.booking);
      setShowCancelDialog(false);
    } catch (err) {
      setCancelError(err instanceof Error ? err.message : 'Failed to cancel booking.');
    } finally {
      setIsCancelling(false);
    }
  };

  const openCancelDialog = () => setShowCancelDialog(true);

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

  const isPendingPayment = booking?.status === 'pending_payment';
  const isGuest = booking && user && String(user.id) === String(booking.guest.id);
  const retryAllowed = isPendingPayment && isGuest && !booking?.payment_retry_disallowed;
  const isChatAvailable = booking?.status === 'pending_payment' || booking?.status === 'confirmed';
  const chatRequestedFromUrl = searchParams.get('chat') === 'open';

  const syncChatQuery = useCallback((nextOpen: boolean) => {
    if (!bookingId) return;
    const nextUrl = nextOpen ? `/bookings/${bookingId}?chat=open` : `/bookings/${bookingId}`;
    router.replace(nextUrl, { scroll: false });
  }, [bookingId, router]);

  useEffect(() => {
    if (!booking) return;
    if (!isChatAvailable) {
      setIsChatOpen(false);
      if (chatRequestedFromUrl) {
        syncChatQuery(false);
      }
    }
  }, [booking, chatRequestedFromUrl, isChatAvailable, syncChatQuery]);

  useEffect(() => {
    if (isChatAvailable && chatRequestedFromUrl) {
      setIsChatOpen(true);
    }
    if (!chatRequestedFromUrl) {
      setIsChatOpen(false);
    }
  }, [chatRequestedFromUrl, isChatAvailable]);

  const retryBookingId = booking?.id;
  const retryDeadlineSeconds = booking?.payment_deadline_seconds ?? 0;

  useEffect(() => {
    if (!retryAllowed || !retryBookingId) {
      setSecondsLeft(null);
      retryPaymentIdempotencyKeyRef.current = null;
      return;
    }
    if (retryDeadlineSeconds <= 0) {
      setSecondsLeft(0);
      return;
    }
    // Non-overridable: derive remaining time from backend-provided seconds.
    // Reloading cannot extend it (backend recomputes remaining).
    const deadline = Date.now() + retryDeadlineSeconds * 1000;
    const tick = () => {
      const remaining = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
      setSecondsLeft(remaining);
      if (remaining <= 0) {
        clearInterval(iv);
        // Auto-cancel if payment was not completed within the window.
        if (!isAutoCancelling) {
          setIsAutoCancelling(true);
          bookingsApi
            .cancel(retryBookingId, 'Payment window expired (15 minutes).')
            .then((res) => setBooking(res.booking))
            .catch(() => refetchBooking())
            .finally(() => setIsAutoCancelling(false));
        } else {
          refetchBooking();
        }
      }
    };
    tick();
    const iv = setInterval(tick, 1000);
    return () => clearInterval(iv);
  }, [retryAllowed, retryBookingId, retryDeadlineSeconds, refetchBooking, isAutoCancelling]);

  const handleRetryPayment = async () => {
    if (!booking?.id || !retryAllowed || secondsLeft !== null && secondsLeft <= 0 || isRetryingPayment) return;
    setIsRetryingPayment(true);
    setRetryError(null);
    if (!retryPaymentIdempotencyKeyRef.current) {
      retryPaymentIdempotencyKeyRef.current = createIdempotencyKey(`payment_retry_${booking.id}`);
    }
    try {
      const payment = await bookingsApi.retryPayment(booking.id, {
        idempotencyKey: retryPaymentIdempotencyKeyRef.current,
      });
      const orderId = payment.order_id;
      const razorpayKeyId = payment.razorpay_key_id;
      if (typeof window !== 'undefined' && window.Razorpay && orderId && razorpayKeyId) {
        const rzp = new window.Razorpay({
          key: razorpayKeyId,
          order_id: orderId,
          name: 'WanderLeaf',
          description: `Booking: ${booking.listing.title}`,
          prefill: { name: user?.name ?? undefined, email: user?.email ?? undefined },
          handler: async (res) => {
            try {
              await bookingsApi.verifyPayment(booking.id, {
                razorpay_order_id: res.razorpay_order_id,
                razorpay_payment_id: res.razorpay_payment_id,
                razorpay_signature: res.razorpay_signature,
              });
              retryPaymentIdempotencyKeyRef.current = null;
              refetchBooking();
            } catch (e) {
              setRetryError(e instanceof Error ? e.message : 'Payment verification failed.');
              refetchBooking();
            } finally {
              setIsRetryingPayment(false);
            }
          },
          modal: { ondismiss: () => setIsRetryingPayment(false) },
        });
        rzp.open();
      } else {
        setRetryError('Payment gateway is not available.');
      }
    } catch (err) {
      setRetryError(err instanceof Error ? err.message : 'Failed to start payment.');
    } finally {
      if (!(typeof window !== 'undefined' && window.Razorpay)) setIsRetryingPayment(false);
    }
  };

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
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="afterInteractive" />
      <Navbar />

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        {/* Back link */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mb-8"
        >
          <Link
            href={isHost ? `/host/bookings/${booking.listing.id}` : '/dashboard?tab=trips'}
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft size={18} />
            {isHost ? 'Back to property bookings' : 'Back to My Trips'}
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
                    ₹{booking.price_per_night} × {booking.num_nights} nights
                  </span>
                  <span className="text-foreground font-medium">₹{booking.subtotal}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Service fee</span>
                  <span className="text-foreground font-medium">₹{booking.service_fee}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Cleaning fee</span>
                  <span className="text-foreground font-medium">₹{booking.cleaning_fee}</span>
                </div>
                <div className="flex justify-between text-lg font-bold pt-3 border-t border-border">
                  <span>Total</span>
                  <span className="text-primary">₹{booking.total_price}</span>
                </div>
              </div>
              {/* Refund info for cancelled bookings */}
              {isCancelled && (booking.refund_amount != null && booking.refund_amount > 0) && (
                <div className="mt-4 pt-4 border-t border-border">
                  <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
                    <CreditCard size={16} />
                    <span className="text-sm font-medium">
                      Refund of ₹{booking.refund_amount} initiated
                      {booking.refunded_at && (
                        <span className="text-muted-foreground font-normal">
                          {' '}on {formatDate(booking.refunded_at)}. Will reflect in 5–7 working days.
                        </span>
                      )}
                    </span>
                  </div>
                </div>
              )}
              {isCancelled && booking.refund_failed && (
                <div className="mt-4 pt-4 border-t border-border">
                  <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
                    <AlertCircle size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-amber-800 dark:text-amber-200">
                      <p className="font-medium">Refund could not be processed automatically</p>
                      <p className="mt-0.5 text-amber-700 dark:text-amber-300">
                        Please contact support with booking ID: <span className="font-mono font-semibold">{booking.id.slice(0, 8).toUpperCase()}</span>
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>

            {/* Pending payment: retry or contact support */}
            {!isHost && isPendingPayment && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.28 }}
                className="card-elegant p-6 rounded-xl"
              >
                <h3 className="font-semibold text-foreground mb-4">Complete payment</h3>
                {booking.payment_retry_disallowed ? (
                  <div className="space-y-3">
                    <div className="flex items-start gap-3 p-4 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
                      <AlertCircle size={20} className="text-amber-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-amber-800 dark:text-amber-200">
                          Payment verification failed
                        </p>
                        {retryError && (
                          <p className="text-sm text-amber-700 dark:text-amber-300 mt-1 font-medium">
                            What happened: {retryError}
                          </p>
                        )}
                        <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                          Your payment may have been processed. Do not retry as you could be charged twice.
                        </p>
                        <p className="text-sm text-amber-700 dark:text-amber-300 mt-2">
                          Please contact support with your booking ID: <span className="font-mono font-semibold">{booking.id.slice(0, 8).toUpperCase()}</span>
                        </p>
                      </div>
                    </div>
                  </div>
                ) : secondsLeft !== null && secondsLeft <= 0 ? (
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      Payment window expired. This booking has been cancelled and dates freed.
                    </p>
                    <button
                      onClick={refetchBooking}
                      className="text-sm text-primary hover:underline font-medium"
                    >
                      Refresh to see updated status
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300">
                      <Clock size={18} />
                      <span className="font-medium">
                        {secondsLeft !== null && secondsLeft > 0
                          ? `${formatCountdown(secondsLeft)} left to pay`
                          : 'Payment pending'}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Complete payment within 15 minutes or this booking will be automatically cancelled.
                    </p>
                    {retryError && (
                      <p className="text-sm text-destructive">{retryError}</p>
                    )}
                    <button
                      onClick={handleRetryPayment}
                      disabled={isRetryingPayment || (secondsLeft !== null && secondsLeft <= 0)}
                      className="w-full py-3 rounded-lg bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {isRetryingPayment ? (
                        <Loader2 size={20} className="animate-spin" />
                      ) : (
                        <CreditCard size={20} />
                      )}
                      {isRetryingPayment ? 'Opening payment...' : 'Retry payment'}
                    </button>
                  </div>
                )}
              </motion.div>
            )}

            {/* Write a review (guests only) */}
            {!isHost && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.28 }}
                className="card-elegant p-6 rounded-xl"
              >
                <h3 className="font-semibold text-foreground mb-4">Leave a review</h3>
                {booking.can_write_review ? (
                  <>
                    <p className="text-sm text-muted-foreground mb-4">
                      Share your experience to help other guests and the host.
                    </p>
                    <button
                      onClick={() => setShowReviewModal(true)}
                      className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
                    >
                      <Star size={18} />
                      Write a review
                    </button>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    {booking.existing_review_id
                      ? "You've already left a review for this stay."
                      : booking.status === 'pending_payment'
                        ? 'Complete your payment to leave a review after your stay.'
                        : new Date(booking.check_out) > new Date()
                          ? `You can leave a review after your checkout on ${formatDate(booking.check_out)}.`
                          : 'You can leave a review for this stay.'}
                  </p>
                )}
              </motion.div>
            )}

            {/* Host (only for guests) or Guest (for hosts) */}
            {!isHost && (
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
                {isChatAvailable && (
                  <button
                    onClick={() => {
                      setIsChatOpen(true);
                      syncChatQuery(true);
                    }}
                    className="mt-4 flex items-center justify-center gap-2 w-full py-2.5 rounded-lg border border-primary text-primary font-medium hover:bg-primary/5 transition-colors"
                  >
                    Contact Owner
                  </button>
                )}
              </motion.div>
            )}

            {/* Guest info for hosts */}
            {isHost && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="card-elegant p-6 rounded-xl"
              >
                <h3 className="font-semibold text-foreground mb-4">Guest</h3>
                <div className="flex items-center gap-4">
                  <img
                    src={getAvatarUrl(booking.guest.avatar, booking.guest.name)}
                    alt={booking.guest.name}
                    className="w-14 h-14 rounded-full object-cover"
                  />
                  <div>
                    <p className="font-medium text-foreground">{booking.guest.name}</p>
                    <p className="text-sm text-muted-foreground">{booking.guest.email}</p>
                  </div>
                </div>
                {isChatAvailable && (
                  <button
                    onClick={() => {
                      setIsChatOpen(true);
                      syncChatQuery(true);
                    }}
                    className="mt-4 flex items-center justify-center gap-2 w-full py-2.5 rounded-lg border border-primary text-primary font-medium hover:bg-primary/5 transition-colors"
                  >
                    Contact Customer
                  </button>
                )}
              </motion.div>
            )}

            {/* Cancel booking (host only) */}
            {isHost && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
                className="card-elegant p-6 rounded-xl"
              >
                <h3 className="font-semibold text-foreground mb-4">Cancel booking</h3>
                {cancelledByGuest && (
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                      The guest cancelled this booking. The dates are freed and no further action is needed.
                    </p>
                    <button
                      disabled
                      className="w-full py-2.5 rounded-lg bg-muted text-muted-foreground cursor-not-allowed text-sm font-medium"
                    >
                      User already cancelled this booking
                    </button>
                  </div>
                )}
                {cancelledByHost && (
                  <p className="text-sm text-muted-foreground">
                    You cancelled this booking. The dates have been freed for the property.
                  </p>
                )}
                {!isCancelled && booking.can_be_cancelled && (
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                      Cancel this reservation to free up the dates. The guest will receive a full refund and will no longer see it in their trips.
                    </p>
                    {cancelError && (
                      <p className="text-sm text-destructive">{cancelError}</p>
                    )}
                    <button
                      onClick={openCancelDialog}
                      disabled={isCancelling}
                      className="w-full py-2.5 rounded-lg bg-destructive/10 text-destructive font-medium hover:bg-destructive/20 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {isCancelling ? (
                        <Loader2 size={18} className="animate-spin" />
                      ) : (
                        <XCircle size={18} />
                      )}
                      {isCancelling ? 'Cancelling...' : 'Cancel booking'}
                    </button>
                  </div>
                )}
              </motion.div>
            )}

            {/* Cancel booking (guest only) */}
            {!isHost && !isCancelled && booking.can_be_cancelled && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
                className="card-elegant p-6 rounded-xl"
              >
                <h3 className="font-semibold text-foreground mb-4">Cancel booking</h3>
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Cancel this reservation? You will receive a full refund and the dates will be freed for the property.
                  </p>
                  {cancelError && (
                    <p className="text-sm text-destructive">{cancelError}</p>
                  )}
                  <button
                    onClick={openCancelDialog}
                    disabled={isCancelling}
                    className="w-full py-2.5 rounded-lg bg-destructive/10 text-destructive font-medium hover:bg-destructive/20 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isCancelling ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : (
                      <XCircle size={18} />
                    )}
                    {isCancelling ? 'Cancelling...' : 'Cancel booking'}
                  </button>
                </div>
              </motion.div>
            )}

            <CancelBookingDialog
              open={showCancelDialog}
              onOpenChange={(open) => { if (!open) setShowCancelDialog(false); }}
              isHost={!!isHost}
              isCancelling={isCancelling}
              onConfirm={handleCancel}
            />
          </div>
        </div>
      </main>

      <Footer />
      {booking && user && isChatAvailable && (
        <ChatSheet
          open={isChatOpen}
          onOpenChange={(nextOpen) => {
            setIsChatOpen(nextOpen);
            syncChatQuery(nextOpen);
          }}
          booking={booking}
          currentUserId={String(user.id)}
          isHost={Boolean(isHost)}
        />
      )}
      {booking && (
        <WriteReviewModal
          open={showReviewModal}
          onOpenChange={setShowReviewModal}
          bookingId={booking.id}
          listingTitle={booking.listing.title}
          onSuccess={refetchBooking}
        />
      )}
    </div>
  );

  return <RequireAuth>{pageContent}</RequireAuth>;
}

export default function BookingDetailPage() {
  return (
    <Suspense fallback={null}>
      <BookingDetailPageContent />
    </Suspense>
  );
}
