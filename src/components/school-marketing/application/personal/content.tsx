"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import React, { useCallback, useEffect, useRef, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, ArrowRight } from "lucide-react"

import { Button } from "@/components/ui/button"
import { FormHeading, FormLayout } from "@/components/form"
import { useLocale } from "@/components/internationalization/use-locale"

import { useApplySession } from "../application-context"
import { GuardianForm } from "../guardian/form"
import type { GuardianFormRef } from "../guardian/types"
import type { GuardianStepData, PersonalStepData } from "../types"
import { getApplyDict, getApplyStepDict } from "../utils"
import { useApplyValidation } from "../validation-context"
import { PERSONAL_STEP_CONFIG } from "./config"
import { PersonalForm } from "./form"
import type { PersonalFormRef } from "./types"

type ActiveTab = "student" | "father" | "mother"

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
  const guardianFormRef = useRef<GuardianFormRef>(null)
  const [activeTab, setActiveTab] = useState<ActiveTab>("student")

  const initialData = getStepData("personal")
  const guardianInitialData = getStepData("guardian")
  const stepDict = getApplyStepDict(dictionary, "personal")
  const guardianDict = getApplyDict(dictionary, "guardian")

  const onNext = useCallback(async () => {
    try {
      if (personalFormRef.current) {
        await personalFormRef.current.saveAndNext()
      }
      if (guardianFormRef.current) {
        await guardianFormRef.current.saveAndNext()
      }
      router.push(`/${locale}/application/${id}/location`)
    } catch (error) {
      console.error("Error saving personal step:", error)
    }
  }, [locale, id, router])

  const { nameFormat } = useApplySession()

  useEffect(() => {
    const personalData = session.formData.personal
    const guardianData = session.formData.guardian

    const hasName =
      nameFormat === "full"
        ? personalData?.firstName || personalData?.lastName
        : personalData?.firstName && personalData?.lastName

    const isPersonalValid = hasName && personalData?.phone

    const isGuardianValid = !!(
      guardianData?.fatherName || guardianData?.motherName
    )

    if (isPersonalValid && isGuardianValid) {
      enableNext()
      setCustomNavigation({ onNext })
    } else {
      disableNext()
      setCustomNavigation(undefined)
    }
  }, [
    session.formData.personal,
    session.formData.guardian,
    nameFormat,
    enableNext,
    disableNext,
    setCustomNavigation,
    onNext,
  ])

  const sections: { key: ActiveTab; label: string }[] = [
    {
      key: "student",
      label: isRTL ? "الطالب" : "Student",
    },
    {
      key: "father",
      label: isRTL ? "الأب" : "Father",
    },
    {
      key: "mother",
      label: isRTL ? "الأم" : "Mother",
    },
  ]

  const currentIndex = sections.findIndex((s) => s.key === activeTab)
  const previous = currentIndex > 0 ? sections[currentIndex - 1] : null
  const next =
    currentIndex < sections.length - 1 ? sections[currentIndex + 1] : null

  return (
    <FormLayout>
      <FormHeading
        title={stepDict.title || PERSONAL_STEP_CONFIG.label(isRTL)}
        description={
          stepDict.description || PERSONAL_STEP_CONFIG.description(isRTL)
        }
      />

      <div className="space-y-6">
        <div className={activeTab === "student" ? "" : "hidden"}>
          <PersonalForm
            ref={personalFormRef}
            initialData={initialData as PersonalStepData}
            dictionary={dictionary}
          />
        </div>

        <div className={activeTab !== "student" ? "" : "hidden"}>
          <GuardianForm
            ref={guardianFormRef}
            initialData={guardianInitialData as GuardianStepData}
            dictionary={dictionary}
            controlledParent={activeTab === "mother" ? "mother" : "father"}
          />
        </div>

        <div className="flex items-center gap-2">
          {previous && (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="shadow-none"
              onClick={() => setActiveTab(previous.key)}
            >
              <ArrowLeft className="rtl:rotate-180" /> {previous.label}
            </Button>
          )}
          {next && (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="ms-auto shadow-none"
              onClick={() => setActiveTab(next.key)}
            >
              {next.label} <ArrowRight className="rtl:rotate-180" />
            </Button>
          )}
        </div>
      </div>
    </FormLayout>
  )
}
