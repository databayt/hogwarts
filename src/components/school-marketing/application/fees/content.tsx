"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useParams } from "next/navigation"
import { Info } from "lucide-react"
import { useSession } from "next-auth/react"

import type { FeePreview } from "@/lib/fee-preview"
import { formatCurrency } from "@/lib/payment/currency"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { FormHeading, FormLayout } from "@/components/form"
import { useLocale } from "@/components/internationalization/use-locale"

import { getGradeOptions } from "../academic/config"
import { useApplySession } from "../application-context"
import { submitApplicationAction } from "../submit-action"
import type { SubmitActionResult } from "../submit-action"
import ApplicationSuccessModal from "../success-modal"
import {
  getApplyErrorDict,
  getApplyOptionsDict,
  getApplyStepDict,
} from "../utils"
import { useApplyValidation } from "../validation-context"
import { getStepValidationStatus } from "../validation-helpers"
import { getApplicationFeePreview } from "./actions"
import { FEES_STEP_CONFIG } from "./config"

interface Props {
  dictionary?: Record<string, unknown>
}

function resolveGradeLabel(
  applyingForClass: string | undefined,
  optionsDict: Record<string, string>,
  fallback: string
): string {
  if (!applyingForClass) return fallback
  const options = getGradeOptions(optionsDict)
  const match = options.find((o) => o.value === applyingForClass)
  return match?.label ?? applyingForClass
}

function formatInstallmentList(counts: number[], locale: string): string {
  if (counts.length === 0) return ""
  if (counts.length === 1) return String(counts[0])
  const last = counts[counts.length - 1]
  const rest = counts.slice(0, -1).join("، ")
  const conj = locale === "ar" ? " أو " : " or "
  return `${rest}${conj}${last}`
}

export default function FeesContent({ dictionary }: Props) {
  const params = useParams()
  const { locale, isRTL } = useLocale()
  const { data: authSession } = useSession()
  const subdomain = params.subdomain as string
  const id = params.id as string

  const { enableNext, disableNext, setCustomNavigation } = useApplyValidation()
  const { session, saveSession, clearLocalDraft } = useApplySession()
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
  const optionsDict = getApplyOptionsDict(dictionary)
  const feeDict = (
    (dictionary?.school as Record<string, unknown> | undefined)?.admission as
      | Record<string, unknown>
      | undefined
  )?.apply as Record<string, unknown> | undefined
  const feePreviewDict =
    (feeDict?.feePreview as Record<string, string> | undefined) ?? {}

  const applyingForClass = session.formData.academic?.applyingForClass
  const gradeLabel = resolveGradeLabel(
    applyingForClass,
    optionsDict.grade || {},
    isRTL ? "الصف" : "grade"
  )

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
        formData,
        locale
      )
      if (!result.success || !result.data) {
        const msg =
          result.error === "RATE_LIMITED"
            ? errorDict.rateLimited || errorDict.failedToSubmit
            : result.error || errorDict.failedToSubmit
        throw new Error(msg)
      }

      clearLocalDraft()

      // Application submission is always free — show the success modal directly.
      // The payment leg (requiresPayment / application fees) has been retired
      // from the wizard per the 2026-06-12 product decision.
      setSubmitResult(result.data)
      setShowSuccessModal(true)
      setIsSubmitting(false)
    } catch (err) {
      setError(
        err instanceof Error ? err.message : errorDict.failedToSubmit || ""
      )
      setIsSubmitting(false)
    }
  }, [subdomain, id, errorDict, locale, saveSession, clearLocalDraft])

  useEffect(() => {
    if (!isSubmitting) {
      enableNext()
      setCustomNavigation({ onNext })
    } else {
      disableNext()
      setCustomNavigation(undefined)
    }
  }, [isSubmitting, enableNext, disableNext, setCustomNavigation, onNext])

  const applicantEmail =
    authSession?.user?.email ?? session.formData.contact?.email

  const { tuitionLine, installmentLine, amountLabel } = useMemo(() => {
    if (!preview || !preview.matched) {
      return { tuitionLine: null, installmentLine: null, amountLabel: null }
    }

    const amountFormatted = formatCurrency(
      preview.netAmount,
      preview.currency,
      locale === "ar" ? "ar-SD" : "en-US"
    )

    const tuitionTemplate =
      feePreviewDict.tuitionFor ||
      (isRTL ? "رسوم {{grade}}" : "Tuition for {{grade}}")
    const tuition = tuitionTemplate.replace("{{grade}}", gradeLabel)

    const uniqueInstallments = Array.from(
      new Set(
        preview.structures
          .map((s) => s.installments)
          .filter((n): n is number => typeof n === "number" && n > 1)
      )
    ).sort((a, b) => a - b)

    const installmentTemplate =
      feePreviewDict.installmentOptions ||
      (isRTL
        ? "يمكن تقسيطها على {{options}} دفعات"
        : "Payable in {{options}} installments")

    const installment =
      uniqueInstallments.length > 0
        ? installmentTemplate.replace(
            "{{options}}",
            formatInstallmentList(uniqueInstallments, locale)
          )
        : null

    return {
      tuitionLine: tuition,
      installmentLine: installment,
      amountLabel: amountFormatted,
    }
  }, [preview, gradeLabel, feePreviewDict, isRTL, locale])

  return (
    <>
      <FormLayout>
        <FormHeading
          title={stepDict.title || FEES_STEP_CONFIG.label(isRTL)}
          description={
            stepDict.description || FEES_STEP_CONFIG.description(isRTL)
          }
        />
        <div className="space-y-8">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {loading ? (
            <div className="space-y-3">
              <Skeleton className="h-10 w-2/3" />
              <Skeleton className="h-14 w-1/2" />
              <Skeleton className="h-8 w-full" />
            </div>
          ) : preview && preview.matched ? (
            <div className="space-y-8">
              {/* Free-application notice */}
              <Alert>
                <Info className="h-4 w-4" aria-hidden="true" />
                <AlertDescription>
                  {feePreviewDict.freeApplicationNote ||
                    (isRTL
                      ? "التقديم مجاني تماماً. الرسوم أدناه تُطبَّق فقط بعد قبول الطالب ومرحلة التسجيل."
                      : "Applying is completely free. The fees below apply only after acceptance and during the registration stage.")}
                </AlertDescription>
              </Alert>

              {/* Fee preview */}
              <div className="space-y-1">
                <p className="text-muted-foreground text-sm">{tuitionLine}</p>
                <p className="text-4xl font-semibold tracking-tight tabular-nums sm:text-5xl">
                  {amountLabel}
                </p>
                {installmentLine && (
                  <p className="text-muted-foreground text-sm">
                    {installmentLine}
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Free-application notice always shown */}
              <Alert>
                <Info className="h-4 w-4" aria-hidden="true" />
                <AlertDescription>
                  {feePreviewDict.freeApplicationNote ||
                    (isRTL
                      ? "التقديم مجاني تماماً. الرسوم أدناه تُطبَّق فقط بعد قبول الطالب ومرحلة التسجيل."
                      : "Applying is completely free. The fees below apply only after acceptance and during the registration stage.")}
                </AlertDescription>
              </Alert>
              <Alert>
                <AlertDescription>
                  {feePreviewDict.noFeesDescription ||
                    (isRTL
                      ? "تعذّر تحميل معلومات الرسوم. يمكنك إتمام التقديم وسيُبلَّغك بالرسوم لاحقاً."
                      : "Unable to load fee information. You can still submit your application and fees will be communicated later.")}
                </AlertDescription>
              </Alert>
            </div>
          )}
        </div>
      </FormLayout>
      {submitResult && (
        <ApplicationSuccessModal
          applicationNumber={submitResult.applicationNumber}
          applicantEmail={applicantEmail}
          trackingCode={submitResult.accessToken}
          schoolUrl={`${subdomain}.databayt.org`}
          showModal={showSuccessModal}
          setShowModal={setShowSuccessModal}
          isRTL={isRTL}
          locale={locale}
          dictionary={dictionary}
        />
      )}
    </>
  )
}
