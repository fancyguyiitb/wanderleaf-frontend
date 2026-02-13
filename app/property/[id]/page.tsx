'use client';

import { useParams } from 'next/navigation';
import Navbar from '@/components/navbar';
import Footer from '@/components/footer';
import ImageGallery from '@/components/image-gallery';
import BookingWidget from '@/components/booking-widget';
import ReviewsSection from '@/components/reviews-section';
import { mockProperties } from '@/lib/mock-data';
import { Heart, MapPin, Users, Wifi, Wind, Flame, Coffee } from 'lucide-react';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { getAvatarUrl } from '@/lib/avatar';

export default function PropertyDetailPage() {
  const params = useParams();
  const property = mockProperties.find((p) => p.id === params.id);
  const [isFavorite, setIsFavorite] = useState(false);

  if (!property) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <main className="flex-1 max-w-7xl mx-auto px-4 py-20 text-center">
          <h1 className="text-2xl font-bold text-foreground">Property not found</h1>
        </main>
        <Footer />
      </div>
    );
  }

  // Get amenity icons
  const amenityIcons: Record<string, React.ReactNode> = {
    WiFi: <Wifi size={20} />,
    Heating: <Flame size={20} />,
    'Hot Tub': <Wind size={20} />,
    Coffee: <Coffee size={20} />,
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
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
                <div className="flex items-center gap-2">
                  <span className="text-accent font-semibold text-lg">{property.rating}</span>
                  <span>({property.reviews} reviews)</span>
                </div>
              </div>
            </div>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setIsFavorite(!isFavorite)}
              className="p-3 rounded-full bg-secondary text-foreground hover:bg-accent/10 transition-colors"
            >
              <Heart
                size={24}
                className={isFavorite ? 'fill-accent text-accent' : ''}
              />
            </motion.button>
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
                  { label: 'Rating', value: property.rating },
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
                  <p className="text-foreground text-sm leading-relaxed">
                    Experienced host with a passion for providing exceptional stays. Known for responsive communication and beautiful properties. Join our community of satisfied guests!
                  </p>
                  <button className="mt-4 px-6 py-2 border border-primary text-primary rounded-lg font-medium hover:bg-primary/10 transition-colors">
                    Contact Host
                  </button>
                </div>
              </div>
            </motion.section>

            {/* Reviews Section */}
            <ReviewsSection rating={property.rating} reviewCount={property.reviews} />
          </div>

          {/* Right Column - Booking Widget */}
          <div className="lg:col-span-1">
            <BookingWidget pricePerNight={property.price} propertyId={property.id} />
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
