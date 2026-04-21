"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import React, { useCallback, useEffect, useRef, useState } from "react"
import { useParams, useRouter } from "next/navigation"

import type { FeePreview } from "@/lib/fee-preview"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { FeePreviewCard } from "@/components/finance/fee-preview-card"
import { FormHeading, FormLayout } from "@/components/form"
import { useLocale } from "@/components/internationalization/use-locale"

import { useApplySession } from "../application-context"
import { submitApplicationAction } from "../submit-action"
import type { SubmitActionResult } from "../submit-action"
import ApplicationSuccessModal from "../success-modal"
import { getApplyErrorDict, getApplyStepDict } from "../utils"
import { useApplyValidation } from "../validation-context"
import { getStepValidationStatus } from "../validation-helpers"
import { getApplicationFeePreview } from "./actions"
import { FEES_STEP_CONFIG } from "./config"

interface Props {
  dictionary?: Record<string, unknown>
}

export default function FeesContent({ dictionary }: Props) {
  const params = useParams()
  const router = useRouter()
  const { locale, isRTL } = useLocale()
  const subdomain = params.subdomain as string
  const id = params.id as string

  const { enableNext, disableNext, setCustomNavigation } = useApplyValidation()
  const { session, saveSession } = useApplySession()
  const sessionRef = useRef(session)
  sessionRef.current = session

  const [preview, setPreview] = useState<FeePreview | null>(null)
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [submitResult, setSubmitResult] = useState<SubmitActionResult | null>(
    null
  )

  const stepDict = getApplyStepDict(dictionary, "fees")
  const errorDict = getApplyErrorDict(dictionary)
  const feeDict = (
    (dictionary?.school as Record<string, unknown> | undefined)?.admission as
      | Record<string, unknown>
      | undefined
  )?.apply as Record<string, unknown> | undefined
  const feePreviewDict = feeDict?.feePreview as
    | Record<string, string>
    | undefined

  const applyingForClass = session.formData.academic?.applyingForClass

  useEffect(() => {
    if (!applyingForClass) {
      setLoading(false)
      return
    }
    setLoading(true)
    getApplicationFeePreview(applyingForClass)
      .then((res) => {
        if (res.success && res.data) setPreview(res.data)
      })
      .finally(() => setLoading(false))
  }, [applyingForClass])

  const onNext = useCallback(async () => {
    setIsSubmitting(true)
    setError(null)
    try {
      const currentSession = sessionRef.current

      // Validate all prior steps
      const stepStatus = getStepValidationStatus(currentSession.formData)
      const stepErrorMap: Record<string, string> = {
        personal: errorDict.incompletePersonal || errorDict.completeAllSteps,
        contact: errorDict.incompleteContact || errorDict.completeAllSteps,
        location: errorDict.incompleteLocation || errorDict.completeAllSteps,
        guardian: errorDict.incompleteGuardian || errorDict.completeAllSteps,
        academic: errorDict.incompleteAcademic || errorDict.completeAllSteps,
      }
      for (const [step, isValid] of Object.entries(stepStatus)) {
        if (!isValid) throw new Error(stepErrorMap[step])
      }

      let tokenToUse = currentSession.sessionToken
      if (!tokenToUse) {
        tokenToUse = await saveSession()
        if (!tokenToUse) throw new Error(errorDict.failedToSaveSession)
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

      try {
        localStorage.removeItem(
          `hogwarts_apply_session_${sessionRef.current.campaignId}`
        )
      } catch {
        // localStorage may not be available
      }

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
    if (!isSubmitting) {
      enableNext()
      setCustomNavigation({ onNext })
    } else {
      disableNext()
      setCustomNavigation(undefined)
    }
  }, [isSubmitting, enableNext, disableNext, setCustomNavigation, onNext])

  const applicantEmail = session.formData.contact?.email

  return (
    <>
      <FormLayout>
        <FormHeading
          title={stepDict.title || FEES_STEP_CONFIG.label(isRTL)}
          description={
            stepDict.description || FEES_STEP_CONFIG.description(isRTL)
          }
        />
        <div className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {loading ? (
            <div className="space-y-3">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          ) : preview ? (
            <FeePreviewCard
              preview={preview}
              dictionary={feePreviewDict}
              locale={locale}
            />
          ) : (
            <Alert>
              <AlertDescription>
                {feePreviewDict?.noFeesDescription ||
                  "Unable to load fee information. You can still submit your application."}
              </AlertDescription>
            </Alert>
          )}
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
