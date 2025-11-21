'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

export interface CrudModalProps {
  /** Whether the modal is open */
  open: boolean;
  /** Callback when modal requests to close */
  onOpenChange: (open: boolean) => void;
  /** Modal title */
  title?: string;
  /** Modal description */
  description?: string;
  /** Modal content - typically a form component */
  children: React.ReactNode;
  /** Maximum width of the modal */
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  /** Whether to show close button */
  showCloseButton?: boolean;
  /** Additional class names */
  className?: string;
  /** Whether modal is in loading state */
  loading?: boolean;
  /** Auto close delay in ms after success (0 to disable) */
  autoCloseDelay?: number;
  /** Callback after successful operation */
  onSuccess?: () => void;
  /** Callback after error */
  onError?: (error: Error) => void;
}

const maxWidthClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  full: 'max-w-full'
};

export function CrudModal({
  open,
  onOpenChange,
  title,
  description,
  children,
  maxWidth = 'lg',
  showCloseButton = true,
  className,
  loading = false,
  autoCloseDelay = 500,
  onSuccess,
  onError
}: CrudModalProps) {
  const [isClosing, setIsClosing] = useState(false);

  // Handle auto-close on success
  const handleSuccess = useCallback(() => {
    if (autoCloseDelay > 0) {
      setIsClosing(true);
      setTimeout(() => {
        onOpenChange(false);
        setIsClosing(false);
        onSuccess?.();
      }, autoCloseDelay);
    } else {
      onSuccess?.();
    }
  }, [autoCloseDelay, onOpenChange, onSuccess]);

  // Handle error
  const handleError = useCallback((error: Error) => {
    onError?.(error);
  }, [onError]);

  // Inject success/error handlers into form children
  const childrenWithHandlers = React.Children.map(children, child => {
    if (React.isValidElement(child)) {
      return React.cloneElement(child as React.ReactElement<any>, {
        onSuccess: handleSuccess,
        onError: handleError,
        isClosing
      });
    }
    return child;
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          maxWidthClasses[maxWidth],
          'max-h-[90vh] overflow-y-auto',
          className
        )}
        showCloseButton={showCloseButton && !loading && !isClosing}
      >
        {(title || description) && (
          <DialogHeader>
            {title && <DialogTitle>{title}</DialogTitle>}
            {description && <DialogDescription>{description}</DialogDescription>}
          </DialogHeader>
        )}
        <div className={cn(
          'relative',
          loading && 'opacity-50 pointer-events-none',
          isClosing && 'animate-pulse'
        )}>
          {childrenWithHandlers}
        </div>
      </DialogContent>
    </Dialog>
  );
}