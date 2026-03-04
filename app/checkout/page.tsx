'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import Navbar from '@/components/navbar';
import Footer from '@/components/footer';
import RequireAuth from '@/components/require-auth';
import { CreditCard, Lock, CheckCircle, MapPin, Calendar, Users, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { listingsApi, bookingsApi } from '@/lib/api';
import { Property, useAuthStore } from '@/lib/store';

export default function CheckoutPage() {
  const searchParams = useSearchParams();
  const propertyId = searchParams.get('propertyId');
  const user = useAuthStore((s) => s.user);

  const [step, setStep] = useState<'payment' | 'confirmation'>('payment');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [createdBookingId, setCreatedBookingId] = useState<string | null>(null);
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
  const cleaningFee = property?.cleaningFee ?? 25;
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

  const [cardData, setCardData] = useState({
    cardName: '',
    cardNumber: '',
    expiryDate: '',
    cvv: '',
  });

  const handleCardChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    let formattedValue = value;

    if (name === 'cardNumber') {
      formattedValue = value.replace(/\s/g, '').replace(/(\d{4})/g, '$1 ').trim();
    }

    if (name === 'expiryDate') {
      formattedValue = value.replace(/\D/g, '');
      if (formattedValue.length >= 2) {
        formattedValue = formattedValue.slice(0, 2) + '/' + formattedValue.slice(2, 4);
      }
    }

    if (name === 'cvv') {
      formattedValue = value.replace(/\D/g, '').slice(0, 4);
    }

    setCardData((prev) => ({ ...prev, [name]: formattedValue }));
  };

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!propertyId || !checkIn || !checkOut) return;
    setIsProcessing(true);
    setPaymentError(null);
    try {
      const { booking } = await bookingsApi.create({
        listing_id: propertyId,
        check_in: checkIn,
        check_out: checkOut,
        num_guests: guestCount,
      });
      setCreatedBookingId(booking.id);
      await bookingsApi.confirm(booking.id);
      setStep('confirmation');
    } catch (err: unknown) {
      setPaymentError(err instanceof Error ? err.message : 'Booking failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

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
        <a href="/" className="text-primary hover:underline font-medium">Back to Home</a>
      </main>
      <Footer />
    </div>
  ) : (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-12">
        {step === 'payment' ? (
          <>
            {/* Page Title */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8"
            >
              <h1 className="font-playfair text-4xl font-bold text-foreground">Confirm and Pay</h1>
              <p className="text-muted-foreground mt-2">Complete your booking to secure your reservation</p>
            </motion.div>

            <div className="grid lg:grid-cols-3 gap-8">
              {/* Left Column - Payment Form */}
              <div className="lg:col-span-2">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="space-y-8"
                >
                  {/* Guest Information (from logged-in user) */}
                  <div className="card-elegant p-6 rounded-xl">
                    <h2 className="font-playfair text-2xl font-bold text-foreground mb-6">Guest</h2>
                    <div className="space-y-2 text-foreground">
                      <p className="font-semibold text-lg">{user?.name}</p>
                      <p className="text-muted-foreground">{user?.email}</p>
                    </div>
                  </div>

                  {/* Payment Method */}
                  <div className="card-elegant p-6 rounded-xl">
                    <h2 className="font-playfair text-2xl font-bold text-foreground mb-6">Payment Method</h2>
                    <form onSubmit={handlePayment} className="space-y-4">
                      {/* Card Holder Name */}
                      <div>
                        <label className="block text-sm font-semibold text-foreground mb-2">
                          Name on Card
                        </label>
                        <input
                          type="text"
                          name="cardName"
                          placeholder="Jane Doe"
                          value={cardData.cardName}
                          onChange={handleCardChange}
                          required
                          className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground placeholder-muted-foreground"
                        />
                      </div>

                      {/* Card Number */}
                      <div>
                        <label className="block text-sm font-semibold text-foreground mb-2">
                          <div className="flex items-center gap-2">
                            <CreditCard size={16} />
                            Card Number
                          </div>
                        </label>
                        <input
                          type="text"
                          name="cardNumber"
                          placeholder="4242 4242 4242 4242"
                          value={cardData.cardNumber}
                          onChange={handleCardChange}
                          maxLength="19"
                          required
                          className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground placeholder-muted-foreground font-mono"
                        />
                      </div>

                      {/* Expiry and CVV */}
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-semibold text-foreground mb-2">
                            Expiry Date
                          </label>
                          <input
                            type="text"
                            name="expiryDate"
                            placeholder="MM/YY"
                            value={cardData.expiryDate}
                            onChange={handleCardChange}
                            maxLength="5"
                            required
                            className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground placeholder-muted-foreground font-mono"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-foreground mb-2">
                            <div className="flex items-center gap-2">
                              CVV
                              <Lock size={14} className="text-muted-foreground" />
                            </div>
                          </label>
                          <input
                            type="text"
                            name="cvv"
                            placeholder="123"
                            value={cardData.cvv}
                            onChange={handleCardChange}
                            maxLength="4"
                            required
                            className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground placeholder-muted-foreground font-mono"
                          />
                        </div>
                      </div>

                      {paymentError && (
                        <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                          {paymentError}
                        </div>
                      )}

                      {/* Agree to Terms */}
                      <label className="flex items-start gap-3 py-4 border-t border-border">
                        <input
                          type="checkbox"
                          defaultChecked
                          className="w-4 h-4 rounded border-border cursor-pointer accent-primary mt-1 flex-shrink-0"
                        />
                        <span className="text-sm text-foreground">
                          I agree to the{' '}
                          <a href="#" className="text-primary hover:underline">
                            Cancellation Policy
                          </a>{' '}
                          and confirm that the information provided is accurate.
                        </span>
                      </label>

                      {/* Submit Button */}
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
                            Pay ${booking.total}
                          </>
                        )}
                      </motion.button>
                    </form>
                  </div>
                </motion.div>
              </div>

              {/* Right Column - Order Summary */}
              <div>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="card-elegant p-6 rounded-xl sticky top-24 space-y-6"
                >
                  {/* Property Image */}
                  <img
                    src={property.images[0]}
                    alt={property.title}
                    className="w-full aspect-video object-cover rounded-lg"
                  />

                  {/* Property Details */}
                  <div>
                    <h3 className="font-playfair font-bold text-lg text-foreground mb-2">
                      {property.title}
                    </h3>
                    <p className="text-muted-foreground flex items-center gap-2 text-sm">
                      <MapPin size={16} />
                      {property.location}
                    </p>
                  </div>

                  {/* Booking Info */}
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

                  {/* Price Breakdown */}
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        ${booking.pricePerNight} × {booking.nights} nights
                      </span>
                      <span className="text-foreground font-medium">${booking.subtotal}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Service fee</span>
                      <span className="text-foreground font-medium">${booking.serviceFee}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Cleaning fee</span>
                      <span className="text-foreground font-medium">${cleaningFee}</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold pt-3 border-t border-border">
                      <span>Total</span>
                      <span className="text-primary">${booking.total}</span>
                    </div>
                  </div>

                  {/* Security Badge */}
                  <div className="flex items-center justify-center gap-2 p-3 bg-green-50 rounded-lg text-sm text-green-700">
                    <Lock size={16} />
                    Secure payment powered by Stripe
                  </div>
                </motion.div>
              </div>
            </div>
          </>
        ) : (
          /* Confirmation Screen */
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

            <h1 className="font-playfair text-4xl font-bold text-foreground mb-4">
              Booking Confirmed!
            </h1>
            <p className="text-lg text-muted-foreground mb-8">
              Thank you for your reservation. A confirmation email has been sent to your inbox.
            </p>

            {/* Confirmation Details */}
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
                  <p className="font-semibold text-lg text-primary">${booking.total}</p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
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
