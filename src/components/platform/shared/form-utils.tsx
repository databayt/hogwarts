"use client";

import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Save, X } from "lucide-react";
import type { UseFormReturn } from "react-hook-form";

// ============================================================================
// Form Step Progress Indicator
// ============================================================================

interface FormProgressProps {
  currentStep: number;
  totalSteps: number;
  className?: string;
}

export function FormProgress({ currentStep, totalSteps, className }: FormProgressProps) {
  return (
    <div className={cn("flex justify-between gap-1", className)}>
      {Array.from({ length: totalSteps }).map((_, i) => (
        <div
          key={i}
          className={cn(
            "h-1.5 flex-1 rounded-full transition-all duration-300",
            i < currentStep ? "bg-primary" : "bg-muted"
          )}
        />
      ))}
    </div>
  );
}

// ============================================================================
// Form Loading Skeleton Pattern
// ============================================================================

interface FormSkeletonProps {
  fields?: number;
  className?: string;
}

export function FormSkeleton({ fields = 3, className }: FormSkeletonProps) {
  return (
    <div className={cn("space-y-4", className)}>
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-4 w-24" /> {/* Label */}
          <Skeleton className="h-10 w-full" /> {/* Input */}
        </div>
      ))}
    </div>
  );
}

export function FormFieldSkeleton() {
  return (
    <div className="space-y-2">
      <Skeleton className="h-4 w-24" /> {/* Label */}
      <Skeleton className="h-10 w-full" /> {/* Input */}
    </div>
  );
}

export function FormTextareaSkeleton() {
  return (
    <div className="space-y-2">
      <Skeleton className="h-4 w-24" /> {/* Label */}
      <Skeleton className="h-20 w-full" /> {/* Textarea */}
    </div>
  );
}

export function FormSelectSkeleton() {
  return (
    <div className="space-y-2">
      <Skeleton className="h-4 w-24" /> {/* Label */}
      <Skeleton className="h-10 w-full" /> {/* Select */}
    </div>
  );
}

// ============================================================================
// Form Section Components
// ============================================================================

interface FormSectionProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  isLoading?: boolean;
}

export function FormSection({
  title,
  description,
  children,
  className,
  isLoading = false
}: FormSectionProps) {
  return (
    <div className={cn("space-y-4", className)}>
      <div>
        <h3 className="text-lg font-medium">{title}</h3>
        {description && (
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        )}
      </div>
      <div className="space-y-4">
        {isLoading ? <FormSkeleton fields={3} /> : children}
      </div>
    </div>
  );
}

// ============================================================================
// Form Footer Navigation
// ============================================================================

interface FormFooterProps {
  currentStep: number;
  totalSteps: number;
  isFirstStep: boolean;
  isLastStep: boolean;
  onBack: () => void;
  onNext: () => void;
  onSubmit?: () => void;
  isSubmitting?: boolean;
  dictionary?: any;
  className?: string;
  hideCancel?: boolean;
  onCancel?: () => void;
}

export function FormFooter({
  currentStep,
  totalSteps,
  isFirstStep,
  isLastStep,
  onBack,
  onNext,
  onSubmit,
  isSubmitting = false,
  dictionary,
  className,
  hideCancel = false,
  onCancel
}: FormFooterProps) {
  const d = dictionary || {};

  return (
    <div className={cn("flex items-center justify-between border-t pt-4", className)}>
      <div className="flex items-center gap-2">
        {!hideCancel && onCancel && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            <X className="mr-2 h-4 w-4" />
            {d.cancel || "Cancel"}
          </Button>
        )}
        {!isFirstStep && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onBack}
            disabled={isSubmitting}
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            {d.back || "Back"}
          </Button>
        )}
      </div>

      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">
          {d.step || "Step"} {currentStep} {d.of || "of"} {totalSteps}
        </span>

        {isLastStep ? (
          <Button
            type="submit"
            size="sm"
            onClick={onSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Skeleton className="mr-2 h-4 w-4" />
                {d.saving || "Saving..."}
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                {d.save || "Save"}
              </>
            )}
          </Button>
        ) : (
          <Button
            type="button"
            size="sm"
            onClick={onNext}
            disabled={isSubmitting}
          >
            {d.next || "Next"}
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Form Grid Layouts
// ============================================================================

export function FormGrid({
  children,
  columns = 2,
  className
}: {
  children: React.ReactNode;
  columns?: 1 | 2 | 3;
  className?: string;
}) {
  const gridClass = columns === 1
    ? "grid-cols-1"
    : columns === 2
    ? "grid-cols-1 md:grid-cols-2"
    : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3";

  return (
    <div className={cn(`grid ${gridClass} gap-4`, className)}>
      {children}
    </div>
  );
}

// ============================================================================
// Form Field Error Component
// ============================================================================

interface FormFieldErrorProps {
  error?: string;
}

export function FormFieldError({ error }: FormFieldErrorProps) {
  if (!error) return null;

  return (
    <p className="text-sm text-destructive mt-1">
      {error}
    </p>
  );
}

// ============================================================================
// Multi-Step Form Container
// ============================================================================

interface MultiStepFormProps {
  children: React.ReactNode;
  currentStep: number;
  className?: string;
}

export function MultiStepForm({
  children,
  currentStep,
  className
}: MultiStepFormProps) {
  return (
    <div className={cn("space-y-6", className)}>
      {children}
    </div>
  );
}

// ============================================================================
// Form Validation Helper
// ============================================================================

export async function validateFormStep<T extends Record<string, any>>(
  form: UseFormReturn<T>,
  fields: (keyof T)[]
): Promise<boolean> {
  // Cast fields to the expected type for trigger
  const result = await form.trigger(fields as any);
  return result;
}

// ============================================================================
// Empty State for Forms
// ============================================================================

interface FormEmptyStateProps {
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function FormEmptyState({
  title,
  description,
  action,
  className
}: FormEmptyStateProps) {
  return (
    <div className={cn("text-center py-8", className)}>
      <h3 className="text-lg font-medium">{title}</h3>
      <p className="text-sm text-muted-foreground mt-2">{description}</p>
      {action && (
        <Button
          variant="outline"
          size="sm"
          className="mt-4"
          onClick={action.onClick}
        >
          {action.label}
        </Button>
      )}
    </div>
  );
}

// ============================================================================
// Form Success/Error Messages
// ============================================================================

interface FormMessageProps {
  type: "success" | "error" | "warning" | "info";
  message: string;
  className?: string;
}

export function FormMessage({ type, message, className }: FormMessageProps) {
  const styles = {
    success: "bg-green-50 text-green-800 border-green-200",
    error: "bg-destructive/10 text-destructive border-destructive/20",
    warning: "bg-yellow-50 text-yellow-800 border-yellow-200",
    info: "bg-blue-50 text-blue-800 border-blue-200"
  };

  return (
    <div className={cn(
      "rounded-md border px-4 py-3 text-sm",
      styles[type],
      className
    )}>
      {message}
    </div>
  );
}