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

interface DeletePropertyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  propertyTitle: string;
  isDeleting: boolean;
  onConfirm: () => void;
}

export default function DeletePropertyDialog({
  open,
  onOpenChange,
  propertyTitle,
  isDeleting,
  onConfirm,
}: DeletePropertyDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center flex-shrink-0">
              <AlertTriangle size={20} className="text-destructive" />
            </div>
            <AlertDialogTitle className="text-lg font-semibold text-foreground">
              Delete Property
            </AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-muted-foreground pt-2 space-y-2">
            <span className="block">
              Are you sure you want to delete{' '}
              <span className="font-semibold text-foreground">&ldquo;{propertyTitle}&rdquo;</span>?
            </span>
            <span className="block text-destructive/80 text-sm">
              This action cannot be undone. The listing, along with all its images and data, will be
              permanently removed.
            </span>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-2 sm:gap-2">
          <AlertDialogCancel disabled={isDeleting} className="mt-0">
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              onConfirm();
            }}
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90 disabled:opacity-70"
          >
            {isDeleting ? (
              <>
                <Loader2 size={16} className="animate-spin mr-2" />
                Deleting...
              </>
            ) : (
              'Yes, Delete Property'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
