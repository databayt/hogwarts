"use client"

import * as React from "react"
import { ArrowLeft, ArrowRight, Check, Loader2 } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

import type { FormStepNavigationProps } from "./types"

/**
 * Form Step Navigation
 *
 * Back/Next navigation buttons for multi-step forms.
 * Automatically shows Submit on the last step.
 *
 * @example
 * ```tsx
 * <FormStepNavigation
 *   onBack={handleBack}
 *   onNext={handleNext}
 *   isFirstStep={currentStep === 0}
 *   isLastStep={currentStep === totalSteps - 1}
 *   isLoading={isSubmitting}
 * />
 * ```
 */
export function FormStepNavigation({
  onBack,
  onNext,
  isFirstStep = false,
  isLastStep = false,
  isLoading = false,
  isNextDisabled = false,
  backLabel = "Back",
  nextLabel = "Continue",
  submitLabel = "Submit",
  className,
}: FormStepNavigationProps) {
  const handleNext = async () => {
    if (onNext) {
      await onNext()
    }
  }

  return (
    <div className={cn("flex items-center justify-between pt-6", className)}>
      {/* Back button */}
      {!isFirstStep && onBack ? (
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          disabled={isLoading}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
          {backLabel}
        </Button>
      ) : (
        <div /> // Spacer to maintain layout
      )}

      {/* Next/Submit button */}
      <Button
        type="button"
        onClick={handleNext}
        disabled={isLoading || isNextDisabled}
        className="gap-2"
      >
        {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
        {!isLoading && isLastStep && <Check className="h-4 w-4" />}
        {isLastStep ? submitLabel : nextLabel}
        {!isLoading && !isLastStep && (
          <ArrowRight className="h-4 w-4 rtl:rotate-180" />
        )}
      </Button>
    </div>
  )
}
