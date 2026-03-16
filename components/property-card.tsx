'use client';

import Image from 'next/image';
import { Heart, MapPin, Star } from 'lucide-react';
import { Property } from '@/lib/store';
import { usePropertyStore, useAuthStore } from '@/lib/store';
import { wishlistApi } from '@/lib/api';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface PropertyCardProps {
  property: Property;
  index?: number;
}

export default function PropertyCard({ property, index = 0 }: PropertyCardProps) {
  const router = useRouter();
  const [isToggling, setIsToggling] = useState(false);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const { favorites, addFavorite, removeFavorite } = usePropertyStore();
  const isFavorite = favorites.includes(property.id);

  const handleFavoriteClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isToggling) return;

    if (!isAuthenticated) {
      router.push(`/auth/login?redirect=${encodeURIComponent(`/property/${property.id}`)}`);
      return;
    }

    const nextFavorite = !isFavorite;
    if (nextFavorite) addFavorite(property.id);
    else removeFavorite(property.id);

    setIsToggling(true);
    try {
      if (nextFavorite) await wishlistApi.add(property.id);
      else await wishlistApi.remove(property.id);
    } catch {
      if (nextFavorite) removeFavorite(property.id);
      else addFavorite(property.id);
    } finally {
      setIsToggling(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="h-full"
    >
      <Link href={`/property/${property.id}`}>
        <div className="card-elegant overflow-hidden h-full flex flex-col cursor-pointer group">
          {/* Image Container */}
          <div className="relative w-full aspect-video overflow-hidden bg-muted">
            <Image
              src={property.images[0]}
              alt={property.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />
            
            {/* Favorite Button */}
            <button
              onClick={handleFavoriteClick}
              className="absolute top-3 right-3 p-2 rounded-full bg-white/90 backdrop-blur-sm hover:bg-white transition-colors z-10"
            >
              <Heart
                size={20}
                className={isFavorite ? 'fill-accent text-accent' : 'text-foreground'}
              />
            </button>

            {/* Price Tag */}
            <div className="absolute bottom-3 left-3 bg-foreground/90 backdrop-blur-sm text-primary-foreground px-3 py-1 rounded-full">
              <span className="font-semibold">₹{property.price}</span>
              <span className="text-xs opacity-90">/night</span>
            </div>
          </div>

          {/* Content */}
          <div className="p-4 flex-1 flex flex-col">
            {/* Location */}
            <div className="flex items-start gap-2 mb-2">
              <MapPin size={16} className="text-muted-foreground flex-shrink-0 mt-0.5" />
              <p className="text-sm text-muted-foreground truncate">{property.location}</p>
            </div>

            {/* Title */}
            <h3 className="font-playfair font-semibold text-lg mb-2 line-clamp-2 text-foreground group-hover:text-primary transition-colors">
              {property.title}
            </h3>

            {/* Stats */}
            <div className="flex items-center justify-between text-sm text-muted-foreground mb-3">
              <span>{property.bedrooms} bed • {property.bathrooms} bath</span>
            </div>

            {/* Rating & Review count */}
            <div className="flex items-center gap-1">
              {property.reviews > 0 ? (
                <>
                  <Star size={16} className="fill-accent text-accent" />
                  <span className="font-semibold text-foreground">{property.rating}</span>
                  <span className="text-xs text-muted-foreground">
                    ({property.reviews} {property.reviews === 1 ? 'review' : 'reviews'})
                  </span>
                </>
              ) : (
                <span className="text-sm text-muted-foreground">New</span>
              )}
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
