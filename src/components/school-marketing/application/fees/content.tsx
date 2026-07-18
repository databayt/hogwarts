"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useParams } from "next/navigation"
import { BadgePercent } from "lucide-react"
import { useSession } from "next-auth/react"

import type { FeePreview } from "@/lib/fee-preview"
import { formatCurrency } from "@/lib/payment/currency"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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
  const [showDiscountsDialog, setShowDiscountsDialog] = useState(false)
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
        // Server actions return error CODES, never prose — every code is
        // resolved through the dictionary so Arabic users never see English.
        // Unknown codes fall back to the generic translated message rather
        // than leaking a raw server string to the UI.
        const errorCodeMap: Record<string, string | undefined> = {
          RATE_LIMITED: errorDict.rateLimited,
          DOCUMENTS_REQUIRED: errorDict.documentsRequired,
          APPLICATION_ALREADY_SUBMITTED: errorDict.applicationAlreadySubmitted,
          APPLICATION_DUPLICATE: errorDict.applicationDuplicate,
          APPLICATION_EMAIL_DUPLICATE: errorDict.applicationEmailDuplicate,
          SUBMIT_FAILED: errorDict.failedToSubmit,
          NOT_AUTHENTICATED: errorDict.notAuthenticated,
        }
        const code = result.error ?? ""
        const missingField = code.startsWith("MISSING_FIELD:")
          ? code.slice("MISSING_FIELD:".length)
          : null
        const msg = missingField
          ? (errorDict.missingField || errorDict.failedToSubmit)?.replace(
              "{{field}}",
              missingField
            )
          : errorCodeMap[code] || errorDict.failedToSubmit
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
      feePreviewDict.tuitionForYear ||
      (isRTL
        ? "رسوم {{grade}} للعام الدراسي {{year}}"
        : "{{grade}} tuition for the {{year}} academic year")
    const tuition = tuitionTemplate
      .replace("{{grade}}", gradeLabel)
      .replace("{{year}}", preview.academicYear)

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
              <button
                type="button"
                onClick={() => setShowDiscountsDialog(true)}
                className="text-muted-foreground hover:text-foreground mt-3 inline-flex items-center gap-1.5 text-sm underline decoration-dotted underline-offset-4 transition-colors"
              >
                <BadgePercent className="h-4 w-4" aria-hidden="true" />
                {feePreviewDict.discountsNote ||
                  (isRTL
                    ? "قد تنطبق خصومات ومنح دراسية"
                    : "Discounts and scholarships may apply")}
              </button>
            </div>
          ) : (
            <Alert>
              <AlertDescription>
                {feePreviewDict.noFeesDescription ||
                  (isRTL
                    ? "تعذّر تحميل معلومات الرسوم. يمكنك إتمام التقديم وسيُبلَّغك بالرسوم لاحقاً."
                    : "Unable to load fee information. You can still submit your application and fees will be communicated later.")}
              </AlertDescription>
            </Alert>
          )}
        </div>
      </FormLayout>
      <Dialog open={showDiscountsDialog} onOpenChange={setShowDiscountsDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {feePreviewDict.discountsDialogTitle ||
                (isRTL
                  ? "الخصومات والمنح الدراسية"
                  : "Discounts & Scholarships")}
            </DialogTitle>
            <DialogDescription>
              {feePreviewDict.discountsDialogDescription ||
                (isRTL
                  ? "المبلغ المعروض تقديري. تُطبَّق خصومات الأشقاء والدفع المبكر والمنح الدراسية تلقائياً عند الاستحقاق، ويُؤكَّد المبلغ النهائي عند التسجيل."
                  : "The amount shown is an estimate. Sibling, early-payment, and scholarship discounts are applied when eligible, and the final amount is confirmed at registration.")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {preview?.earlyPaymentHint && (
              <p className="text-sm">
                {(
                  feePreviewDict.earlyPaymentHint ||
                  (isRTL
                    ? "ادفع قبل {{date}} لتوفير {{savings}}."
                    : "Pay before {{date}} to save {{savings}}.")
                )
                  .replace(
                    "{{date}}",
                    new Date(
                      preview.earlyPaymentHint.deadline
                    ).toLocaleDateString(locale === "ar" ? "ar-SD" : "en-US")
                  )
                  .replace(
                    "{{savings}}",
                    formatCurrency(
                      preview.earlyPaymentHint.savings,
                      preview.currency,
                      locale === "ar" ? "ar-SD" : "en-US"
                    )
                  )}
              </p>
            )}
            {preview && preview.scholarships.length > 0 ? (
              <div className="space-y-2">
                <h4 className="text-sm font-medium">
                  {feePreviewDict.scholarshipsHeading ||
                    (isRTL
                      ? "المنح الدراسية المتاحة"
                      : "Available scholarships")}
                </h4>
                <ul className="space-y-1.5">
                  {preview.scholarships.map((s) => (
                    <li
                      key={s.id}
                      className="text-muted-foreground flex items-baseline justify-between gap-4 text-sm"
                    >
                      <span>{s.name}</span>
                      <span className="shrink-0 tabular-nums">
                        {s.coverageType === "FULL"
                          ? feePreviewDict.scholarshipCoverageFull ||
                            (isRTL ? "تغطية كاملة" : "Full coverage")
                          : s.coverageType === "PERCENTAGE"
                            ? (
                                feePreviewDict.scholarshipCoveragePercentage ||
                                (isRTL ? "خصم {{value}}٪" : "{{value}}% off")
                              ).replace("{{value}}", String(s.coverageAmount))
                            : (
                                feePreviewDict.scholarshipCoverageFixed ||
                                (isRTL ? "خصم {{value}}" : "{{value}} off")
                              ).replace(
                                "{{value}}",
                                formatCurrency(
                                  s.coverageAmount,
                                  preview.currency,
                                  locale === "ar" ? "ar-SD" : "en-US"
                                )
                              )}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">
                {feePreviewDict.noScholarshipsNote ||
                  (isRTL
                    ? "لا توجد منح معلنة لهذا العام — تواصل مع إدارة المدرسة للاستفسار عن الدعم المتاح."
                    : "No scholarships are listed for this year — contact the school to ask about available support.")}
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
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
