'use client';

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog';
import { AlertTriangle, Loader2 } from 'lucide-react';

interface CancelBookingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isHost: boolean;
  isCancelling: boolean;
  onConfirm: () => void;
}

export default function CancelBookingDialog({
  open,
  onOpenChange,
  isHost,
  isCancelling,
  onConfirm,
}: CancelBookingDialogProps) {
  const description = isHost
    ? 'The guest will receive a full refund. The dates will be freed and the guest will be notified.'
    : 'You will receive a full refund. The dates will be freed and the host will be notified.';

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center flex-shrink-0">
              <AlertTriangle size={20} className="text-destructive" />
            </div>
            <AlertDialogTitle className="text-lg font-semibold text-foreground">
              Cancel booking
            </AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-muted-foreground pt-2 space-y-2">
            <span className="block">
              Are you sure you want to cancel this booking?
            </span>
            <span className="block text-sm">
              {description}
            </span>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-2 sm:gap-2">
          <AlertDialogCancel disabled={isCancelling} className="mt-0">
            Keep booking
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              onConfirm();
            }}
            disabled={isCancelling}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90 disabled:opacity-70"
          >
            {isCancelling ? (
              <>
                <Loader2 size={16} className="animate-spin mr-2" />
                Cancelling...
              </>
            ) : (
              'Yes, Cancel booking'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
