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

  // A fresh draft is stored against a placeholder student (the column is
  // required). Until the selection is saved — which always sets the
  // subject — show no student, so nobody grades the placeholder by
  // clicking Next.
  const studentId =
    data && !(data.wizardStep === "selection" && !data.subjectId)
      ? data.studentId
      : ""

  // Set initial validity from loaded data
  useEffect(() => {
    if (data) {
      setIsValid(
        studentId.trim().length >= 1 && (data.subjectId ?? "").length >= 1
      )
    }
  }, [data, studentId])

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
            "Select the student, the subject, and optionally an exam or assignment."
          }
        />
        <SelectionForm
          ref={formRef}
          resultId={resultId}
          initialData={
            data
              ? {
                  studentId,
                  subjectId: data.subjectId ?? "",
                  assignmentId: data.assignmentId ?? undefined,
                  examId: data.examId ?? undefined,
                }
              : undefined
          }
          onValidChange={setIsValid}
        />
      </FormLayout>
    </WizardStep>
  )
}
