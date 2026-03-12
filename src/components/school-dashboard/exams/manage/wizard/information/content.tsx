"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import React, { useEffect, useRef, useState } from "react"
import { useParams } from "next/navigation"

import { FormHeading, FormLayout } from "@/components/form"
import type { WizardFormRef } from "@/components/form/wizard"
import { WizardStep } from "@/components/form/wizard"

import { useExamWizard } from "../use-exam-wizard"
import { InformationForm } from "./form"

export default function InformationContent() {
  const params = useParams()
  const examId = params.id as string
  const formRef = useRef<WizardFormRef>(null)
  const { data, isLoading } = useExamWizard()
  const [isValid, setIsValid] = useState(false)

  // Set initial validity from loaded data
  useEffect(() => {
    if (data) {
      setIsValid(
        data.title.trim().length >= 1 &&
          data.classId.length >= 1 &&
          data.subjectId.length >= 1 &&
          !!data.examType
      )
    }
  }, [data])

  return (
    <WizardStep
      entityId={examId}
      nextStep={`/exams/manage/add/${examId}/schedule`}
      isValid={isValid}
      formRef={formRef}
      isLoading={isLoading}
    >
      <FormLayout>
        <FormHeading
          title="Exam Details"
          description="Enter the basic exam information."
        />
        <InformationForm
          ref={formRef}
          examId={examId}
          initialData={
            data
              ? {
                  title: data.title,
                  description: data.description ?? undefined,
                  classId: data.classId,
                  subjectId: data.subjectId,
                  examType: data.examType as
                    | "MIDTERM"
                    | "FINAL"
                    | "QUIZ"
                    | "TEST"
                    | "PRACTICAL",
                }
              : undefined
          }
          onValidChange={setIsValid}
        />
      </FormLayout>
    </WizardStep>
  )
}
