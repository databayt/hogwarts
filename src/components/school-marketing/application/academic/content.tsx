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
import type { SubmitActionResult } from "../submit-action"
import ApplicationSuccessModal from "../success-modal"
import type { AcademicStepData } from "../types"
import { getApplyErrorDict, getApplyStepDict } from "../utils"
import { useApplyValidation } from "../validation-context"
import { getStepValidationStatus } from "../validation-helpers"
import { ACADEMIC_STEP_CONFIG } from "./config"
import { AcademicForm } from "./form"
import type { AcademicFormRef } from "./types"

interface Props {
  dictionary?: Record<string, unknown>
}

export default function AcademicContent({ dictionary }: Props) {
  const params = useParams()
  const router = useRouter()
  const { locale, isRTL } = useLocale()
  const subdomain = params.subdomain as string
  const id = params.id as string

  const { enableNext, disableNext, setCustomNavigation } = useApplyValidation()
  const { session, getStepData, saveSession } = useApplySession()
  const academicFormRef = useRef<AcademicFormRef>(null)
  const sessionRef = useRef(session)
  sessionRef.current = session
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [submitResult, setSubmitResult] = useState<SubmitActionResult | null>(
    null
  )

  const initialData = getStepData("academic")
  const stepDict = getApplyStepDict(dictionary, "academic")
  const errorDict = getApplyErrorDict(dictionary)

  const onNext = useCallback(async () => {
    if (!academicFormRef.current) return

    setIsSubmitting(true)
    setError(null)

    try {
      // Save academic step first
      await academicFormRef.current.saveAndNext()

      // Use ref to get latest session (avoids stale closure)
      const currentSession = sessionRef.current

      // Validate each step individually and report the first incomplete one
      const stepStatus = getStepValidationStatus(currentSession.formData)
      const stepErrorMap: Record<string, string> = {
        personal: errorDict.incompletePersonal || errorDict.completeAllSteps,
        contact: errorDict.incompleteContact || errorDict.completeAllSteps,
        location: errorDict.incompleteLocation || errorDict.completeAllSteps,
        guardian: errorDict.incompleteGuardian || errorDict.completeAllSteps,
        academic: errorDict.incompleteAcademic || errorDict.completeAllSteps,
      }

      for (const [step, isValid] of Object.entries(stepStatus)) {
        if (!isValid) {
          throw new Error(stepErrorMap[step])
        }
      }

      // Ensure session is saved before submitting (handles race with auto-save)
      let tokenToUse = currentSession.sessionToken
      if (!tokenToUse) {
        tokenToUse = await saveSession()
        if (!tokenToUse) {
          throw new Error(errorDict.failedToSaveSession)
        }
      }

      // Build documents array from individual attachment URLs
      const attachments = currentSession.formData.attachments
      const extractUrl = (v: unknown): string =>
        typeof v === "string" ? v : (v as { url?: string })?.url || ""
      const documentSlots = [
        { key: "degreeUrl" as const, type: "degree", name: "Degree" },
        {
          key: "transcriptUrl" as const,
          type: "transcript",
          name: "Transcript",
        },
        { key: "idUrl" as const, type: "id", name: "ID" },
        { key: "resumeUrl" as const, type: "resume", name: "Resume" },
        { key: "otherUrl" as const, type: "other", name: "Other" },
      ]
      const documents = documentSlots
        .map((slot) => ({
          type: slot.type,
          name: slot.name,
          url: extractUrl(attachments?.[slot.key]),
          uploadedAt: new Date().toISOString(),
        }))
        .filter((doc) => doc.url.length > 0)

      // Build flat form data and submit
      const formData = {
        campaignId: id,
        ...currentSession.formData.personal,
        ...currentSession.formData.contact,
        ...currentSession.formData.location,
        ...currentSession.formData.guardian,
        ...currentSession.formData.academic,
        photoUrl: extractUrl(attachments?.profilePhotoUrl),
        ...(documents.length > 0 ? { documents } : {}),
      }

      const result = await submitApplicationAction(
        subdomain,
        tokenToUse,
        formData
      )

      if (!result.success || !result.data) {
        throw new Error(result.error || errorDict.failedToSubmit)
      }

      // Clean up localStorage draft after successful submission
      try {
        localStorage.removeItem(
          `hogwarts_apply_session_${sessionRef.current.campaignId}`
        )
      } catch {
        // localStorage may not be available
      }

      // Route based on payment requirement
      if (result.data.requiresPayment) {
        router.push(
          `/${locale}/application/${result.data.applicationId}/payment?number=${result.data.applicationNumber}&token=${encodeURIComponent(result.data.accessToken)}`
        )
      } else {
        setSubmitResult(result.data)
        setShowSuccessModal(true)
        setIsSubmitting(false)
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : errorDict.failedToSubmit || ""
      )
      setIsSubmitting(false)
    }
  }, [subdomain, id, errorDict, locale, router, saveSession])

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

  const applicantEmail = session.formData.contact?.email

  return (
    <>
      <FormLayout>
        <FormHeading
          title={stepDict.title || ACADEMIC_STEP_CONFIG.label(isRTL)}
          description={
            stepDict.description || ACADEMIC_STEP_CONFIG.description(isRTL)
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
      {submitResult && (
        <ApplicationSuccessModal
          applicationNumber={submitResult.applicationNumber}
          applicantEmail={applicantEmail}
          password={submitResult.accessToken}
          schoolUrl={`${subdomain}.databayt.org`}
          showModal={showSuccessModal}
          setShowModal={setShowSuccessModal}
          isRTL={isRTL}
          locale={locale}
        />
      )}
    </>
  )
}
