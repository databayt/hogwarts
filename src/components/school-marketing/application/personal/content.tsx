"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, ArrowRight } from "lucide-react"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { FormHeading, FormLayout } from "@/components/form"
import { useLocale } from "@/components/internationalization/use-locale"

import { useApplySession } from "../application-context"
import { GuardianForm } from "../guardian/form"
import type { GuardianFormRef } from "../guardian/types"
import { isGuardianStepComplete } from "../guardian/validation"
import type { GuardianStepData, PersonalStepData } from "../types"
import { getApplyDict, getApplyErrorDict, getApplyStepDict } from "../utils"
import { useApplyValidation } from "../validation-context"
import { PERSONAL_STEP_CONFIG } from "./config"
import { PersonalForm } from "./form"
import type { PersonalFormRef } from "./types"
import { isPersonalStepComplete } from "./validation"

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
  const [guardianMissing, setGuardianMissing] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const initialData = getStepData("personal")
  const guardianInitialData = getStepData("guardian")
  const stepDict = getApplyStepDict(dictionary, "personal")
  const guardianDict = getApplyDict(dictionary, "guardian")
  // Memoized: onNext depends on it, and an unstable reference would make the
  // enable/disable effect below re-run (and re-set navigation) every render.
  const errorDict = useMemo(() => getApplyErrorDict(dictionary), [dictionary])

  const onNext = useCallback(async () => {
    try {
      setSaveError(null)
      if (personalFormRef.current) {
        await personalFormRef.current.saveAndNext()
      }
      if (guardianFormRef.current) {
        await guardianFormRef.current.saveAndNext()
      }
      router.push(`/${locale}/application/${id}/location`)
    } catch (error) {
      // Never swallow — an apparently-live Next button that does nothing is
      // the exact funnel trap this step used to have.
      const code = error instanceof Error ? error.message : ""
      setSaveError(
        code === "VALIDATION_FAILED"
          ? errorDict.stepSaveFailed || errorDict.completeAllSteps
          : errorDict.failedToSaveSession
      )
    }
  }, [locale, id, router, errorDict])

  const { nameFormat } = useApplySession()

  useEffect(() => {
    const personalData = session.formData.personal
    const guardianData = session.formData.guardian

    // Mirror the REAL schema constraints (phone length window, ≥2-char parent
    // name) — a looser truthy check here used to enable Next while
    // form.trigger() inside saveAndNext() still failed, silently.
    const isPersonalValid = isPersonalStepComplete(personalData, nameFormat)
    const isGuardianValid = isGuardianStepComplete(guardianData)

    // A guardian name is required to advance, but it lives behind the
    // Father/Mother tabs — surface why Next is blocked instead of leaving the
    // applicant staring at a dead button after filling every starred field.
    setGuardianMissing(!!isPersonalValid && !isGuardianValid)

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
      label: (stepDict.tabStudent as string) || (isRTL ? "الطالب" : "Student"),
    },
    {
      key: "father",
      label: (stepDict.tabFather as string) || (isRTL ? "الأب" : "Father"),
    },
    {
      key: "mother",
      label: (stepDict.tabMother as string) || (isRTL ? "الأم" : "Mother"),
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

        {guardianMissing && (
          <p className="text-muted-foreground" role="status">
            {(guardianDict.nameRequiredHint as string) ||
              (isRTL
                ? "أدخل اسم الأب أو الأم للمتابعة"
                : "Enter the father's or mother's name to continue")}
          </p>
        )}

        {saveError && (
          <Alert variant="destructive">
            <AlertDescription>{saveError}</AlertDescription>
          </Alert>
        )}

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
