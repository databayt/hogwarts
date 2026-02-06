"use client"

import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"

interface ModalFooterProps {
  /** Current step number (1-indexed) */
  currentStep: number
  /** Total number of steps */
  totalSteps: number
  /** Step label to display (e.g., "Basic Information") */
  stepLabel?: string
  /** Whether in view-only mode */
  isView?: boolean
  /** Whether editing an existing record */
  isEdit?: boolean
  /** Whether form is currently submitting */
  isSubmitting?: boolean
  /** Whether form has unsaved changes */
  isDirty?: boolean
  /** Progress percentage (0-100) */
  progress?: number
  /** Back/Cancel button handler */
  onBack: () => void
  /** Next/Create/Save button handler */
  onNext: () => void
  /** Save current step handler (for edit mode) */
  onSaveStep?: () => void
  /** Labels for buttons (for i18n) */
  labels?: {
    cancel?: string
    back?: string
    next?: string
    save?: string
    create?: string
    saving?: string
    /** Template for step indicator, e.g. "Step {current} of {total}" */
    stepOf?: string
  }
}

const defaultLabels = {
  cancel: "Cancel",
  back: "Back",
  next: "Next",
  save: "Save",
  create: "Create",
  saving: "Saving...",
}

export function ModalFooter({
  currentStep,
  totalSteps,
  stepLabel,
  isView = false,
  isEdit = false,
  isSubmitting = false,
  isDirty = false,
  progress,
  onBack,
  onNext,
  onSaveStep,
  labels = {},
}: ModalFooterProps) {
  const t = { ...defaultLabels, ...labels }

  // Calculate progress if not provided
  const progressValue = progress ?? (currentStep / totalSteps) * 100

  // Determine button labels
  const isFirstStep = currentStep === 1
  const isLastStep = currentStep === totalSteps
  const backLabel = isFirstStep ? t.cancel : t.back
  const nextLabel = isSubmitting
    ? t.saving
    : isLastStep
      ? isEdit
        ? t.save
        : t.create
      : t.next

  return (
    <footer className="bg-background fixed right-0 bottom-0 left-0 border-t">
      {/* Progress bar */}
      <div className="px-4 py-3 sm:px-8 md:px-12">
        <Progress value={progressValue} className="h-1" />
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between px-4 pb-4 sm:px-8 md:px-12">
        {/* Step indicator */}
        <div className="text-muted-foreground text-sm font-medium">
          {stepLabel ||
            (t.stepOf
              ? t.stepOf
                  .replace("{current}", String(currentStep))
                  .replace("{total}", String(totalSteps))
              : `Step ${currentStep} of ${totalSteps}`)}
        </div>

        {/* Action buttons */}
        <div className="flex gap-3">
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={onBack}
            disabled={isSubmitting}
          >
            {backLabel}
          </Button>

          {!isView && (
            <>
              {/* Save current step button (for edit mode on step 1) */}
              {isEdit && isFirstStep && onSaveStep && (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={onSaveStep}
                  disabled={!isDirty || isSubmitting}
                >
                  {t.save}
                </Button>
              )}

              {/* Next/Create/Save button */}
              <Button
                type="button"
                size="sm"
                onClick={onNext}
                disabled={isSubmitting}
              >
                {nextLabel}
              </Button>
            </>
          )}
        </div>
      </div>
    </footer>
  )
}

export default ModalFooter
