'use client';

import React, { useCallback, useTransition } from 'react';
import { useForm, UseFormReturn, FieldValues } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { SuccessToast, ErrorToast } from '@/components/atom/toast';
import { useDictionary } from '@/components/internationalization/use-dictionary';
import { cn } from '@/lib/utils';

export interface CrudFormProps<TFormValues extends FieldValues = FieldValues> {
  /** Zod validation schema */
  schema: z.ZodType<TFormValues>;
  /** Default values for the form */
  defaultValues?: Partial<TFormValues>;
  /** Submit handler - should be a server action */
  onSubmit: (data: TFormValues) => Promise<any>;
  /** Success callback (injected by CrudModal) */
  onSuccess?: () => void;
  /** Error callback (injected by CrudModal) */
  onError?: (error: Error) => void;
  /** Whether form is closing (injected by CrudModal) */
  isClosing?: boolean;
  /** Form fields render function */
  children: (form: UseFormReturn<TFormValues>) => React.ReactNode;
  /** Submit button label */
  submitLabel?: string;
  /** Cancel button label */
  cancelLabel?: string;
  /** Show cancel button */
  showCancel?: boolean;
  /** Cancel handler */
  onCancel?: () => void;
  /** Additional form class names */
  className?: string;
  /** Additional button container class names */
  buttonsClassName?: string;
  /** Custom success message */
  successMessage?: string;
  /** Custom error message */
  errorMessage?: string;
  /** Whether to reset form on success */
  resetOnSuccess?: boolean;
}

export function CrudForm<TFormValues extends FieldValues = FieldValues>({
  schema,
  defaultValues,
  onSubmit,
  onSuccess,
  onError,
  isClosing = false,
  children,
  submitLabel,
  cancelLabel,
  showCancel = false,
  onCancel,
  className,
  buttonsClassName,
  successMessage,
  errorMessage,
  resetOnSuccess = true
}: CrudFormProps<TFormValues>) {
  const [isPending, startTransition] = useTransition();
  const { dictionary } = useDictionary();

  const form = useForm<TFormValues>({
    // @ts-expect-error - zodResolver type inference issue with generic schemas
    resolver: zodResolver(schema),
    defaultValues: (defaultValues || {}) as any,
  });

  const handleSubmit = useCallback(async (data: TFormValues) => {
    startTransition(async () => {
      try {
        const result = await onSubmit(data);

        if (result?.error) {
          throw new Error(result.error);
        }

        // Show success toast
        SuccessToast(
          successMessage ||
          result?.message ||
          dictionary?.common?.success ||
          'Saved successfully'
        );

        // Reset form if needed
        if (resetOnSuccess) {
          form.reset();
        }

        // Call success handler
        onSuccess?.();
      } catch (error) {
        console.error('Form submission error:', error);

        // Show error toast
        ErrorToast(
          errorMessage ||
          (error as Error)?.message ||
          dictionary?.common?.error ||
          'Failed to save'
        );

        // Call error handler
        onError?.(error as Error);
      }
    });
  }, [
    onSubmit,
    onSuccess,
    onError,
    successMessage,
    errorMessage,
    dictionary,
    resetOnSuccess,
    form
  ]);

  const isLoading = isPending || isClosing;

  return (
    <Form {...form}>
      <form
        // @ts-expect-error - form.handleSubmit type inference issue with generic TFormValues
        onSubmit={form.handleSubmit(handleSubmit)}
        className={cn('space-y-4', className)}
      >
        <div className={cn(
          'space-y-4',
          isLoading && 'opacity-50 pointer-events-none'
        )}>
          {/* @ts-expect-error - form type inference issue with generic TFormValues */}
          {children(form)}
        </div>

        <div className={cn(
          'flex items-center gap-2 pt-4',
          buttonsClassName
        )}>
          <Button
            type="submit"
            disabled={isLoading}
            className="min-w-[100px]"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin me-2" />
                {dictionary?.common?.loading || 'Saving...'}
              </>
            ) : (
              submitLabel || dictionary?.common?.save || 'Save'
            )}
          </Button>

          {showCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isLoading}
            >
              {cancelLabel || dictionary?.common?.cancel || 'Cancel'}
            </Button>
          )}
        </div>
      </form>
    </Form>
  );
}