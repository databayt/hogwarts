"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import React, { useEffect, useRef, useState } from "react"
import { useParams, useRouter } from "next/navigation"

import { FormHeading, FormLayout } from "@/components/form"
import { useWizardValidation } from "@/components/form/template/wizard-validation-context"
import type { WizardFormRef } from "@/components/form/wizard"
import { WizardStep } from "@/components/form/wizard"
import { useDictionary } from "@/components/internationalization/use-dictionary"

import { completeTeacherWizard } from "../actions"
import { useTeacherWizard } from "../use-teacher-wizard"
import { EmploymentForm } from "./form"

export default function EmploymentContent() {
  const params = useParams()
  const router = useRouter()
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

  // Set up completion navigation: save form + complete wizard + redirect
  useEffect(() => {
    const handleNext = async () => {
      if (isSavingRef.current) return
      isSavingRef.current = true
      try {
        await formRef.current?.saveAndNext()
        const result = await completeTeacherWizard(teacherId)
        if (result.success) {
          router.push("/teachers")
        }
      } catch {
        // Error handled in form
      } finally {
        isSavingRef.current = false
      }
    }

    setCustomNavigation({ onNext: handleNext })
    return () => setCustomNavigation(undefined)
  }, [teacherId, router, setCustomNavigation])

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
