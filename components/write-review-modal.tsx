'use client';

import { useState } from 'react';
import { Star, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { reviewsApi } from '@/lib/api';

interface WriteReviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bookingId: string;
  listingTitle: string;
  onSuccess?: () => void;
}

export default function WriteReviewModal({
  open,
  onOpenChange,
  bookingId,
  listingTitle,
  onSuccess,
}: WriteReviewModalProps) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setRating(5);
    setComment('');
    setError(null);
  };

  const handleClose = (nextOpen: boolean) => {
    if (!nextOpen) reset();
    onOpenChange(nextOpen);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) {
      setError('Please write a comment for your review.');
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      await reviewsApi.create(bookingId, rating, comment.trim());
      reset();
      onOpenChange(false);
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit review.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="font-playfair text-xl font-semibold text-foreground">
              Write a review
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Share your experience at {listingTitle}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-6">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Your rating
              </label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setRating(value)}
                    className="p-1 rounded transition-colors hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                    aria-label={`${value} stars`}
                  >
                    <Star
                      size={28}
                      className={
                        value <= rating
                          ? 'fill-accent text-accent'
                          : 'text-muted'
                      }
                    />
                  </button>
                ))}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {rating} out of 5 stars
              </p>
            </div>

            <div>
              <label
                htmlFor="review-comment"
                className="block text-sm font-medium text-foreground mb-2"
              >
                Your review
              </label>
              <textarea
                id="review-comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Tell others about your stay..."
                rows={4}
                className="w-full px-4 py-3 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                disabled={isSubmitting}
              />
            </div>

            {error && (
              <p className="text-sm text-destructive font-medium">{error}</p>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <button
              type="button"
              onClick={() => handleClose(false)}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-lg border border-border text-foreground font-medium hover:bg-muted transition-colors disabled:opacity-70"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors disabled:opacity-70 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit review'
              )}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
