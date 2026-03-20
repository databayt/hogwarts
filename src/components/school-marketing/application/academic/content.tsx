"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import React, { useCallback, useEffect, useRef, useState } from "react"
import { useParams, useRouter } from "next/navigation"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { FormHeading, FormLayout } from "@/components/form"
import { useLocale } from "@/components/internationalization/use-locale"

import { useApplySession } from "../application-context"
import { submitApplicationAction } from "../submit-action"
import type { AcademicStepData } from "../types"
import { useApplyValidation } from "../validation-context"
import { ACADEMIC_STEP_CONFIG } from "./config"
import { AcademicForm } from "./form"
import type { AcademicFormRef } from "./types"

interface Props {
  dictionary?: Record<string, unknown>
}

export default function AcademicContent({ dictionary }: Props) {
  const params = useParams()
  const router = useRouter()
  const { locale } = useLocale()
  const isRTL = locale === "ar"
  const subdomain = params.subdomain as string
  const id = params.id as string

  const { enableNext, disableNext, setCustomNavigation } = useApplyValidation()
  const { session, getStepData } = useApplySession()
  const academicFormRef = useRef<AcademicFormRef>(null)
  const sessionRef = useRef(session)
  sessionRef.current = session
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const initialData = getStepData("academic")

  const onNext = useCallback(async () => {
    if (!academicFormRef.current) return

    setIsSubmitting(true)
    setError(null)

    try {
      // Save academic step first
      await academicFormRef.current.saveAndNext()

      // Use ref to get latest session (avoids stale closure)
      const currentSession = sessionRef.current
      const { personal, contact, guardian, academic } = currentSession.formData

      // Check completeness
      if (
        !personal?.firstName ||
        !personal?.lastName ||
        !contact?.email ||
        !contact?.phone ||
        (!guardian?.fatherName && !guardian?.motherName) ||
        !academic?.applyingForClass
      ) {
        throw new Error(
          isRTL
            ? "يرجى إكمال جميع الخطوات المطلوبة"
            : "Please complete all required steps"
        )
      }

      if (!currentSession.sessionToken) {
        throw new Error("No session token")
      }

      // Build flat form data and submit
      const formData = {
        campaignId: id,
        ...currentSession.formData.attachments,
        ...personal,
        ...contact,
        ...currentSession.formData.location,
        ...guardian,
        ...academic,
        photoUrl: currentSession.formData.attachments?.profilePhotoUrl,
      }

      const result = await submitApplicationAction(
        subdomain,
        currentSession.sessionToken,
        formData
      )

      if (!result.success || !result.data) {
        throw new Error(result.error || "Failed to submit application")
      }

      // Route based on payment requirement
      if (result.data.requiresPayment) {
        router.push(
          `/${locale}/application/${result.data.applicationId}/payment?number=${result.data.applicationNumber}`
        )
      } else {
        router.push(
          `/${locale}/application/${result.data.applicationId}/success?number=${result.data.applicationNumber}`
        )
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit")
      setIsSubmitting(false)
    }
  }, [subdomain, id, isRTL, locale, router])

  useEffect(() => {
    const academicData = session.formData.academic

    const isValid = academicData?.applyingForClass

    if (isValid && !isSubmitting) {
      enableNext()
      setCustomNavigation({ onNext })
    } else {
      disableNext()
      setCustomNavigation(undefined)
    }
  }, [
    session.formData.academic,
    isSubmitting,
    enableNext,
    disableNext,
    setCustomNavigation,
    onNext,
  ])

  const dict = ((dictionary as Record<string, Record<string, string>> | null)
    ?.apply?.academic ?? {}) as Record<string, string>

  return (
    <FormLayout>
      <FormHeading
        title={dict.title || ACADEMIC_STEP_CONFIG.label(isRTL)}
        description={
          dict.description || ACADEMIC_STEP_CONFIG.description(isRTL)
        }
      />
      <div className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <AcademicForm
          ref={academicFormRef}
          initialData={initialData as AcademicStepData}
          dictionary={dictionary}
        />
      </div>
    </FormLayout>
  )
}
