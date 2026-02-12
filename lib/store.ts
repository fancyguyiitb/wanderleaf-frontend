import { create } from 'zustand';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  isHost: boolean;
}

export interface Property {
  id: string;
  title: string;
  description: string;
  location: string;
  coordinates: { lat: number; lng: number };
  price: number;
  rating: number;
  reviews: number;
  images: string[];
  amenities: string[];
  bedrooms: number;
  bathrooms: number;
  guests: number;
  host: {
    id: string;
    name: string;
    avatar?: string;
    rating: number;
    isVerified: boolean;
  };
  isFavorite?: boolean;
  createdAt: string;
}

export interface Booking {
  id: string;
  propertyId: string;
  userId: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  totalPrice: number;
  status: 'confirmed' | 'pending' | 'cancelled';
  createdAt: string;
}

interface AuthStore {
  user: User | null;
  isAuthenticated: boolean;
  userMode: 'guest' | 'host';
  setUser: (user: User | null) => void;
  setUserMode: (mode: 'guest' | 'host') => void;
  logout: () => void;
}

interface PropertyStore {
  properties: Property[];
  favorites: string[];
  addFavorite: (propertyId: string) => void;
  removeFavorite: (propertyId: string) => void;
  setProperties: (properties: Property[]) => void;
}

interface BookingStore {
  bookings: Booking[];
  addBooking: (booking: Booking) => void;
  cancelBooking: (bookingId: string) => void;
  setBookings: (bookings: Booking[]) => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  isAuthenticated: false,
  userMode: 'guest',
  setUser: (user) => set({ user, isAuthenticated: !!user }),
  setUserMode: (mode) => set({ userMode: mode }),
  logout: () => set({ user: null, isAuthenticated: false }),
}));

export const usePropertyStore = create<PropertyStore>((set) => ({
  properties: [],
  favorites: [],
  addFavorite: (propertyId) =>
    set((state) => ({
      favorites: [...state.favorites, propertyId],
      properties: state.properties.map((p) =>
        p.id === propertyId ? { ...p, isFavorite: true } : p
      ),
    })),
  removeFavorite: (propertyId) =>
    set((state) => ({
      favorites: state.favorites.filter((id) => id !== propertyId),
      properties: state.properties.map((p) =>
        p.id === propertyId ? { ...p, isFavorite: false } : p
      ),
    })),
  setProperties: (properties) => set({ properties }),
}));

export const useBookingStore = create<BookingStore>((set) => ({
  bookings: [],
  addBooking: (booking) =>
    set((state) => ({
      bookings: [...state.bookings, booking],
    })),
  cancelBooking: (bookingId) =>
    set((state) => ({
      bookings: state.bookings.map((b) =>
        b.id === bookingId ? { ...b, status: 'cancelled' } : b
      ),
    })),
  setBookings: (bookings) => set({ bookings }),
}));
