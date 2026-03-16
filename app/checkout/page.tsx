'use client';

import { Suspense, useEffect, useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import Script from 'next/script';
import { useSearchParams } from 'next/navigation';
import Navbar from '@/components/navbar';
import Footer from '@/components/footer';
import RequireAuth from '@/components/require-auth';
import { CreditCard, Lock, CheckCircle, MapPin, Calendar, Users, Loader2, XCircle, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { listingsApi, bookingsApi, ApiError, createIdempotencyKey, type ApiBookingConflict } from '@/lib/api';
import { Property, useAuthStore } from '@/lib/store';

type Step = 'payment' | 'confirmation' | 'error';
type ErrorType =
  | 'payment_gateway_unavailable'
  | 'booking_failed'
  | 'booking_conflict'
  | 'payment_verification_failed'
  | 'payment_cancelled';

function formatConflictRange(conflict: ApiBookingConflict) {
  const formatDate = (value: string) =>
    new Date(`${value}T00:00:00`).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

  return `${formatDate(conflict.check_in)} to ${formatDate(conflict.check_out)}`;
}

function getConflictDetails(details: unknown): ApiBookingConflict[] {
  if (!details || typeof details !== 'object') return [];

  const conflicts = (details as { conflicts?: unknown }).conflicts;
  if (!Array.isArray(conflicts)) return [];

  return conflicts.filter((conflict): conflict is ApiBookingConflict => {
    if (!conflict || typeof conflict !== 'object') return false;
    const value = conflict as Record<string, unknown>;
    return (
      typeof value.id === 'string' &&
      typeof value.check_in === 'string' &&
      typeof value.check_out === 'string' &&
      typeof value.status === 'string'
    );
  });
}

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

interface RazorpayOptions {
  key: string;
  amount?: number;
  currency?: string;
  order_id: string;
  name?: string;
  description?: string;
  prefill?: { name?: string; email?: string };
  handler: (response: {
    razorpay_payment_id: string;
    razorpay_order_id: string;
    razorpay_signature: string;
  }) => void;
  modal?: { ondismiss?: () => void };
}

interface RazorpayInstance {
  open: () => void;
  on: (event: string, handler: () => void) => void;
}

function ErrorScreen({
  type,
  message,
  bookingId,
  onRetry,
  listingHref,
  conflictSummary,
}: {
  type: ErrorType;
  message: string;
  bookingId?: string | null;
  onRetry?: () => void;
  listingHref?: string | null;
  conflictSummary?: string | null;
}) {
  const Icon = type === 'payment_cancelled' ? AlertCircle : XCircle;
  const iconBg = type === 'payment_cancelled' ? 'bg-amber-100' : 'bg-destructive/10';
  const iconColor = type === 'payment_cancelled' ? 'text-amber-600' : 'text-destructive';

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="max-w-2xl mx-auto text-center py-20"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
        className={`w-20 h-20 rounded-full ${iconBg} flex items-center justify-center mx-auto mb-6`}
      >
        <Icon size={48} className={iconColor} />
      </motion.div>

      <h1 className="font-playfair text-4xl font-bold text-foreground mb-4">
        {type === 'payment_gateway_unavailable' && 'Payment Unavailable'}
        {type === 'booking_failed' && 'Booking Failed'}
        {type === 'booking_conflict' && 'Dates No Longer Available'}
        {type === 'payment_verification_failed' && 'Payment Verification Failed'}
        {type === 'payment_cancelled' && 'Payment Cancelled'}
      </h1>

      <p className="text-lg text-muted-foreground mb-8">{message}</p>

      {type === 'payment_verification_failed' && (
        <p className="text-sm text-amber-600 mb-6 p-4 rounded-lg bg-amber-50 border border-amber-200">
          If you were charged, please contact support with your booking ID. Your payment will be verified manually.
        </p>
      )}

      {type === 'payment_cancelled' && bookingId && (
        <p className="text-sm text-muted-foreground mb-6">
          Your booking is pending. Complete payment from your trips or cancel it.
        </p>
      )}

      {type === 'booking_conflict' && (
        <p className="text-sm text-muted-foreground mb-6 p-4 rounded-lg bg-muted border border-border">
          Availability was refreshed while you were checking out. Return to the listing to pick a new date range.
        </p>
      )}

      {type === 'booking_conflict' && conflictSummary && (
        <p className="text-sm text-destructive mb-6">
          First conflicting stay: {conflictSummary}
        </p>
      )}

      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        {onRetry && (
          <button
            onClick={onRetry}
            className="inline-block px-8 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors"
          >
            Try Again
          </button>
        )}
        {type === 'booking_conflict' && listingHref && (
          <Link href={listingHref}>
            <span className="inline-block px-8 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors">
              View Refreshed Availability
            </span>
          </Link>
        )}
        {bookingId && (
          <Link href={`/bookings/${bookingId}`}>
            <span className="inline-block px-8 py-3 border border-border rounded-lg font-semibold hover:bg-muted transition-colors text-foreground">
              View Booking
            </span>
          </Link>
        )}
        <Link href="/dashboard?tab=trips">
          <span className="inline-block px-8 py-3 border border-border rounded-lg font-semibold hover:bg-muted transition-colors text-foreground">
            My Trips
          </span>
        </Link>
        <Link href="/">
          <span className="inline-block px-8 py-3 text-muted-foreground font-medium hover:text-foreground transition-colors">
            Back to Home
          </span>
        </Link>
      </div>
    </motion.div>
  );
}

function CheckoutPageContent() {
  const searchParams = useSearchParams();
  const propertyId = searchParams.get('propertyId');
  const user = useAuthStore((s) => s.user);
  const createBookingIdempotencyKeyRef = useRef(createIdempotencyKey('booking_create'));

  const [step, setStep] = useState<Step>('payment');
  const [errorType, setErrorType] = useState<ErrorType | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [createdBookingId, setCreatedBookingId] = useState<string | null>(null);
  const [conflicts, setConflicts] = useState<ApiBookingConflict[]>([]);
  const [property, setProperty] = useState<Property | null>(null);
  const [loadingProperty, setLoadingProperty] = useState(true);

  useEffect(() => {
    if (!propertyId) {
      setLoadingProperty(false);
      return;
    }
    setLoadingProperty(true);
    listingsApi
      .getById(propertyId)
      .then((p) => setProperty(p))
      .catch(() => setProperty(null))
      .finally(() => setLoadingProperty(false));
  }, [propertyId]);

  const isOwnerBookingOwnProperty = Boolean(
    user && property && String(user.id) === String(property.host.id)
  );

  const checkIn = searchParams.get('checkIn') || '';
  const checkOut = searchParams.get('checkOut') || '';
  const guestCount = Number(searchParams.get('guests')) || 2;

  const pricePerNight = property?.price ?? 0;
  const nights =
    checkIn && checkOut
      ? Math.max(1, Math.ceil((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24)))
      : 1;
  const subtotal = pricePerNight * nights;
  const serviceFeePercent = property?.serviceFeePercent ?? 12;
  const cleaningFee = property?.cleaningFee ?? 250;
  const serviceFee = Math.round(subtotal * (serviceFeePercent / 100) * 100) / 100;
  const total = subtotal + serviceFee + cleaningFee;

  const booking = {
    property,
    checkIn,
    checkOut,
    guests: guestCount,
    nights,
    pricePerNight,
    subtotal,
    serviceFee,
    total,
  };

  const clearError = useCallback(() => {
    setStep('payment');
    setErrorType(null);
    setErrorMessage(null);
    setConflicts([]);
  }, []);

  const propertySelectionHref = propertyId
    ? (() => {
        const params = new URLSearchParams({
          guests: String(guestCount),
          availabilityUpdated: '1',
        });
        if (checkIn) params.set('checkIn', checkIn);
        if (checkOut) params.set('checkOut', checkOut);
        return `/property/${propertyId}?${params.toString()}`;
      })()
    : null;

  const firstConflictSummary = conflicts.length > 0 ? formatConflictRange(conflicts[0]) : null;

  const handlePayment = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!propertyId || !checkIn || !checkOut) return;
      if (isOwnerBookingOwnProperty) {
        setStep('error');
        setErrorType('booking_failed');
        setErrorMessage('You cannot book your own property.');
        return;
      }
      setIsProcessing(true);
      setErrorType(null);
      setErrorMessage(null);
      setCreatedBookingId(null);
      setConflicts([]);
      let openedRazorpay = false;
      try {
        const availability = await bookingsApi.checkAvailability({
          listing_id: propertyId,
          check_in: checkIn,
          check_out: checkOut,
        });

        if (!availability.is_available) {
          setConflicts(availability.conflicts);
          setStep('error');
          setErrorType('booking_conflict');
          setErrorMessage('Selected dates overlap with an existing booking. Please choose different dates.');
          return;
        }

        const { booking, payment } = await bookingsApi.create(
          {
            listing_id: propertyId,
            check_in: checkIn,
            check_out: checkOut,
            num_guests: guestCount,
          },
          {
            idempotencyKey: createBookingIdempotencyKeyRef.current,
          }
        );
        setCreatedBookingId(booking.id);

        const orderId = payment?.order_id as string | null;
        const razorpayKeyId = payment?.razorpay_key_id as string | null;

        if (!orderId || !razorpayKeyId || typeof window === 'undefined' || !window.Razorpay) {
          setStep('error');
          setErrorType('payment_gateway_unavailable');
          setErrorMessage('Payment gateway is not available. Please contact support.');
          return;
        }

        openedRazorpay = true;
        const rzp = new window.Razorpay({
          key: razorpayKeyId,
          order_id: orderId,
          name: 'WanderLeaf',
          description: `Booking: ${property?.title ?? 'Property'}`,
          prefill: { name: user?.name ?? undefined, email: user?.email ?? undefined },
          handler: async (response: {
            razorpay_payment_id: string;
            razorpay_order_id: string;
            razorpay_signature: string;
          }) => {
            setIsProcessing(true);
            setErrorType(null);
            setErrorMessage(null);
            try {
              await bookingsApi.verifyPayment(booking.id, {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              });
              setStep('confirmation');
            } catch (err: unknown) {
              const msg = err instanceof Error ? err.message : 'Payment verification failed. Please contact support.';
              setStep('error');
              setErrorType('payment_verification_failed');
              setErrorMessage(msg);
            } finally {
              setIsProcessing(false);
            }
          },
          modal: {
            ondismiss: () => {
              setStep('error');
              setErrorType('payment_cancelled');
              setErrorMessage('You closed the payment window. Your booking is saved but not confirmed.');
              setIsProcessing(false);
            },
          },
        });
        rzp.open();
      } catch (err: unknown) {
        if (err instanceof ApiError) {
          if (err.code === 'payment_gateway_unavailable' || err.status === 503) {
            setStep('error');
            setErrorType('payment_gateway_unavailable');
            setErrorMessage(err.message);
          } else if (err.code === 'booking_dates_overlap' || err.status === 409) {
            setConflicts(getConflictDetails(err.details));
            setStep('error');
            setErrorType('booking_conflict');
            setErrorMessage(err.message);
          } else {
            setStep('error');
            setErrorType('booking_failed');
            setErrorMessage(err.message);
          }
        } else {
          setStep('error');
          setErrorType('booking_failed');
          setErrorMessage(err instanceof Error ? err.message : 'Booking failed. Please try again.');
        }
      } finally {
        if (!openedRazorpay) setIsProcessing(false);
      }
    },
    [propertyId, checkIn, checkOut, guestCount, isOwnerBookingOwnProperty, property?.title, user?.name, user?.email]
  );

  const pageContent = loadingProperty ? (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 size={36} className="animate-spin text-primary" />
          <p className="text-muted-foreground">Loading booking details...</p>
        </div>
      </main>
      <Footer />
    </div>
  ) : !property ? (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-20 text-center">
        <h1 className="text-2xl font-bold text-foreground mb-4">Booking Not Found</h1>
        <p className="text-muted-foreground mb-6">The property for this booking could not be loaded.</p>
        <Link href="/" className="text-primary hover:underline font-medium">Back to Home</Link>
      </main>
      <Footer />
    </div>
  ) : isOwnerBookingOwnProperty ? (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-12">
        <ErrorScreen
          type="booking_failed"
          message="You cannot book your own property."
        />
      </main>
      <Footer />
    </div>
  ) : (
    <div className="min-h-screen bg-background flex flex-col">
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="afterInteractive"
      />
      <Navbar />

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-12">
        {step === 'error' && errorType ? (
          <ErrorScreen
            type={errorType}
            message={errorMessage ?? 'An error occurred.'}
            bookingId={createdBookingId}
            onRetry={errorType === 'booking_failed' ? clearError : undefined}
            listingHref={errorType === 'booking_conflict' ? propertySelectionHref : null}
            conflictSummary={errorType === 'booking_conflict' ? firstConflictSummary : null}
          />
        ) : step === 'payment' ? (
          <>
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8"
            >
              <h1 className="font-playfair text-4xl font-bold text-foreground">Confirm and Pay</h1>
              <p className="text-muted-foreground mt-2">Complete your booking to secure your reservation</p>
            </motion.div>

            <div className="grid lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="space-y-8"
                >
                  <div className="card-elegant p-6 rounded-xl">
                    <h2 className="font-playfair text-2xl font-bold text-foreground mb-6">Guest</h2>
                    <div className="space-y-2 text-foreground">
                      <p className="font-semibold text-lg">{user?.name}</p>
                      <p className="text-muted-foreground">{user?.email}</p>
                    </div>
                  </div>

                  <div className="card-elegant p-6 rounded-xl">
                    <h2 className="font-playfair text-2xl font-bold text-foreground mb-6">Payment Method</h2>
                    <form onSubmit={handlePayment} className="space-y-4">
                      <p className="text-muted-foreground text-sm mb-4">
                        You will be redirected to a secure payment page to complete your booking.
                      </p>

                      <label className="flex items-start gap-3 py-4 border-t border-border">
                        <input
                          type="checkbox"
                          defaultChecked
                          className="w-4 h-4 rounded border-border cursor-pointer accent-primary mt-1 flex-shrink-0"
                        />
                        <span className="text-sm text-foreground">
                          I agree to the{' '}
                          <a href="/cancellation" className="text-primary hover:underline">
                            Cancellation Policy
                          </a>{' '}
                          and confirm that the information provided is accurate.
                        </span>
                      </label>

                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        disabled={isProcessing}
                        className="w-full py-4 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        {isProcessing ? (
                          <>
                            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity }}>
                              <Lock size={20} />
                            </motion.div>
                            Processing Payment...
                          </>
                        ) : (
                          <>
                            <CreditCard size={20} />
                            Pay ₹{booking.total}
                          </>
                        )}
                      </motion.button>
                    </form>
                  </div>
                </motion.div>
              </div>

              <div>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="card-elegant p-6 rounded-xl sticky top-24 space-y-6"
                >
                  <img
                    src={property.images[0]}
                    alt={property.title}
                    className="w-full aspect-video object-cover rounded-lg"
                  />
                  <div>
                    <h3 className="font-playfair font-bold text-lg text-foreground mb-2">{property.title}</h3>
                    <p className="text-muted-foreground flex items-center gap-2 text-sm">
                      <MapPin size={16} />
                      {property.location}
                    </p>
                  </div>
                  <div className="space-y-3 border-t border-b border-border py-4">
                    <div className="flex items-center gap-2 text-sm text-foreground">
                      <Calendar size={16} className="text-primary" />
                      <div>
                        <p className="font-semibold">Check-in</p>
                        <p className="text-muted-foreground">{new Date(booking.checkIn).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-foreground">
                      <Calendar size={16} className="text-primary" />
                      <div>
                        <p className="font-semibold">Check-out</p>
                        <p className="text-muted-foreground">{new Date(booking.checkOut).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-foreground">
                      <Users size={16} className="text-primary" />
                      <div>
                        <p className="font-semibold">Guests</p>
                        <p className="text-muted-foreground">{booking.guests} people</p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        ₹{booking.pricePerNight} × {booking.nights} nights
                      </span>
                      <span className="text-foreground font-medium">₹{booking.subtotal}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Service fee</span>
                      <span className="text-foreground font-medium">₹{booking.serviceFee}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Cleaning fee</span>
                      <span className="text-foreground font-medium">₹{cleaningFee}</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold pt-3 border-t border-border">
                      <span>Total</span>
                      <span className="text-primary">₹{booking.total}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-center gap-2 p-3 bg-green-50 rounded-lg text-sm text-green-700">
                    <Lock size={16} />
                    Secure payment powered by Razorpay
                  </div>
                </motion.div>
              </div>
            </div>
          </>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-2xl mx-auto text-center py-20"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6"
            >
              <CheckCircle size={48} className="text-green-600" />
            </motion.div>

            <h1 className="font-playfair text-4xl font-bold text-foreground mb-4">Booking Confirmed!</h1>
            <p className="text-lg text-muted-foreground mb-8">
              Thank you for your reservation. A confirmation email has been sent to your inbox.
            </p>

            <div className="card-elegant p-8 rounded-xl mb-8 text-left space-y-6">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Confirmation Number</p>
                <p className="font-mono font-bold text-lg text-foreground">
                  {createdBookingId ? createdBookingId.slice(0, 8).toUpperCase() : '—'}
                </p>
              </div>
              <div className="border-t border-b border-border py-6 space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Property</p>
                  <p className="font-semibold text-foreground">{property.title}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Dates</p>
                  <p className="font-semibold text-foreground">
                    {new Date(booking.checkIn).toLocaleDateString()} - {new Date(booking.checkOut).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Total Paid</p>
                  <p className="font-semibold text-lg text-primary">₹{booking.total}</p>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/dashboard?tab=trips">
                <motion.span
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="inline-block px-8 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors"
                >
                  View My Bookings
                </motion.span>
              </Link>
              <Link href="/">
                <motion.span
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="inline-block px-8 py-3 border border-border rounded-lg font-semibold hover:bg-muted transition-colors text-foreground"
                >
                  Back to Home
                </motion.span>
              </Link>
            </div>
          </motion.div>
        )}
      </main>

      <Footer />
    </div>
  );

  return <RequireAuth>{pageContent}</RequireAuth>;
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={null}>
      <CheckoutPageContent />
    </Suspense>
  );
}
