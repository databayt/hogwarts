"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import React, { useCallback, useEffect, useRef } from "react"
import { useParams, useRouter } from "next/navigation"

import { FormHeading, FormLayout } from "@/components/form"
import { useLocale } from "@/components/internationalization/use-locale"

import { useApplySession } from "../application-context"
import { useApplyValidation } from "../validation-context"
import { ATTACHMENTS_STEP_CONFIG } from "./config"
import { AttachmentsForm } from "./form"
import type { AttachmentsFormRef } from "./types"

interface Props {
  dictionary?: Record<string, unknown>
}

export default function AttachmentsContent({ dictionary }: Props) {
  const params = useParams()
  const router = useRouter()
  const { locale } = useLocale()
  const isRTL = locale === "ar"
  const id = params.id as string

  const { enableNext, setCustomNavigation } = useApplyValidation()
  const { getStepData } = useApplySession()
  const attachmentsFormRef = useRef<AttachmentsFormRef>(null)

  const initialData = getStepData("attachments")

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

  // Attachments step is optional, always enable next
  useEffect(() => {
    enableNext()
    setCustomNavigation({ onNext })
  }, [enableNext, setCustomNavigation, onNext])

  return (
    <FormLayout>
      <FormHeading
        title={ATTACHMENTS_STEP_CONFIG.label(isRTL)}
        description={ATTACHMENTS_STEP_CONFIG.description(isRTL)}
      />
      <AttachmentsForm
        ref={attachmentsFormRef}
        initialData={initialData as Record<string, string>}
        dictionary={dictionary}
      />
    </FormLayout>
  )
}
