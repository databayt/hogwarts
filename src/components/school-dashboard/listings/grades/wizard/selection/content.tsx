"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import React, { useEffect, useRef, useState } from "react"
import { useParams } from "next/navigation"

import { FormHeading, FormLayout } from "@/components/form"
import type { WizardFormRef } from "@/components/form/wizard"
import { WizardStep } from "@/components/form/wizard"
import { useDictionary } from "@/components/internationalization/use-dictionary"

import { useGradeWizard } from "../use-grade-wizard"
import { SelectionForm } from "./form"

export default function SelectionContent() {
  const params = useParams()
  const resultId = params.id as string
  const formRef = useRef<WizardFormRef>(null)
  const { data, isLoading } = useGradeWizard()
  const [isValid, setIsValid] = useState(false)
  const { dictionary: dict } = useDictionary()
  const d = dict?.school?.grades as Record<string, any> | undefined

  // Set initial validity from loaded data
  useEffect(() => {
    if (data) {
      setIsValid(
        data.studentId.trim().length >= 1 && data.classId.trim().length >= 1
      )
    }
  }, [data])

  return (
    <WizardStep
      entityId={resultId}
      nextStep={`/grades/add/${resultId}/scoring`}
      isValid={isValid}
      formRef={formRef}
      isLoading={isLoading}
    >
      <FormLayout>
        <FormHeading
          title={d?.wizardSelectionTitle || "Student & Assignment"}
          description={
            d?.wizardSelectionDescription ||
            "Select the student, class, and optionally an assignment or exam."
          }
        />
        <SelectionForm
          ref={formRef}
          resultId={resultId}
          initialData={
            data
              ? {
                  studentId: data.studentId,
                  classId: data.classId,
                  assignmentId: data.assignmentId ?? undefined,
                  examId: data.examId ?? undefined,
                  subjectId: data.subjectId ?? undefined,
                }
              : undefined
          }
          onValidChange={setIsValid}
        />
      </FormLayout>
    </WizardStep>
  )
}
