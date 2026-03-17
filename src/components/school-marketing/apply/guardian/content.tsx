"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import React, { useCallback, useEffect, useRef, useState } from "react"
import { useParams, useRouter } from "next/navigation"

import { FormHeading, FormLayout } from "@/components/form"
import { useLocale } from "@/components/internationalization/use-locale"

import { useApplySession } from "../application-context"
import type { GuardianStepData } from "../types"
import { useApplyValidation } from "../validation-context"
import { GuardianForm } from "./form"
import type { GuardianFormRef } from "./types"

const TAB_HEADINGS = (isRTL: boolean) => ({
  father: {
    title: isRTL ? "معلومات الأب" : "Father's Information",
    description: isRTL
      ? "أدخل معلومات والد الطالب"
      : "Enter the student's father details.",
  },
  mother: {
    title: isRTL ? "معلومات الأم" : "Mother's Information",
    description: isRTL
      ? "أدخل معلومات والدة الطالب"
      : "Enter the student's mother details.",
  },
  guardian: {
    title: isRTL ? "ولي الأمر" : "Other Guardian",
    description: isRTL
      ? "أدخل معلومات ولي الأمر (اختياري)"
      : "Enter other guardian details (optional).",
  },
})

interface Props {
  dictionary?: Record<string, unknown>
}

export default function GuardianContent({ dictionary }: Props) {
  const params = useParams()
  const router = useRouter()
  const { locale } = useLocale()
  const isRTL = locale === "ar"
  const id = params.id as string

  const { enableNext, disableNext, setCustomNavigation } = useApplyValidation()
  const { session, getStepData } = useApplySession()
  const guardianFormRef = useRef<GuardianFormRef>(null)

  const headings = TAB_HEADINGS(isRTL)
  const [heading, setHeading] = useState(headings.father)

  const initialData = getStepData("guardian")

  const handleTabChange = (tabId: string) => {
    setHeading(headings[tabId as keyof typeof headings] || headings.father)
  }

  const onNext = useCallback(async () => {
    if (guardianFormRef.current) {
      try {
        await guardianFormRef.current.saveAndNext()
        router.push(`/${locale}/apply/${id}/academic`)
      } catch (error) {
        console.error("Error saving guardian step:", error)
      }
    }
  }, [locale, id, router])

  useEffect(() => {
    const guardianData = session.formData.guardian

    const isValid = guardianData?.fatherName && guardianData?.motherName

    if (isValid) {
      enableNext()
      setCustomNavigation({ onNext })
    } else {
      disableNext()
      setCustomNavigation(undefined)
    }
  }, [
    session.formData.guardian,
    enableNext,
    disableNext,
    setCustomNavigation,
    onNext,
  ])

  const dict = ((dictionary as Record<string, Record<string, string>> | null)
    ?.apply?.guardian ?? {}) as Record<string, string>

  return (
    <FormLayout>
      <FormHeading
        title={dict.title || heading.title}
        description={dict.description || heading.description}
      />
      <GuardianForm
        ref={guardianFormRef}
        initialData={initialData as GuardianStepData}
        dictionary={dictionary}
        onTabChange={handleTabChange}
      />
    </FormLayout>
  )
}
