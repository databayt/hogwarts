"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import React, { useCallback, useEffect, useRef } from "react"
import { useParams, useRouter } from "next/navigation"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { FormHeading, FormLayout } from "@/components/form"
import { useLocale } from "@/components/internationalization/use-locale"

import { useApplySession } from "../application-context"
import { getApplyStepDict } from "../utils"
import { useApplyValidation } from "../validation-context"
import { ATTACHMENTS_STEP_CONFIG } from "./config"
import { AttachmentsForm } from "./form"
import type { AttachmentsFormRef } from "./types"

// The slots that count as "documents" for the submitApplication gate —
// must stay in sync with the documentSlots list in ../fees/content.tsx
// (profile photo deliberately excluded on both sides).
const DOCUMENT_KEYS = [
  "degreeUrl",
  "transcriptUrl",
  "idUrl",
  "resumeUrl",
  "otherUrl",
] as const

interface Props {
  dictionary?: Record<string, unknown>
  /** School requires ≥1 uploaded document to submit (AdmissionSettings.requireDocuments) */
  requireDocuments?: boolean
}

export default function AttachmentsContent({
  dictionary,
  requireDocuments = false,
}: Props) {
  const params = useParams()
  const router = useRouter()
  const { locale, isRTL } = useLocale()
  const id = params.id as string

  const { enableNext, disableNext, setCustomNavigation } = useApplyValidation()
  const { getStepData, session } = useApplySession()
  const attachmentsFormRef = useRef<AttachmentsFormRef>(null)

  const initialData = getStepData("attachments")
  const stepDict = getApplyStepDict(dictionary, "documents")

  const onNext = useCallback(async () => {
    if (attachmentsFormRef.current) {
      try {
        await attachmentsFormRef.current.saveAndNext()
        router.push(`/${locale}/application/${id}/personal`)
      } catch (error) {
        console.error("Error saving attachments step:", error)
      }
    }
  }, [locale, id, router])

  // Upload results land in session.formData.attachments as the form syncs
  // (string URL or {url} object depending on the upload hook's shape).
  const attachmentsData = session.formData.attachments as
    | Record<string, unknown>
    | undefined
  const hasDocument = DOCUMENT_KEYS.some((key) => {
    const value = attachmentsData?.[key]
    return typeof value === "string"
      ? value.length > 0
      : !!(value as { url?: string } | undefined)?.url
  })
  const documentsMissing = requireDocuments && !hasDocument

  // When the school requires documents, block Next HERE with a visible hint —
  // otherwise the applicant only learns about it at final submit
  // (DOCUMENTS_REQUIRED), four steps later. The submit gate stays as backstop.
  useEffect(() => {
    if (documentsMissing) {
      disableNext()
      setCustomNavigation(undefined)
    } else {
      enableNext()
      setCustomNavigation({ onNext })
    }
  }, [documentsMissing, enableNext, disableNext, setCustomNavigation, onNext])

  return (
    <FormLayout>
      <FormHeading
        title={stepDict.title || ATTACHMENTS_STEP_CONFIG.label(isRTL)}
        description={
          stepDict.description || ATTACHMENTS_STEP_CONFIG.description(isRTL)
        }
      />
      {documentsMissing && (
        <Alert variant="destructive">
          <AlertDescription>
            {stepDict.requiredHint ||
              (isRTL
                ? "هذه المدرسة تشترط رفع مستند واحد على الأقل للمتابعة"
                : "This school requires at least one uploaded document to continue")}
          </AlertDescription>
        </Alert>
      )}
      <AttachmentsForm
        ref={attachmentsFormRef}
        initialData={initialData as Record<string, string>}
        dictionary={dictionary}
      />
    </FormLayout>
  )
}
