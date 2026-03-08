'use client';

import { useEffect, useState, useCallback } from 'react';
import { Star, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { getAvatarUrl } from '@/lib/avatar';
import { reviewsApi, type ApiReview } from '@/lib/api';

function formatRelativeDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} week${diffDays < 14 ? '' : 's'} ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} month${diffDays < 60 ? '' : 's'} ago`;
  return `${Math.floor(diffDays / 365)} year${diffDays < 730 ? '' : 's'} ago`;
}

interface ReviewsSectionProps {
  listingId: string;
  rating: number;
  reviewCount: number;
  ratingBreakdown?: { stars: number; count: number; percentage: number }[];
}

export default function ReviewsSection({
  listingId,
  rating,
  reviewCount,
  ratingBreakdown = [],
}: ReviewsSectionProps) {
  const [reviews, setReviews] = useState<ApiReview[]>([]);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const PAGE_SIZE = 4;

  const fetchReviews = useCallback(
    async (off: number, append: boolean) => {
      if (append) {
        setIsLoadingMore(true);
      } else {
        setIsLoading(true);
      }
      try {
        const remaining = reviewCount - off;
        const limit = remaining > 0 ? Math.min(PAGE_SIZE, remaining) : PAGE_SIZE;
        const res = await reviewsApi.list(listingId, limit, off);
        if (append) {
          setReviews((prev) => [...prev, ...res.results]);
        } else {
          setReviews(res.results);
        }
        setHasMore(res.next_offset != null);
        setOffset(off + res.results.length);
      } catch {
        setHasMore(false);
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    [listingId, reviewCount]
  );

  useEffect(() => {
    if (!listingId) return;
    setOffset(0);
    setHasMore(true);
    fetchReviews(0, false);
  }, [listingId, fetchReviews]);

  const handleLoadMore = () => {
    if (!hasMore || isLoadingMore) return;
    fetchReviews(offset, true);
  };

  const effectiveBreakdown =
    ratingBreakdown.length > 0
      ? ratingBreakdown
      : [
          { stars: 5, count: 0, percentage: 0 },
          { stars: 4, count: 0, percentage: 0 },
          { stars: 3, count: 0, percentage: 0 },
          { stars: 2, count: 0, percentage: 0 },
          { stars: 1, count: 0, percentage: 0 },
        ];

  return (
    <section className="py-12 border-t border-border">
      <h2 className="font-playfair text-3xl font-bold text-foreground mb-8">
        Reviews & Ratings
      </h2>

      <div className="grid md:grid-cols-3 gap-8 mb-12">
        {/* Rating Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="card-elegant p-8 text-center"
        >
          <div className="text-5xl font-bold text-foreground mb-2">
            {rating > 0 ? rating : '—'}
          </div>
          <div className="flex items-center justify-center gap-1 mb-3">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                size={20}
                className={
                  i < Math.floor(rating) ? 'fill-accent text-accent' : 'text-muted'
                }
              />
            ))}
          </div>
          <p className="text-muted-foreground">
            Based on {reviewCount} review{reviewCount !== 1 ? 's' : ''}
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
          {effectiveBreakdown.map((item, index) => (
            <div key={item.stars} className="flex items-center gap-4">
              <div className="w-20 flex items-center gap-1">
                <span className="text-sm font-medium text-foreground">
                  {item.stars}
                </span>
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
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 size={32} className="animate-spin text-primary" />
          </div>
        ) : reviews.length === 0 ? (
          <p className="text-muted-foreground py-8">
            No reviews yet. Be the first to share your experience!
          </p>
        ) : (
          reviews.map((review, index) => (
            <motion.div
              key={review.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              viewport={{ once: true }}
              className="pb-6 border-b border-border last:border-0"
            >
              <div className="flex gap-4">
                <img
                  src={getAvatarUrl(review.author.avatar, review.author.name)}
                  alt={review.author.name}
                  className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                />
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-semibold text-foreground">
                        {review.author.name}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {formatRelativeDate(review.created_at)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 mb-2">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        size={16}
                        className={
                          i < review.rating
                            ? 'fill-accent text-accent'
                            : 'text-muted'
                        }
                      />
                    ))}
                  </div>
                  <p className="text-foreground leading-relaxed">
                    {review.comment}
                  </p>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Load More */}
      {hasMore && reviews.length > 0 && !isLoading && (
        <motion.button
          onClick={handleLoadMore}
          disabled={isLoadingMore}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full mt-8 py-3 border border-border rounded-lg font-semibold text-foreground hover:bg-muted transition-colors disabled:opacity-70 flex items-center justify-center gap-2"
        >
          {isLoadingMore ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              Loading...
            </>
          ) : (
            <>Load More Reviews</>
          )}
        </motion.button>
      )}
    </section>
  );
}
