'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/navbar';
import Footer from '@/components/footer';
import ImageGallery from '@/components/image-gallery';
import BookingWidget from '@/components/booking-widget';
import ReviewsSection from '@/components/reviews-section';
import { bookingsApi, listingsApi, wishlistApi } from '@/lib/api';
import { useAuthStore, usePropertyStore, Property } from '@/lib/store';
import { Heart, MapPin, Users, Wifi, Wind, Flame, Coffee, Loader2, Edit2, ArrowLeft, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';
import { getAvatarUrl } from '@/lib/avatar';

export default function PropertyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const propertyId = params.id as string;

  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const { favorites, addFavorite, removeFavorite } = usePropertyStore();

  const [property, setProperty] = useState<Property | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isTogglingFavorite, setIsTogglingFavorite] = useState(false);
  const [hasBookedProperty, setHasBookedProperty] = useState(false);

  const isFavorite = propertyId ? favorites.includes(propertyId) : false;

  const isOwner = isAuthenticated && user && property && user.id === property.host.id;

  useEffect(() => {
    if (!propertyId) return;
    setIsLoading(true);
    setError(null);
    listingsApi
      .getById(propertyId)
      .then((p) => setProperty(p))
      .catch((err) => setError(err.message || 'Failed to load property.'))
      .finally(() => setIsLoading(false));
  }, [propertyId]);

  useEffect(() => {
    if (!isAuthenticated || !property || isOwner) {
      setHasBookedProperty(false);
      return;
    }

    let cancelled = false;

    bookingsApi
      .list()
      .then((response) => {
        const bookings = Array.isArray(response) ? response : response.results;
        const userHasBookingForProperty = bookings.some(
          (booking) =>
            String(booking.listing.id) === String(property.id) &&
            (booking.status === 'pending_payment' || booking.status === 'confirmed')
        );

        if (!cancelled) {
          setHasBookedProperty(userHasBookingForProperty);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setHasBookedProperty(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, property, isOwner]);

  const amenityIcons: Record<string, React.ReactNode> = {
    WiFi: <Wifi size={20} />,
    Heating: <Flame size={20} />,
    'Hot Tub': <Wind size={20} />,
    Coffee: <Coffee size={20} />,
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Loader2 size={36} className="animate-spin text-primary" />
            <p className="text-muted-foreground">Loading property...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !property) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <main className="flex-1 max-w-7xl mx-auto px-4 py-20 text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">
            {error || 'Property not found'}
          </h1>
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 text-primary hover:underline"
          >
            <ArrowLeft size={16} />
            Go back
          </button>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        {/* Back link */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mb-6"
        >
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft size={16} />
            Back
          </button>
        </motion.div>

        {/* Header with Title and Actions */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex-1">
              <h1 className="font-playfair text-4xl md:text-5xl font-bold text-foreground mb-2">
                {property.title}
              </h1>
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 text-muted-foreground">
                <div className="flex items-center gap-2">
                  <MapPin size={20} />
                  <span>{property.location}</span>
                </div>
                {property.rating > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-accent font-semibold text-lg">{property.rating}</span>
                    <span>({property.reviews} reviews)</span>
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {isOwner && (
                <>
                  <Link
                    href={`/host/bookings/${property.id}`}
                    className="hidden sm:inline-flex items-center gap-2 px-4 py-2.5 border border-border rounded-lg font-medium text-foreground hover:bg-muted transition-colors"
                  >
                    <Calendar size={18} />
                    <span>Show bookings</span>
                  </Link>
                  <Link
                    href={`/property/${property.id}/edit`}
                    className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
                  >
                    <Edit2 size={18} />
                    <span className="hidden sm:inline">Edit Property</span>
                  </Link>
                </>
              )}
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={async () => {
                  if (!property || isTogglingFavorite) return;
                  if (!isAuthenticated) {
                    router.push(`/auth/login?redirect=${encodeURIComponent(`/property/${property.id}`)}`);
                    return;
                  }
                  const nextFavorite = !isFavorite;
                  if (nextFavorite) addFavorite(property.id);
                  else removeFavorite(property.id);
                  setIsTogglingFavorite(true);
                  try {
                    if (nextFavorite) await wishlistApi.add(property.id);
                    else await wishlistApi.remove(property.id);
                  } catch {
                    if (nextFavorite) removeFavorite(property.id);
                    else addFavorite(property.id);
                  } finally {
                    setIsTogglingFavorite(false);
                  }
                }}
                disabled={isTogglingFavorite}
                className="p-3 rounded-full bg-secondary text-foreground hover:bg-accent/10 transition-colors disabled:opacity-70"
              >
                <Heart
                  size={24}
                  className={isFavorite ? 'fill-accent text-accent' : ''}
                />
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-8 mb-12">
          {/* Left Column - Gallery and Details */}
          <div className="lg:col-span-2">
            {/* Image Gallery */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="mb-12"
            >
              <ImageGallery images={property.images} title={property.title} />
            </motion.div>

            {/* Description Section */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mb-12 pb-12 border-b border-border"
            >
              <h2 className="font-playfair text-2xl font-bold text-foreground mb-4">About this property</h2>
              <p className="text-foreground leading-relaxed text-lg mb-6">
                {property.description}
              </p>

              {/* Property Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                {[
                  { label: 'Bedrooms', value: property.bedrooms },
                  { label: 'Bathrooms', value: property.bathrooms },
                  { label: 'Guests', value: property.guests },
                  { label: 'Rating', value: property.rating > 0 ? property.rating : 'New' },
                ].map((stat, index) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    viewport={{ once: true }}
                  >
                    <div className="text-2xl font-bold text-primary">{stat.value}</div>
                    <div className="text-sm text-muted-foreground">{stat.label}</div>
                  </motion.div>
                ))}
              </div>
            </motion.section>

            {/* Amenities Section */}
            {property.amenities.length > 0 && (
              <motion.section
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="mb-12 pb-12 border-b border-border"
              >
                <h2 className="font-playfair text-2xl font-bold text-foreground mb-6">Amenities</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {property.amenities.map((amenity, index) => (
                    <motion.div
                      key={amenity}
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      viewport={{ once: true }}
                      className="flex items-center gap-3 p-4 rounded-lg bg-secondary border border-border"
                    >
                      <div className="text-primary">
                        {amenityIcons[amenity] || <Wifi size={20} />}
                      </div>
                      <span className="font-medium text-foreground">{amenity}</span>
                    </motion.div>
                  ))}
                </div>
              </motion.section>
            )}

            {/* Host Section */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="mb-12 pb-12 border-b border-border"
            >
              <h2 className="font-playfair text-2xl font-bold text-foreground mb-6">Meet your host</h2>
              <div className="flex items-start gap-6 card-elegant p-6 rounded-xl">
                <img
                  src={getAvatarUrl(property.host.avatar, property.host.name)}
                  alt={property.host.name}
                  className="w-24 h-24 rounded-full object-cover flex-shrink-0"
                />
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-foreground mb-2">
                    {property.host.name}
                    {property.host.isVerified && (
                      <span className="ml-2 text-sm bg-primary text-primary-foreground px-2 py-1 rounded-full">
                        Verified Host
                      </span>
                    )}
                  </h3>
                  {property.host.rating > 0 && (
                    <div className="flex items-center gap-1 mb-3">
                      {[...Array(5)].map((_, i) => (
                        <span
                          key={i}
                          className={i < Math.floor(property.host.rating) ? 'text-accent' : 'text-muted'}
                        >
                          ★
                        </span>
                      ))}
                      <span className="text-muted-foreground ml-2">{property.host.rating} rating</span>
                    </div>
                  )}
                  <p className="text-foreground text-sm leading-relaxed">
                    Experienced host with a passion for providing exceptional stays. Known for responsive communication and beautiful properties.
                  </p>
                  {hasBookedProperty && (
                    <p className="mt-4 text-sm text-muted-foreground">
                      Contact is available from your active booking details page.
                    </p>
                  )}
                </div>
              </div>
            </motion.section>

            {/* Reviews Section */}
            <ReviewsSection
                listingId={property.id}
                rating={property.rating}
                reviewCount={property.reviews}
                ratingBreakdown={property.ratingBreakdown}
              />
          </div>

          {/* Right Column - Booking Widget */}
          <div className="lg:col-span-1">
            <BookingWidget property={property} />
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
