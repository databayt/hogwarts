"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import React, { useCallback, useEffect, useRef, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { FormHeading, FormLayout } from "@/components/form"
import { useWizardValidation } from "@/components/form/template/wizard-validation-context"
import type { WizardFormRef } from "@/components/form/wizard"
import { WizardStep } from "@/components/form/wizard"

import { completeExamWizard } from "../actions"
import { useExamWizard } from "../use-exam-wizard"
import { SettingsForm } from "./form"

export default function SettingsContent() {
  const params = useParams()
  const router = useRouter()
  const examId = params.id as string
  const formRef = useRef<WizardFormRef>(null)
  const { data, isLoading } = useExamWizard()
  const { enableNext, disableNext, setCustomNavigation } = useWizardValidation()

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const submittingRef = useRef(false)
  const [isValid, setIsValid] = useState(true) // optional step

  const handleComplete = useCallback(async () => {
    if (submittingRef.current) return
    submittingRef.current = true
    setIsSubmitting(true)
    setError(null)

    try {
      // Save settings first
      await formRef.current?.saveAndNext()

      // Then complete the wizard
      const result = await completeExamWizard(examId)

      if (result.success) {
        router.push("/exams")
      } else {
        submittingRef.current = false
        setIsSubmitting(false)
        setError(result.error || "Failed to complete. Please try again.")
      }
    } catch {
      submittingRef.current = false
      setIsSubmitting(false)
      setError("Failed to save settings. Please try again.")
    }
  }, [examId, router])

  useEffect(() => {
    if (isValid && !isSubmitting) {
      enableNext()
      setCustomNavigation({ onNext: handleComplete })
    } else {
      disableNext()
      setCustomNavigation(undefined)
    }
  }, [
    isValid,
    isSubmitting,
    enableNext,
    disableNext,
    setCustomNavigation,
    handleComplete,
  ])

  return (
    <WizardStep
      entityId={examId}
      nextStep={undefined}
      isValid={isValid}
      formRef={formRef}
      isLoading={isLoading}
      isReviewStep
    >
      <FormLayout>
        <FormHeading
          title="Proctoring & Settings"
          description="Configure exam security and submission settings."
        />

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {isSubmitting && (
          <div className="flex items-center justify-center gap-2 py-4">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Completing exam setup...</span>
          </div>
        )}

        <SettingsForm
          ref={formRef}
          examId={examId}
          initialData={
            data
              ? {
                  proctorMode: data.proctorMode as
                    | "NONE"
                    | "BASIC"
                    | "STANDARD"
                    | "STRICT",
                  shuffleQuestions: data.shuffleQuestions,
                  shuffleOptions: data.shuffleOptions,
                  maxAttempts: data.maxAttempts,
                  retakePenalty: data.retakePenalty ?? undefined,
                  allowLateSubmit: data.allowLateSubmit,
                  lateSubmitMinutes: data.lateSubmitMinutes,
                }
              : undefined
          }
          onValidChange={setIsValid}
        />
      </FormLayout>
    </WizardStep>
  )
}
