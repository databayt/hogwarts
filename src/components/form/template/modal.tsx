"use client"

import * as React from "react"

import { cn } from "@/lib/utils"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

import type { ModalMultiStepFormProps } from "../types"
import { useFormAnalytics } from "../use-form"
import { FormStepProgress } from "./progress"
import { MultiStepFormProvider, useMultiStepForm } from "./provider"

/**
 * Modal Multi-Step Form (Template)
 *
 * Full-featured modal for multi-step forms.
 * Includes progress tracking, close confirmation, and analytics.
 *
 * **Role**: Complete modal organism for multi-step forms
 *
 * **Usage Across App**:
 * - Newcomers onboarding modal
 * - Visit scheduling modal
 * - Admission application modal
 * - Quick settings wizards
 * - Any modal-based multi-step flow
 *
 * @example
 * ```tsx
 * <ModalMultiStepForm
 *   config={formConfig}
 *   open={isOpen}
 *   onOpenChange={setIsOpen}
 *   onComplete={handleComplete}
 *   title="Application Form"
 *   description="Complete all steps to submit"
 *   showCloseConfirmation
 * >
 *   <FormStepContainer>
 *     {currentStep === 0 && <PersonalInfoStep />}
 *     {currentStep === 1 && <ContactStep />}
 *   </FormStepContainer>
 * </ModalMultiStepForm>
 * ```
 */
export function ModalMultiStepForm({
  config,
  open,
  onOpenChange,
  onComplete,
  title,
  description,
  showCloseConfirmation = true,
  closeConfirmationMessage = "You have unsaved changes. Are you sure you want to close?",
  children,
}: ModalMultiStepFormProps) {
  const [showConfirmClose, setShowConfirmClose] = React.useState(false)
  const analytics = useFormAnalytics()

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen && showCloseConfirmation) {
      // Show confirmation dialog
      setShowConfirmClose(true)
    } else {
      onOpenChange(newOpen)
    }
  }

  const handleConfirmClose = () => {
    setShowConfirmClose(false)
    // Track abandonment
    analytics.trackFlowAbandonment(
      config.analyticsFlowType || "crud",
      config.steps[0]?.id || "unknown"
    )
    onOpenChange(false)
  }

  const handleCancelClose = () => {
    setShowConfirmClose(false)
  }

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-2xl">
          <MultiStepFormProvider
            config={config}
            onSubmit={async (data) => {
              await onComplete(data)
              analytics.trackFlowComplete(
                config.analyticsFlowType || "crud",
                data
              )
              onOpenChange(false)
            }}
            onStepChange={(stepId, direction) => {
              if (direction === "next") {
                analytics.trackStepComplete(
                  config.analyticsFlowType || "crud",
                  stepId
                )
              }
            }}
          >
            <ModalMultiStepContent title={title} description={description}>
              {children}
            </ModalMultiStepContent>
          </MultiStepFormProvider>
        </DialogContent>
      </Dialog>

      {/* Close confirmation dialog */}
      <AlertDialog open={showConfirmClose} onOpenChange={setShowConfirmClose}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Discard changes?</AlertDialogTitle>
            <AlertDialogDescription>
              {closeConfirmationMessage}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelClose}>
              Continue editing
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmClose}>
              Discard
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

/**
 * Internal component that uses the multi-step context
 */
function ModalMultiStepContent({
  title,
  description,
  children,
}: {
  title?: string
  description?: string
  children: React.ReactNode
}) {
  const { currentStep, totalSteps, progress, currentStepConfig } =
    useMultiStepForm()

  return (
    <>
      <DialogHeader>
        <div className="flex items-start justify-between">
          <div>
            {title && <DialogTitle>{title}</DialogTitle>}
            {description && (
              <DialogDescription>{description}</DialogDescription>
            )}
          </div>
          <div className="text-muted-foreground text-sm">
            Step {currentStep + 1} of {totalSteps}
          </div>
        </div>
        <FormStepProgress
          current={currentStep}
          total={totalSteps}
          variant="linear"
          className="mt-4"
        />
      </DialogHeader>

      <div className="py-4">{children}</div>
    </>
  )
}
