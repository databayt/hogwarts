"use client"

import * as React from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import confetti from "canvas-confetti"
import { FormProvider, useForm } from "react-hook-form"

import { toast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  FormStepContainer,
  FormStepHeader,
  FormStepNavigation,
  FormStepProgress,
  FormSuccess,
} from "@/components/form"

import { bookVisit } from "./actions"
import { VISIT_CONFIG, VISIT_STEPS } from "./config"
import { ConfirmStep } from "./steps/confirm-step"
import { DateStep } from "./steps/date-step"
import { InfoStep } from "./steps/info-step"
import { TimeStep } from "./steps/time-step"
import { visitFormSchema, type VisitFormData } from "./validation"

interface VisitModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  schoolId: string
  schoolName?: string
}

export function VisitModal({
  open,
  onOpenChange,
  schoolId,
  schoolName,
}: VisitModalProps) {
  const [currentStep, setCurrentStep] = React.useState(0)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [isComplete, setIsComplete] = React.useState(false)

  const form = useForm<VisitFormData>({
    resolver: zodResolver(visitFormSchema),
    defaultValues: {
      date: "",
      startTime: "",
      endTime: "",
      visitorName: "",
      email: "",
      phone: "",
      purpose: "",
      visitors: 1,
      notes: "",
    },
    mode: "onChange",
  })

  const stepValidation = VISIT_CONFIG.validation
  const steps = VISIT_STEPS
  const isFirstStep = currentStep === 0
  const isLastStep = currentStep === steps.length - 1

  const validateCurrentStep = async (): Promise<boolean> => {
    const currentStepConfig = steps[currentStep]

    if (currentStepConfig.optional || !stepValidation) {
      return true
    }

    const schema = stepValidation[currentStepConfig.id]
    if (!schema) {
      return true
    }

    const fields = currentStepConfig.fields || []
    const result = await form.trigger(fields as (keyof VisitFormData)[])
    return result
  }

  const handleNext = async () => {
    const isValid = await validateCurrentStep()
    if (isValid) {
      if (isLastStep) {
        await handleSubmit()
      } else {
        setCurrentStep((prev) => prev + 1)
      }
    }
  }

  const handleBack = () => {
    if (!isFirstStep) {
      setCurrentStep((prev) => prev - 1)
    }
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    try {
      const data = form.getValues()
      const result = await bookVisit(schoolId, data)

      if (result.success) {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        })
        setIsComplete(true)
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to book visit",
          variant: "destructive",
        })
      }
    } catch {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    if (!isSubmitting) {
      onOpenChange(false)
      // Reset after animation
      setTimeout(() => {
        setCurrentStep(0)
        setIsComplete(false)
        form.reset()
      }, 300)
    }
  }

  const currentStepConfig = steps[currentStep]

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isComplete ? "Visit Booked!" : "Schedule a Visit"}
          </DialogTitle>
          <DialogDescription>
            {isComplete
              ? "Your visit has been scheduled successfully"
              : `Book a visit to ${schoolName || "our school"}`}
          </DialogDescription>
        </DialogHeader>

        {isComplete ? (
          <FormSuccess
            title="Visit Booked!"
            description="We've sent a confirmation to your email."
            nextSteps={[
              {
                label: "Check your email",
                description: "Confirmation details sent",
              },
              {
                label: "Add to calendar",
                description: "Download calendar invite",
              },
            ]}
            onComplete={handleClose}
          />
        ) : (
          <FormProvider {...form}>
            <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
              <FormStepProgress
                current={currentStep}
                total={steps.length}
                variant="dots"
              />

              <FormStepHeader
                title={currentStepConfig.title}
                description={currentStepConfig.description}
              />

              <FormStepContainer>
                {currentStep === 0 && <DateStep schoolId={schoolId} />}
                {currentStep === 1 && <TimeStep schoolId={schoolId} />}
                {currentStep === 2 && <InfoStep />}
                {currentStep === 3 && <ConfirmStep schoolName={schoolName} />}
              </FormStepContainer>

              <FormStepNavigation
                onBack={handleBack}
                onNext={handleNext}
                isFirstStep={isFirstStep}
                isLastStep={isLastStep}
                isLoading={isSubmitting}
                nextLabel={isLastStep ? "Confirm Booking" : "Continue"}
              />
            </form>
          </FormProvider>
        )}
      </DialogContent>
    </Dialog>
  )
}
