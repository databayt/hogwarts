"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import React, { useCallback, useEffect, useRef } from "react"
import { useParams, useRouter } from "next/navigation"

import { FormHeading, FormLayout } from "@/components/form"
import { useLocale } from "@/components/internationalization/use-locale"

import { useApplySession } from "../application-context"
import type { GuardianStepData } from "../types"
import { getApplyStepDict } from "../utils"
import { useApplyValidation } from "../validation-context"
import { GuardianForm } from "./form"
import type { GuardianFormRef } from "./types"

interface Props {
  dictionary?: Record<string, unknown>
}

export default function GuardianContent({ dictionary }: Props) {
  const params = useParams()
  const router = useRouter()
  const { locale } = useLocale()
  const id = params.id as string

  const { enableNext, disableNext, setCustomNavigation } = useApplyValidation()
  const { session, getStepData } = useApplySession()
  const guardianFormRef = useRef<GuardianFormRef>(null)

  const initialData = getStepData("guardian")
  const stepDict = getApplyStepDict(dictionary, "guardian")

  const onNext = useCallback(async () => {
    if (guardianFormRef.current) {
      try {
        await guardianFormRef.current.saveAndNext()
        router.push(`/${locale}/application/${id}/academic`)
      } catch (error) {
        console.error("Error saving guardian step:", error)
      }
    }
  }, [locale, id, router])

  useEffect(() => {
    const guardianData = session.formData.guardian

    const isValid = !!(guardianData?.fatherName || guardianData?.motherName)

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

  return (
    <FormLayout>
      <FormHeading
        title={stepDict.title || "Guardian Information"}
        description={stepDict.description || "Enter parent or guardian details"}
      />
      <GuardianForm
        ref={guardianFormRef}
        initialData={initialData as GuardianStepData}
        dictionary={dictionary}
      />
    </FormLayout>
  )
}
