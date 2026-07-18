"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useParams, useRouter } from "next/navigation"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { FormHeading, FormLayout } from "@/components/form"
import { useLocale } from "@/components/internationalization/use-locale"

import { useApplySession } from "../application-context"
import type { AcademicStepData } from "../types"
import { getApplyErrorDict, getApplyStepDict } from "../utils"
import { useApplyValidation } from "../validation-context"
import { ACADEMIC_STEP_CONFIG } from "./config"
import { AcademicForm } from "./form"
import type { AcademicFormRef } from "./types"

interface Props {
  dictionary?: Record<string, unknown>
}

export default function AcademicContent({ dictionary }: Props) {
  const params = useParams()
  const router = useRouter()
  const { locale, isRTL } = useLocale()
  const id = params.id as string

  const { enableNext, disableNext, setCustomNavigation } = useApplyValidation()
  const { session, getStepData } = useApplySession()
  const academicFormRef = useRef<AcademicFormRef>(null)
  const [saveError, setSaveError] = useState<string | null>(null)

  const initialData = getStepData("academic")
  const stepDict = getApplyStepDict(dictionary, "academic")
  // Memoized: onNext depends on it — an unstable reference would re-run the
  // enable/disable effect (and re-set navigation) every render.
  const errorDict = useMemo(() => getApplyErrorDict(dictionary), [dictionary])

  const onNext = useCallback(async () => {
    if (!academicFormRef.current) return
    try {
      setSaveError(null)
      await academicFormRef.current.saveAndNext()
      router.push(`/${locale}/application/${id}/fees`)
    } catch (error) {
      // Never swallow — surface why Next didn't advance.
      const code = error instanceof Error ? error.message : ""
      setSaveError(
        code === "VALIDATION_FAILED"
          ? errorDict.stepSaveFailed || errorDict.completeAllSteps
          : errorDict.failedToSaveSession
      )
    }
  }, [locale, id, router, errorDict])

  useEffect(() => {
    const academicData = session.formData.academic
    const isValid = !!academicData?.applyingForClass

    if (isValid) {
      enableNext()
      setCustomNavigation({ onNext })
    } else {
      disableNext()
      setCustomNavigation(undefined)
    }
  }, [
    session.formData.academic,
    enableNext,
    disableNext,
    setCustomNavigation,
    onNext,
  ])

  return (
    <FormLayout>
      <FormHeading
        title={stepDict.title || ACADEMIC_STEP_CONFIG.label(isRTL)}
        description={
          stepDict.description || ACADEMIC_STEP_CONFIG.description(isRTL)
        }
      />
      <div className="space-y-6">
        {saveError && (
          <Alert variant="destructive">
            <AlertDescription>{saveError}</AlertDescription>
          </Alert>
        )}
        <AcademicForm
          ref={academicFormRef}
          initialData={initialData as AcademicStepData}
          dictionary={dictionary}
        />
      </div>
    </FormLayout>
  )
}
