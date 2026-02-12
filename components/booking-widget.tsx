'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Users, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BookingWidgetProps {
  pricePerNight: number;
  propertyId: string;
}

export default function BookingWidget({ pricePerNight, propertyId }: BookingWidgetProps) {
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guests, setGuests] = useState(1);
  const [showGuestDropdown, setShowGuestDropdown] = useState(false);

  // Calculate nights and total price
  const nights = checkIn && checkOut ? Math.max(1, Math.ceil((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24))) : 0;
  const subtotal = nights * pricePerNight;
  const serviceFee = Math.round(subtotal * 0.15);
  const total = subtotal + serviceFee;

  const handleBooking = () => {
    if (!checkIn || !checkOut) {
      alert('Please select check-in and check-out dates');
      return;
    }
    // Navigate to checkout or booking confirmation
    console.log({ propertyId, checkIn, checkOut, guests, total });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="sticky top-20 card-elegant p-6 rounded-xl"
    >
      {/* Price Header */}
      <div className="flex items-baseline gap-2 mb-6 pb-6 border-b border-border">
        <span className="text-3xl font-bold text-foreground">${pricePerNight}</span>
        <span className="text-muted-foreground">per night</span>
      </div>

      {/* Check-in Date */}
      <div className="mb-4">
        <label className="text-sm font-semibold text-foreground mb-2 block">Check-in</label>
        <div className="relative">
          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <input
            type="date"
            value={checkIn}
            onChange={(e) => setCheckIn(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
          />
        </div>
      </div>

      {/* Check-out Date */}
      <div className="mb-4">
        <label className="text-sm font-semibold text-foreground mb-2 block">Check-out</label>
        <div className="relative">
          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <input
            type="date"
            value={checkOut}
            onChange={(e) => setCheckOut(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
          />
        </div>
      </div>

      {/* Guests */}
      <div className="mb-6">
        <label className="text-sm font-semibold text-foreground mb-2 block">Guests</label>
        <div className="relative">
          <button
            onClick={() => setShowGuestDropdown(!showGuestDropdown)}
            className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <Users size={18} className="text-muted-foreground" />
              <span>{guests} {guests === 1 ? 'guest' : 'guests'}</span>
            </div>
            <ChevronDown size={18} className="text-muted-foreground" />
          </button>

          {/* Guest Dropdown */}
          {showGuestDropdown && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-lg shadow-lg z-10"
            >
              {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => (
                <button
                  key={num}
                  onClick={() => {
                    setGuests(num);
                    setShowGuestDropdown(false);
                  }}
                  className={`
                    w-full px-4 py-3 text-left hover:bg-muted transition-colors
                    ${num === guests ? 'bg-primary/10 text-primary font-semibold' : 'text-foreground'}
                    ${num < 8 ? 'border-b border-border' : ''}
                  `}
                >
                  {num} {num === 1 ? 'guest' : 'guests'}
                </button>
              ))}
            </motion.div>
          )}
        </div>
      </div>

      {/* Reserve Button */}
      <Button
        onClick={handleBooking}
        disabled={!checkIn || !checkOut}
        className="w-full py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mb-6"
      >
        Reserve
      </Button>

      {/* Price Breakdown */}
      {nights > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-3 pt-6 border-t border-border"
        >
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">
              ${pricePerNight} × {nights} {nights === 1 ? 'night' : 'nights'}
            </span>
            <span className="text-foreground font-medium">${subtotal}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Service fee</span>
            <span className="text-foreground font-medium">${serviceFee}</span>
          </div>
          <div className="flex justify-between text-base font-semibold pt-3 border-t border-border">
            <span>Total</span>
            <span>${total}</span>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
