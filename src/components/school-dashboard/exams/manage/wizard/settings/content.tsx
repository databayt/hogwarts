"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import React, { useEffect, useRef, useState } from "react"
import { useParams, useRouter } from "next/navigation"

import { FormHeading, FormLayout } from "@/components/form"
import { useWizardValidation } from "@/components/form/template/wizard-validation-context"
import type { WizardFormRef } from "@/components/form/wizard"
import { WizardStep } from "@/components/form/wizard"

import { completeExamWizard } from "../actions"
import { useExamWizard } from "../use-exam-wizard"
import { SettingsForm } from "./form"

const TAB_HEADINGS: Record<string, { title: string; description: string }> = {
  proctoring: {
    title: "Proctoring",
    description: "Configure exam security and monitoring settings.",
  },
  attempts: {
    title: "Attempts & Submission",
    description: "Configure attempt limits and late submission rules.",
  },
}

export default function SettingsContent() {
  const params = useParams()
  const router = useRouter()
  const examId = params.id as string
  const formRef = useRef<WizardFormRef>(null)
  const { data, isLoading } = useExamWizard()
  const { setCustomNavigation } = useWizardValidation()
  const [isValid, setIsValid] = useState(true) // optional step
  const [heading, setHeading] = useState(TAB_HEADINGS.proctoring)
  const isSavingRef = useRef(false)

  const handleTabChange = (tabId: string) => {
    setHeading(TAB_HEADINGS[tabId] || TAB_HEADINGS.proctoring)
  }

  // Set up completion navigation: save form + complete wizard + redirect
  useEffect(() => {
    const handleNext = async () => {
      if (isSavingRef.current) return
      isSavingRef.current = true
      try {
        await formRef.current?.saveAndNext()
        const result = await completeExamWizard(examId)
        if (result.success) {
          router.push("/exams")
        }
      } catch {
        // Error handled in form
      } finally {
        isSavingRef.current = false
      }
    }

    setCustomNavigation({ onNext: handleNext })
    return () => setCustomNavigation(undefined)
  }, [examId, router, setCustomNavigation])

  return (
    <WizardStep
      entityId={examId}
      isValid={isValid}
      formRef={formRef}
      isLoading={isLoading}
      isReviewStep
    >
      <FormLayout>
        <FormHeading title={heading.title} description={heading.description} />
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
          onTabChange={handleTabChange}
        />
      </FormLayout>
    </WizardStep>
  )
}
