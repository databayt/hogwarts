"use client"

import { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { FormProvider, useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { AnthropicIcons, Icons } from "@/components/icons"
import type { Locale } from "@/components/internationalization/config"
import type { Dictionary } from "@/components/internationalization/dictionaries"

import type { School } from "../../types"
import { saveApplicationSession, submitApplication } from "../actions"
import StepAcademic from "../steps/step-academic"
import StepContact from "../steps/step-contact"
import StepDocuments from "../steps/step-documents"
import StepGuardian from "../steps/step-guardian"
// Step Components
import StepPersonal from "../steps/step-personal"
import StepReview from "../steps/step-review"
import type { PublicCampaign } from "../types"
import { FORM_STEPS, type ApplicationFormData } from "../types"
import {
  createApplicationStepSchemas,
  createFullApplicationSchema,
  type FullApplicationFormData,
} from "../validation"

interface Props {
  school: School
  campaign: PublicCampaign
  dictionary: Dictionary
  lang: Locale
  subdomain: string
  initialData?: Partial<ApplicationFormData>
  sessionToken?: string
}

export default function ApplicationFormContent({
  school,
  campaign,
  dictionary,
  lang,
  subdomain,
  initialData,
  sessionToken: initialSessionToken,
}: Props) {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [sessionToken, setSessionToken] = useState<string | null>(
    initialSessionToken || null
  )
  const [lastSaved, setLastSaved] = useState<Date | null>(null)

  // Skip campaign step since we already have campaignId
  const steps = FORM_STEPS.slice(1)
  const totalSteps = steps.length

  // Create schemas
  const stepSchemas = createApplicationStepSchemas()
  const fullSchema = createFullApplicationSchema()

  // Initialize form with default values
  const defaultValues: Partial<ApplicationFormData> = {
    campaignId: campaign.id,
    country: "Sudan",
    ...initialData,
  }

  const methods = useForm<FullApplicationFormData>({
    resolver: zodResolver(fullSchema) as any,
    defaultValues: defaultValues as FullApplicationFormData,
    mode: "onChange",
  })

  const { handleSubmit, trigger, getValues, watch, formState } = methods
  const formData = watch()

  // Auto-save every 30 seconds
  const autoSave = useCallback(async () => {
    if (!formData.email) return

    setIsSaving(true)
    try {
      const result = await saveApplicationSession(
        subdomain,
        {
          formData: getValues(),
          currentStep,
          email: formData.email,
          campaignId: campaign.id,
        },
        sessionToken || undefined
      )

      if (result.success && result.data) {
        setSessionToken(result.data.sessionToken)
        setLastSaved(new Date())
        // Save to localStorage as backup
        localStorage.setItem(
          `application_${subdomain}_${campaign.id}`,
          JSON.stringify({
            formData: getValues(),
            currentStep,
            sessionToken: result.data.sessionToken,
          })
        )
      }
    } catch (error) {
      console.error("Auto-save failed:", error)
    } finally {
      setIsSaving(false)
    }
  }, [
    formData.email,
    subdomain,
    campaign.id,
    currentStep,
    sessionToken,
    getValues,
  ])

  // Auto-save timer
  useEffect(() => {
    const interval = setInterval(() => {
      if (formData.email && formState.isDirty) {
        autoSave()
      }
    }, 30000) // 30 seconds

    return () => clearInterval(interval)
  }, [formData.email, formState.isDirty, autoSave])

  // Load from localStorage on mount
  useEffect(() => {
    if (!initialData) {
      const saved = localStorage.getItem(
        `application_${subdomain}_${campaign.id}`
      )
      if (saved) {
        try {
          const parsed = JSON.parse(saved)
          if (parsed.formData) {
            Object.keys(parsed.formData).forEach((key) => {
              methods.setValue(
                key as keyof FullApplicationFormData,
                parsed.formData[key]
              )
            })
          }
          if (parsed.currentStep) {
            setCurrentStep(parsed.currentStep)
          }
          if (parsed.sessionToken) {
            setSessionToken(parsed.sessionToken)
          }
        } catch (e) {
          console.error("Failed to load saved application:", e)
        }
      }
    }
  }, [initialData, subdomain, campaign.id, methods])

  // Get current step schema
  const getCurrentStepSchema = () => {
    const stepId = steps[currentStep]?.id
    switch (stepId) {
      case "personal":
        return stepSchemas.personal
      case "contact":
        return stepSchemas.contact
      case "guardian":
        return stepSchemas.guardian
      case "academic":
        return stepSchemas.academic
      case "documents":
        return stepSchemas.documents
      default:
        return z.object({})
    }
  }

  // Validate current step
  const validateCurrentStep = async () => {
    const stepId = steps[currentStep]?.id
    const fields = steps[currentStep]?.fields || []
    return await trigger(fields as (keyof FullApplicationFormData)[])
  }

  // Handle next step
  const handleNext = async () => {
    const isValid = await validateCurrentStep()
    if (isValid) {
      if (currentStep < totalSteps - 1) {
        setCurrentStep(currentStep + 1)
        // Auto-save on step change
        if (formData.email) {
          autoSave()
        }
      }
    }
  }

  // Handle previous step
  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  // Manual save
  const handleSave = async () => {
    if (!formData.email) {
      toast.error(
        dictionary?.marketing?.site?.admission?.portal?.errorSaving ||
          "Please enter your email to save"
      )
      return
    }

    setIsSaving(true)
    try {
      const result = await saveApplicationSession(
        subdomain,
        {
          formData: getValues(),
          currentStep,
          email: formData.email,
          campaignId: campaign.id,
        },
        sessionToken || undefined
      )

      if (result.success && result.data) {
        setSessionToken(result.data.sessionToken)
        setLastSaved(new Date())
        toast.success(
          dictionary?.marketing?.site?.admission?.portal?.saved ||
            "Application saved"
        )
      } else {
        toast.error(result.error || "Failed to save")
      }
    } catch (error) {
      toast.error(
        dictionary?.marketing?.site?.admission?.portal?.failedToSave ||
          "Failed to save"
      )
    } finally {
      setIsSaving(false)
    }
  }

  // Handle form submission
  const onSubmit = async (data: FullApplicationFormData) => {
    setIsSubmitting(true)
    try {
      const result = await submitApplication(
        subdomain,
        sessionToken || "",
        data as ApplicationFormData
      )

      if (result.success && result.data) {
        // Clear localStorage
        localStorage.removeItem(`application_${subdomain}_${campaign.id}`)

        // Redirect to success page
        router.push(
          `/${lang}/apply/success?number=${result.data.applicationNumber}&token=${result.data.accessToken}`
        )
      } else {
        toast.error(result.error || "Failed to submit application")
      }
    } catch (error) {
      toast.error(
        dictionary?.marketing?.site?.admission?.portal?.failedToSubmit ||
          "Failed to submit application"
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  // Render current step content
  const renderStepContent = () => {
    const stepId = steps[currentStep]?.id
    switch (stepId) {
      case "personal":
        return <StepPersonal dictionary={dictionary} lang={lang} />
      case "contact":
        return <StepContact dictionary={dictionary} lang={lang} />
      case "guardian":
        return <StepGuardian dictionary={dictionary} lang={lang} />
      case "academic":
        return (
          <StepAcademic
            dictionary={dictionary}
            lang={lang}
            campaign={campaign}
          />
        )
      case "documents":
        return (
          <StepDocuments
            dictionary={dictionary}
            lang={lang}
            campaign={campaign}
          />
        )
      case "review":
        return (
          <StepReview dictionary={dictionary} lang={lang} campaign={campaign} />
        )
      default:
        return null
    }
  }

  const currentStepInfo = steps[currentStep]
  const progress = ((currentStep + 1) / totalSteps) * 100
  const isLastStep = currentStep === totalSteps - 1

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="space-y-8">
          {/* Header */}
          <div className="mb-8 text-center">
            <h1 className="scroll-m-20 text-2xl font-bold tracking-tight md:text-3xl">
              {campaign.name}
            </h1>
            <p className="text-muted-foreground mt-2">{school.name}</p>
          </div>

          {/* Progress */}
          <div className="space-y-3">
            <div className="text-muted-foreground flex justify-between text-sm">
              <span className="font-medium">
                {dictionary?.marketing?.site?.admission?.portal?.step || "Step"}{" "}
                {currentStep + 1}{" "}
                {dictionary?.marketing?.site?.admission?.portal?.of || "of"}{" "}
                {totalSteps}
              </span>
              <span>{currentStepInfo?.label}</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Step indicators */}
          <div className="flex justify-center gap-3 overflow-x-auto py-2">
            {steps.map((step, index) => (
              <div
                key={step.id}
                className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-sm font-medium transition-all duration-200 ${
                  index === currentStep
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : index < currentStep
                      ? "bg-primary/20 text-primary"
                      : "bg-muted text-muted-foreground"
                }`}
              >
                {index < currentStep ? (
                  <AnthropicIcons.Checklist className="h-4 w-4" />
                ) : (
                  index + 1
                )}
              </div>
            ))}
          </div>

          {/* Step Content */}
          <Card>
            <CardHeader>
              <CardTitle>{currentStepInfo?.label}</CardTitle>
              <CardDescription>{currentStepInfo?.description}</CardDescription>
            </CardHeader>
            <CardContent>{renderStepContent()}</CardContent>
          </Card>

          {/* Navigation */}
          <div className="flex items-center justify-between pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 0}
              className="group"
            >
              <AnthropicIcons.ArrowRight className="me-2 h-4 w-4 rotate-180 transition-transform group-hover:-translate-x-1 rtl:group-hover:translate-x-1" />
              {dictionary?.marketing?.site?.admission?.portal?.previous ||
                "Previous"}
            </Button>

            <div className="flex items-center gap-3">
              {/* Save button */}
              <Button
                type="button"
                variant="ghost"
                onClick={handleSave}
                disabled={isSaving || !formData.email}
                className="text-muted-foreground hover:text-foreground"
              >
                {isSaving ? (
                  <Icons.loader2 className="me-2 h-4 w-4 animate-spin" />
                ) : (
                  <AnthropicIcons.Archive className="me-2 h-4 w-4" />
                )}
                {dictionary?.marketing?.site?.admission?.portal?.save || "Save"}
              </Button>

              {/* Next/Submit button */}
              {isLastStep ? (
                <Button type="submit" disabled={isSubmitting} className="group">
                  {isSubmitting ? (
                    <Icons.loader2 className="me-2 h-4 w-4 animate-spin" />
                  ) : (
                    <AnthropicIcons.Sparkle className="me-2 h-4 w-4" />
                  )}
                  {dictionary?.marketing?.site?.admission?.portal?.submit ||
                    "Submit Application"}
                </Button>
              ) : (
                <Button type="button" onClick={handleNext} className="group">
                  {dictionary?.marketing?.site?.admission?.portal?.next ||
                    "Next"}
                  <AnthropicIcons.ArrowRight className="ms-2 h-4 w-4 transition-transform group-hover:translate-x-1 rtl:group-hover:-translate-x-1" />
                </Button>
              )}
            </div>
          </div>

          {/* Last saved indicator */}
          {lastSaved && (
            <p className="text-muted-foreground pt-2 text-center text-xs">
              <AnthropicIcons.Checklist className="me-1 inline h-3 w-3" />
              {dictionary?.marketing?.site?.admission?.portal?.lastSaved ||
                "Last saved:"}{" "}
              {lastSaved.toLocaleTimeString(lang === "ar" ? "ar-SA" : "en-US")}
            </p>
          )}
        </div>
      </form>
    </FormProvider>
  )
}
