"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { FormProvider, useForm } from "react-hook-form"
import { toast } from "sonner"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  FormStepNavigation,
  FormStepProgress,
  useFormAnalytics,
} from "@/components/form"

import { submitNewcomerApplication, verifyEmailCode } from "./actions"
import { NEWCOMER_CONFIG, NEWCOMER_STEPS } from "./config"
import {
  InfoStep,
  ProfileStep,
  RoleStep,
  VerifyStep,
  WelcomeStep,
} from "./steps"
import { newcomerFormSchema, type NewcomerFormData } from "./validation"

interface NewcomersModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  schoolId: string
  schoolName?: string
}

/**
 * Newcomers Onboarding Modal
 *
 * 5-step modal for internal school people to join:
 * 1. Role Selection
 * 2. Basic Information
 * 3. Email Verification
 * 4. Profile Setup
 * 5. Welcome
 */
export function NewcomersModal({
  open,
  onOpenChange,
  schoolId,
  schoolName,
}: NewcomersModalProps) {
  const router = useRouter()
  const analytics = useFormAnalytics()
  const [currentStep, setCurrentStep] = React.useState(0)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [isComplete, setIsComplete] = React.useState(false)

  const form = useForm<NewcomerFormData>({
    resolver: zodResolver(newcomerFormSchema),
    mode: "onChange",
    defaultValues: {
      role: undefined,
      givenName: "",
      surname: "",
      email: "",
      phone: "",
      verificationCode: "",
    },
  })

  const totalSteps = NEWCOMER_STEPS.length
  const isFirstStep = currentStep === 0
  const isLastStep = currentStep === totalSteps - 1
  const stepConfig = NEWCOMER_STEPS[currentStep]

  // Track step views
  React.useEffect(() => {
    if (open && stepConfig) {
      analytics.trackStepView("newcomers", stepConfig.id)
    }
  }, [open, currentStep, stepConfig, analytics])

  const validateCurrentStep = async (): Promise<boolean> => {
    const fieldsToValidate = stepConfig?.fields || []
    if (fieldsToValidate.length === 0) return true

    const result = await form.trigger(
      fieldsToValidate as Array<keyof NewcomerFormData>
    )
    return result
  }

  const handleNext = async () => {
    // Validate current step
    const isValid = await validateCurrentStep()
    if (!isValid) return

    // Special handling for verification step
    if (currentStep === 2) {
      const email = form.getValues("email")
      const code = form.getValues("verificationCode")

      setIsSubmitting(true)
      try {
        const result = await verifyEmailCode(email, code)
        if (!result.success) {
          form.setError("verificationCode", {
            type: "manual",
            message: result.error || "Invalid code",
          })
          setIsSubmitting(false)
          return
        }
      } catch {
        toast.error("Verification failed")
        setIsSubmitting(false)
        return
      }
      setIsSubmitting(false)
    }

    // Track step completion
    analytics.trackStepComplete("newcomers", stepConfig?.id || "")

    // Move to next step or submit
    if (isLastStep || currentStep === 3) {
      // Submit on profile step (step 4 / index 3)
      if (currentStep === 3) {
        await handleSubmit()
      }
    } else {
      setCurrentStep((prev) => prev + 1)
    }
  }

  const handleBack = () => {
    if (isFirstStep) {
      onOpenChange(false)
    } else {
      setCurrentStep((prev) => prev - 1)
    }
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    try {
      const data = form.getValues()
      const result = await submitNewcomerApplication(schoolId, data)

      if (result.success) {
        analytics.trackFlowComplete("newcomers", data)
        setIsComplete(true)
        setCurrentStep(4) // Move to welcome step
        toast.success("Application submitted successfully!")
      } else {
        toast.error(result.error || "Failed to submit application")
      }
    } catch (error) {
      console.error("Submit error:", error)
      toast.error("An error occurred. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleComplete = () => {
    onOpenChange(false)
    router.refresh()
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen && !isComplete) {
      // Track abandonment
      analytics.trackFlowAbandonment("newcomers", stepConfig?.id || "")
    }
    onOpenChange(newOpen)

    // Reset form when closing
    if (!newOpen) {
      setTimeout(() => {
        setCurrentStep(0)
        setIsComplete(false)
        form.reset()
      }, 300)
    }
  }

  const getNextLabel = () => {
    if (currentStep === 3) return "Submit Application"
    if (currentStep === 2) return "Verify"
    return "Continue"
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>
            {isComplete
              ? "Application Submitted"
              : `Join ${schoolName || "School"}`}
          </DialogTitle>
          {!isComplete && (
            <DialogDescription>
              Complete the steps below to join as a{" "}
              {form.watch("role") || "member"}
            </DialogDescription>
          )}
        </DialogHeader>

        {!isComplete && (
          <FormStepProgress
            current={currentStep}
            total={totalSteps - 1} // Exclude welcome step from progress
            variant="dots"
            className="py-2"
          />
        )}

        <FormProvider {...form}>
          <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
            {/* Step Content */}
            <div className="min-h-[300px]">
              {currentStep === 0 && <RoleStep />}
              {currentStep === 1 && <InfoStep />}
              {currentStep === 2 && <VerifyStep />}
              {currentStep === 3 && <ProfileStep />}
              {currentStep === 4 && <WelcomeStep onComplete={handleComplete} />}
            </div>

            {/* Navigation (hide on welcome step) */}
            {!isComplete && (
              <FormStepNavigation
                onBack={handleBack}
                onNext={handleNext}
                isFirstStep={isFirstStep}
                isLastStep={currentStep === 3}
                isLoading={isSubmitting}
                backLabel={isFirstStep ? "Cancel" : "Back"}
                nextLabel={getNextLabel()}
                submitLabel="Submit Application"
              />
            )}
          </form>
        </FormProvider>
      </DialogContent>
    </Dialog>
  )
}
