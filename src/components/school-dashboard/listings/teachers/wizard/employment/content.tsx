"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import React, { useEffect, useRef, useState } from "react"
import { useParams, useRouter } from "next/navigation"

import { FormHeading, FormLayout } from "@/components/form"
import { useWizardValidation } from "@/components/form/template/wizard-validation-context"
import type { WizardFormRef } from "@/components/form/wizard"
import { useWizardRuntime, WizardStep } from "@/components/form/wizard"
import { useDictionary } from "@/components/internationalization/use-dictionary"
import { useLocale } from "@/components/internationalization/use-locale"

import { finishTeacherWizard } from "../finish"
import { useTeacherWizard } from "../use-teacher-wizard"
import { EmploymentForm } from "./form"

export default function EmploymentContent() {
  const params = useParams()
  const router = useRouter()
  const { locale } = useLocale()
  const teacherId = params.id as string
  const formRef = useRef<WizardFormRef>(null)
  const { data, isLoading } = useTeacherWizard()
  const { dictionary } = useDictionary()
  const teachers = (dictionary?.school as Record<string, unknown>)?.teachers as
    | Record<string, unknown>
    | undefined
  const wizard = teachers?.wizard as Record<string, unknown> | undefined
  const t = wizard?.employment as Record<string, string> | undefined
  const [isValid, setIsValid] = useState(true) // optional step
  const { setCustomNavigation } = useWizardValidation()
  const isSavingRef = useRef(false)
  const runtime = useWizardRuntime()

  // Set up completion navigation: save form + complete wizard + redirect
  useEffect(() => {
    const handleNext = async () => {
      if (isSavingRef.current) return
      const form = formRef.current
      isSavingRef.current = true
      try {
        // Earlier steps saved in the background — all must land first.
        if (runtime && !(await runtime.drain())) return
        await form?.saveAndNext()
        const ok = await finishTeacherWizard(teacherId, dictionary)
        if (ok) router.push(`/${locale}/teachers`)
      } catch {
        // Error handled in form
      } finally {
        isSavingRef.current = false
      }
    }

    setCustomNavigation({ onNext: handleNext })
    return () => setCustomNavigation(undefined)
  }, [teacherId, router, setCustomNavigation, dictionary, locale, runtime])

  return (
    <WizardStep
      entityId={teacherId}
      isValid={isValid}
      formRef={formRef}
      isLoading={isLoading}
      isReviewStep
    >
      <FormLayout>
        <FormHeading
          title={t?.title || "Employment Details"}
          description={
            t?.description ||
            "Add employment information. This step is optional."
          }
        />
        <EmploymentForm
          ref={formRef}
          teacherId={teacherId}
          initialData={
            data
              ? {
                  employeeId: data.employeeId ?? undefined,
                  joiningDate: data.joiningDate ?? undefined,
                  employmentStatus: data.employmentStatus as
                    | "ACTIVE"
                    | "ON_LEAVE"
                    | "TERMINATED"
                    | "RETIRED",
                  employmentType: data.employmentType as
                    | "FULL_TIME"
                    | "PART_TIME"
                    | "CONTRACT"
                    | "SUBSTITUTE",
                  contractStartDate: data.contractStartDate ?? undefined,
                  contractEndDate: data.contractEndDate ?? undefined,
                }
              : undefined
          }
          onValidChange={setIsValid}
        />
      </FormLayout>
    </WizardStep>
  )
}
