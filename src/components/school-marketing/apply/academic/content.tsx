"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import React, { useCallback, useEffect, useRef, useState } from "react"
import { useParams, useRouter } from "next/navigation"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { FormHeading, FormLayout } from "@/components/form"
import { useLocale } from "@/components/internationalization/use-locale"

import { useApplySession } from "../application-context"
import {
  submitApplicationAction,
  type SubmitActionResult,
} from "../submit-action"
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
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const initialData = getStepData("academic")

  const handleSuccess = useCallback(
    (result: SubmitActionResult) => {
      if (result.requiresPayment) {
        const searchParams = new URLSearchParams({
          number: result.applicationNumber,
        })
        router.push(
          `/${locale}/apply/${result.applicationId}/payment?${searchParams.toString()}`
        )
      } else {
        router.push(
          `/${locale}/apply/${id}/success?number=${result.applicationNumber}`
        )
      }
    },
    [locale, id, router]
  )

  const onNext = useCallback(async () => {
    if (!academicFormRef.current) return

    setIsSubmitting(true)
    setError(null)

    try {
      // Save academic step first
      await academicFormRef.current.saveAndNext()

      // Check completeness
      const { personal, contact, guardian, academic } = session.formData
      if (
        !personal?.firstName ||
        !personal?.lastName ||
        !contact?.email ||
        !contact?.phone ||
        !guardian?.fatherName ||
        !guardian?.motherName ||
        !academic?.applyingForClass
      ) {
        throw new Error(
          isRTL
            ? "يرجى إكمال جميع الخطوات المطلوبة"
            : "Please complete all required steps"
        )
      }

      if (!session.sessionToken) {
        throw new Error("No session token")
      }

      // Build flat form data and submit
      const formData = {
        campaignId: id,
        ...session.formData.attachments,
        ...personal,
        ...contact,
        ...session.formData.location,
        ...guardian,
        ...academic,
        photoUrl: session.formData.attachments?.passportPhotoUrl,
        signatureUrl: session.formData.attachments?.signatureUrl,
      }

      const result = await submitApplicationAction(
        subdomain,
        session.sessionToken,
        formData
      )

      if (!result.success || !result.data) {
        throw new Error(result.error || "Failed to submit application")
      }

      handleSuccess(result.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit")
      setIsSubmitting(false)
    }
  }, [session, subdomain, id, isRTL, handleSuccess])

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
