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

import { completeStudentWizard } from "../actions"
import { useStudentWizard } from "../use-student-wizard"
import { PreviousEducationForm } from "./form"

export default function PreviousEducationContent() {
  const params = useParams()
  const router = useRouter()
  const studentId = params.id as string
  const formRef = useRef<WizardFormRef>(null)
  const { data, isLoading } = useStudentWizard()
  const [isValid, setIsValid] = useState(true)
  const { setCustomNavigation } = useWizardValidation()
  const isSavingRef = useRef(false)

  const { dictionary } = useDictionary()
  const students = (dictionary?.school as any)?.students
  const t = students?.previousEducation as Record<string, string> | undefined

  // Set up completion navigation: save form + complete wizard + redirect
  useEffect(() => {
    const handleNext = async () => {
      if (isSavingRef.current) return
      isSavingRef.current = true
      try {
        await formRef.current?.saveAndNext()
        const result = await completeStudentWizard(studentId)
        if (result.success) {
          router.push("/students")
        }
      } catch {
        // Error handled in form
      } finally {
        isSavingRef.current = false
      }
    }

    setCustomNavigation({ onNext: handleNext })
    return () => setCustomNavigation(undefined)
  }, [studentId, router, setCustomNavigation])

  return (
    <WizardStep
      entityId={studentId}
      isValid={isValid}
      formRef={formRef}
      isLoading={isLoading}
      isReviewStep
    >
      <FormLayout>
        <FormHeading
          title={t?.title || "Previous Education"}
          description={
            t?.description ||
            "Enter details about the student's previous school."
          }
        />
        <PreviousEducationForm
          ref={formRef}
          studentId={studentId}
          initialData={
            data
              ? {
                  previousSchoolName: data.previousSchoolName ?? undefined,
                  previousSchoolAddress:
                    data.previousSchoolAddress ?? undefined,
                  previousGrade: data.previousGrade ?? undefined,
                  transferCertificateNo:
                    data.transferCertificateNo ?? undefined,
                  transferDate: data.transferDate ?? undefined,
                  previousAcademicRecord:
                    data.previousAcademicRecord ?? undefined,
                }
              : undefined
          }
          onValidChange={setIsValid}
        />
      </FormLayout>
    </WizardStep>
  )
}
