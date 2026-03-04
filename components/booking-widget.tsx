'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { Calendar, Users, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Property } from '@/lib/store';
import {
  calculateBookingPrice,
  getDisabledDates,
  isDateRangeAvailable,
  type BookedRange,
} from '@/lib/booking-utils';
import { useAuthStore } from '@/lib/store';
import { cn } from '@/lib/utils';

interface BookingWidgetProps {
  property: Property;
}

export default function BookingWidget({ property }: BookingWidgetProps) {
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const [range, setRange] = useState<{ from?: Date; to?: Date } | undefined>();
  const [guests, setGuests] = useState(1);
  const [showGuestDropdown, setShowGuestDropdown] = useState(false);
  const [dateError, setDateError] = useState<string | null>(null);

  const bookedRanges: BookedRange[] = property.bookedDates ?? [];
  const disabledDateStrings = getDisabledDates(bookedRanges);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const disabledMatcher = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const isPast = date < today;
    const isBooked = disabledDateStrings.includes(dateStr);
    return isPast || isBooked;
  };

  const checkIn = range?.from;
  const checkOut = range?.to ?? range?.from;

  const priceBreakdown =
    checkIn && checkOut && checkOut > checkIn
      ? calculateBookingPrice(
          property.price,
          checkIn,
          checkOut,
          property.serviceFeePercent ?? 12,
          property.cleaningFee ?? 25
        )
      : null;

  const maxGuests = Math.min(property.guests, 8);

  const handleRangeSelect = (r: { from?: Date; to?: Date } | undefined) => {
    setRange(r);
    setDateError(null);

    if (r?.from && r?.to && r.to > r.from) {
      const available = isDateRangeAvailable(r.from, r.to, bookedRanges);
      if (!available) {
        setDateError('Selected dates overlap with an existing booking.');
      }
    }
  };

  const handleBooking = () => {
    if (!checkIn || !checkOut || checkOut <= checkIn) {
      alert('Please select check-in and check-out dates');
      return;
    }
    if (dateError) {
      alert(dateError);
      return;
    }
    if (!isAuthenticated) {
      router.push(
        `/auth/login?redirect=${encodeURIComponent(`/property/${property.id}?checkIn=${format(checkIn, 'yyyy-MM-dd')}&checkOut=${format(checkOut, 'yyyy-MM-dd')}&guests=${guests}`)}`
      );
      return;
    }

    const params = new URLSearchParams({
      propertyId: property.id,
      checkIn: format(checkIn, 'yyyy-MM-dd'),
      checkOut: format(checkOut, 'yyyy-MM-dd'),
      guests: String(guests),
    });
    router.push(`/checkout?${params.toString()}`);
  };

  const formatDateRange = () => {
    if (!checkIn) return 'Select dates';
    if (!checkOut || checkOut <= checkIn) return format(checkIn, 'MMM d, yyyy');
    return `${format(checkIn, 'MMM d')} - ${format(checkOut, 'MMM d, yyyy')}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="sticky top-20 card-elegant p-6 rounded-xl"
    >
      {/* Price Header */}
      <div className="flex items-baseline gap-2 mb-6 pb-6 border-b border-border">
        <span className="text-3xl font-bold text-foreground">${property.price}</span>
        <span className="text-muted-foreground">per night</span>
      </div>

      {/* Date Range Picker */}
      <div className="mb-4">
        <label className="text-sm font-semibold text-foreground mb-2 block">Check-in — Check-out</label>
        <Popover>
          <PopoverTrigger asChild>
            <button
              className={cn(
                'w-full pl-10 pr-4 py-3 border border-border rounded-lg text-left focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground relative',
                !range?.from && 'text-muted-foreground'
              )}
            >
              <Calendar
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
                size={18}
              />
              {formatDateRange()}
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <CalendarComponent
              mode="range"
              defaultMonth={checkIn ?? today}
              selected={range}
              onSelect={handleRangeSelect}
              disabled={disabledMatcher}
              numberOfMonths={2}
            />
          </PopoverContent>
        </Popover>
        {dateError && <p className="text-sm text-destructive mt-1">{dateError}</p>}
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
              <span>
                {guests} {guests === 1 ? 'guest' : 'guests'}
              </span>
            </div>
            <ChevronDown
              size={18}
              className={cn('text-muted-foreground transition-transform', showGuestDropdown && 'rotate-180')}
            />
          </button>

          {showGuestDropdown && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-lg shadow-lg z-10"
            >
              {Array.from({ length: maxGuests }, (_, i) => i + 1).map((num) => (
                <button
                  key={num}
                  onClick={() => {
                    setGuests(num);
                    setShowGuestDropdown(false);
                  }}
                  className={cn(
                    'w-full px-4 py-3 text-left hover:bg-muted transition-colors first:rounded-t-lg last:rounded-b-lg',
                    num === guests ? 'bg-primary/10 text-primary font-semibold' : 'text-foreground',
                    num < maxGuests && 'border-b border-border'
                  )}
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
        disabled={!checkIn || !checkOut || checkOut <= checkIn || !!dateError}
        className="w-full py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mb-6"
      >
        Reserve
      </Button>

      {/* Price Breakdown */}
      {priceBreakdown && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-3 pt-6 border-t border-border"
        >
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">
              ${property.price} × {priceBreakdown.numNights} {priceBreakdown.numNights === 1 ? 'night' : 'nights'}
            </span>
            <span className="text-foreground font-medium">${priceBreakdown.subtotal}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Service fee</span>
            <span className="text-foreground font-medium">${priceBreakdown.serviceFee}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Cleaning fee</span>
            <span className="text-foreground font-medium">${priceBreakdown.cleaningFee}</span>
          </div>
          <div className="flex justify-between text-base font-semibold pt-3 border-t border-border">
            <span>Total</span>
            <span>${priceBreakdown.total}</span>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
