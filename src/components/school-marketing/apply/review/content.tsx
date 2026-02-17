"use client"

import React, { useCallback, useEffect, useRef, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { CheckCircle, Loader2 } from "lucide-react"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { useLocale } from "@/components/internationalization/use-locale"

import { useApplySession } from "../application-context"
import { useApplyValidation } from "../validation-context"
import { REVIEW_STEP_CONFIG } from "./config"
import { ReviewForm } from "./form"
import type { ReviewFormRef } from "./types"

interface Props {
  dictionary?: Record<string, unknown>
}

export default function ReviewContent({ dictionary }: Props) {
  const params = useParams()
  const router = useRouter()
  const { locale } = useLocale()
  const isRTL = locale === "ar"
  const subdomain = params.subdomain as string

  const { enableNext, disableNext, setCustomNavigation } = useApplyValidation()
  const { session } = useApplySession()
  const reviewFormRef = useRef<ReviewFormRef>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const dict = ((dictionary as Record<string, Record<string, string>> | null)
    ?.apply?.review ?? {}) as Record<string, string>

  const onNext = useCallback(async () => {
    if (!reviewFormRef.current) return

    setIsSubmitting(true)
    setError(null)

    try {
      await reviewFormRef.current.submitApplication()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit")
      setIsSubmitting(false)
    }
  }, [])

  const id = params.id as string

  const handleSuccess = useCallback(
    (applicationNumber: string) => {
      // Navigate to success page with application number
      router.push(`/${locale}/apply/${id}/success?number=${applicationNumber}`)
    },
    [locale, subdomain, id, router]
  )

  useEffect(() => {
    // Check if all required steps are filled
    const { personal, contact, guardian, academic } = session.formData

    const isComplete =
      personal?.firstName &&
      personal?.lastName &&
      contact?.email &&
      contact?.phone &&
      guardian?.fatherName &&
      guardian?.motherName &&
      academic?.applyingForClass

    if (isComplete && !isSubmitting) {
      enableNext()
      setCustomNavigation({ onNext })
    } else {
      disableNext()
      setCustomNavigation(undefined)
    }
  }, [
    session.formData,
    isSubmitting,
    enableNext,
    disableNext,
    setCustomNavigation,
    onNext,
  ])

  return (
    <div className="space-y-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 flex items-start gap-4">
          <div className="bg-primary/10 flex h-12 w-12 shrink-0 items-center justify-center rounded-full">
            {isSubmitting ? (
              <Loader2 className="text-primary h-6 w-6 animate-spin" />
            ) : (
              <CheckCircle className="text-primary h-6 w-6" />
            )}
          </div>
          <div>
            <h1 className="text-2xl font-bold">
              {dict.title || REVIEW_STEP_CONFIG.label}
            </h1>
            <p className="text-muted-foreground mt-1">
              {dict.description || REVIEW_STEP_CONFIG.description}
            </p>
          </div>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <ReviewForm
          ref={reviewFormRef}
          dictionary={dictionary}
          onSuccess={handleSuccess}
        />

        {/* Submit Notice */}
        <div className="bg-muted mt-8 rounded-lg p-4">
          <p className="text-muted-foreground text-sm">
            {dict.submitNotice ||
              (isRTL
                ? 'بالنقر على "تقديم الطلب"، أقر بأن جميع المعلومات المقدمة صحيحة ودقيقة.'
                : 'By clicking "Submit Application", I confirm that all information provided is true and accurate.')}
          </p>
        </div>
      </div>
    </div>
  )
}
