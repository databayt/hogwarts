"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import React, { useCallback, useEffect, useRef } from "react"
import { useParams, useRouter } from "next/navigation"

import { FormHeading, FormLayout } from "@/components/form"
import { useLocale } from "@/components/internationalization/use-locale"

import { useApplySession } from "../application-context"
import type { PersonalStepData } from "../types"
import { getApplyStepDict } from "../utils"
import { useApplyValidation } from "../validation-context"
import { PERSONAL_STEP_CONFIG } from "./config"
import { PersonalForm } from "./form"
import type { PersonalFormRef } from "./types"

interface Props {
  dictionary?: Record<string, unknown>
}

export default function PersonalContent({ dictionary }: Props) {
  const params = useParams()
  const router = useRouter()
  const { locale, isRTL } = useLocale()
  const id = params.id as string

  const { enableNext, disableNext, setCustomNavigation } = useApplyValidation()
  const { session, getStepData } = useApplySession()
  const personalFormRef = useRef<PersonalFormRef>(null)

  const initialData = getStepData("personal")
  const stepDict = getApplyStepDict(dictionary, "personal")

  const onNext = useCallback(async () => {
    if (personalFormRef.current) {
      try {
        await personalFormRef.current.saveAndNext()
        router.push(`/${locale}/application/${id}/contact`)
      } catch (error) {
        console.error("Error saving personal step:", error)
      }
    }
  }, [locale, id, router])

  const { nameFormat } = useApplySession()

  useEffect(() => {
    const personalData = session.formData.personal

    const hasName =
      nameFormat === "full"
        ? personalData?.firstName || personalData?.lastName
        : personalData?.firstName && personalData?.lastName

    const isValid = hasName && personalData?.dateOfBirth && personalData?.gender

    if (isValid) {
      enableNext()
      setCustomNavigation({ onNext })
    } else {
      disableNext()
      setCustomNavigation(undefined)
    }
  }, [
    session.formData.personal,
    nameFormat,
    enableNext,
    disableNext,
    setCustomNavigation,
    onNext,
  ])

  return (
    <FormLayout>
      <FormHeading
        title={stepDict.title || PERSONAL_STEP_CONFIG.label(isRTL)}
        description={
          stepDict.description || PERSONAL_STEP_CONFIG.description(isRTL)
        }
      />
      <PersonalForm
        ref={personalFormRef}
        initialData={initialData as PersonalStepData}
        dictionary={dictionary}
      />
    </FormLayout>
  )
}
