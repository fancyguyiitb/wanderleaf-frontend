/**
 * Booking utilities for frontend price calculation and date handling.
 * Matches backend logic (BookingService) - backend still validates on create.
 */

export interface BookedRange {
  check_in: string;
  check_out: string;
}

export interface PriceBreakdown {
  subtotal: number;
  serviceFee: number;
  cleaningFee: number;
  total: number;
  numNights: number;
}

/**
 * Calculate booking price breakdown on the frontend.
 * Uses the same formula as backend (12% service fee + $25 cleaning fee by default).
 */
export function calculateBookingPrice(
  pricePerNight: number,
  checkIn: Date,
  checkOut: Date,
  serviceFeePercent: number = 12,
  cleaningFee: number = 25
): PriceBreakdown {
  const numNights = Math.max(1, Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24)));
  const subtotal = pricePerNight * numNights;
  const serviceFee = Math.round(subtotal * (serviceFeePercent / 100) * 100) / 100;
  const total = subtotal + serviceFee + cleaningFee;

  return {
    subtotal,
    serviceFee,
    cleaningFee,
    total,
    numNights,
  };
}

/**
 * Convert booked ranges to a flat array of disabled date strings (YYYY-MM-DD).
 * Use these to disable dates in the calendar picker.
 */
export function getDisabledDates(bookedRanges: BookedRange[]): string[] {
  const disabledSet = new Set<string>();

  for (const range of bookedRanges) {
    const start = new Date(range.check_in);
    const end = new Date(range.check_out);

    const d = new Date(start);
    while (d < end) {
      disabledSet.add(d.toISOString().split('T')[0]);
      d.setDate(d.getDate() + 1);
    }
  }

  return Array.from(disabledSet);
}

/**
 * Check if a date range overlaps with any booked range.
 */
export function isDateRangeAvailable(
  checkIn: Date,
  checkOut: Date,
  bookedRanges: BookedRange[]
): boolean {
  const checkInTime = checkIn.getTime();
  const checkOutTime = checkOut.getTime();

  for (const range of bookedRanges) {
    const rangeStart = new Date(range.check_in).getTime();
    const rangeEnd = new Date(range.check_out).getTime();

    if (checkInTime < rangeEnd && checkOutTime > rangeStart) {
      return false;
    }
  }
  return true;
}
