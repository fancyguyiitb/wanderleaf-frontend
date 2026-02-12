'use client';

import { Star } from 'lucide-react';
import { motion } from 'framer-motion';

interface Review {
  id: string;
  author: string;
  rating: number;
  date: string;
  comment: string;
  avatar: string;
}

interface ReviewsSectionProps {
  rating: number;
  reviewCount: number;
}

export default function ReviewsSection({ rating, reviewCount }: ReviewsSectionProps) {
  // Mock reviews data
  const reviews: Review[] = [
    {
      id: '1',
      author: 'Sarah Mitchell',
      rating: 5,
      date: '2 months ago',
      comment: 'Absolutely stunning property! The views are breathtaking and the host was incredibly helpful. Felt like a true home away from home. Highly recommend!',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=48&h=48&fit=crop',
    },
    {
      id: '2',
      author: 'James Chen',
      rating: 5,
      date: '1 month ago',
      comment: 'Perfect location surrounded by nature. The amenities are top-notch and everything was clean and well-maintained. Would definitely stay here again!',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=48&h=48&fit=crop',
    },
    {
      id: '3',
      author: 'Emma Wilson',
      rating: 4,
      date: '3 weeks ago',
      comment: 'Great experience overall. The property is beautiful and peaceful. Only minor issue was the WiFi connection could be stronger, but still a wonderful stay.',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=48&h=48&fit=crop',
    },
  ];

  const ratingBreakdown = [
    { stars: 5, percentage: 85 },
    { stars: 4, percentage: 10 },
    { stars: 3, percentage: 3 },
    { stars: 2, percentage: 1 },
    { stars: 1, percentage: 1 },
  ];

  return (
    <section className="py-12 border-t border-border">
      <h2 className="font-playfair text-3xl font-bold text-foreground mb-8">Reviews & Ratings</h2>

      <div className="grid md:grid-cols-3 gap-8 mb-12">
        {/* Rating Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="card-elegant p-8 text-center"
        >
          <div className="text-5xl font-bold text-foreground mb-2">{rating}</div>
          <div className="flex items-center justify-center gap-1 mb-3">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                size={20}
                className={i < Math.floor(rating) ? 'fill-accent text-accent' : 'text-muted'}
              />
            ))}
          </div>
          <p className="text-muted-foreground">
            Based on {reviewCount} reviews
          </p>
        </motion.div>

        {/* Rating Breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="md:col-span-2 space-y-4"
        >
          {ratingBreakdown.map((item, index) => (
            <div key={item.stars} className="flex items-center gap-4">
              <div className="w-20 flex items-center gap-1">
                <span className="text-sm font-medium text-foreground">{item.stars}</span>
                <Star size={14} className="fill-accent text-accent" />
              </div>
              <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  whileInView={{ width: `${item.percentage}%` }}
                  transition={{ delay: 0.2 + index * 0.05, duration: 0.5 }}
                  viewport={{ once: true }}
                  className="h-full bg-primary"
                />
              </div>
              <span className="text-sm text-muted-foreground w-12 text-right">
                {item.percentage}%
              </span>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Individual Reviews */}
      <div className="space-y-6">
        <h3 className="font-semibold text-lg text-foreground">Recent Reviews</h3>
        {reviews.map((review, index) => (
          <motion.div
            key={review.id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            viewport={{ once: true }}
            className="pb-6 border-b border-border last:border-0"
          >
            <div className="flex gap-4">
              {/* Avatar */}
              <img
                src={review.avatar}
                alt={review.author}
                className="w-12 h-12 rounded-full object-cover flex-shrink-0"
              />

              {/* Review Content */}
              <div className="flex-1">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h4 className="font-semibold text-foreground">{review.author}</h4>
                    <p className="text-sm text-muted-foreground">{review.date}</p>
                  </div>
                </div>

                {/* Rating */}
                <div className="flex items-center gap-1 mb-2">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      size={16}
                      className={i < review.rating ? 'fill-accent text-accent' : 'text-muted'}
                    />
                  ))}
                </div>

                {/* Comment */}
                <p className="text-foreground leading-relaxed">{review.comment}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Load More */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="w-full mt-8 py-3 border border-border rounded-lg font-semibold text-foreground hover:bg-muted transition-colors"
      >
        View All {reviewCount} Reviews
      </motion.button>
    </section>
  );
}
