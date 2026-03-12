"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import React, { useEffect, useRef, useState } from "react"
import { useParams } from "next/navigation"

import { FormHeading, FormLayout } from "@/components/form"
import type { WizardFormRef } from "@/components/form/wizard"
import { WizardStep } from "@/components/form/wizard"

import { useGradeWizard } from "../use-grade-wizard"
import { ScoringForm } from "./form"

export default function ScoringContent() {
  const params = useParams()
  const resultId = params.id as string
  const formRef = useRef<WizardFormRef>(null)
  const { data, isLoading } = useGradeWizard()
  const [isValid, setIsValid] = useState(false)

  // Set initial validity from loaded data
  useEffect(() => {
    if (data) {
      setIsValid(
        Number(data.score) <= Number(data.maxScore) &&
          Number(data.maxScore) > 0 &&
          data.grade.trim().length >= 1
      )
    }
  }, [data])

  return (
    <WizardStep
      entityId={resultId}
      nextStep={undefined}
      isValid={isValid}
      formRef={formRef}
      isLoading={isLoading}
    >
      <FormLayout>
        <FormHeading
          title="Score & Grade"
          description="Enter the score, grade, and optional feedback."
        />
        <ScoringForm
          ref={formRef}
          resultId={resultId}
          initialData={
            data
              ? {
                  score: Number(data.score),
                  maxScore: Number(data.maxScore),
                  grade: data.grade,
                  feedback: data.feedback ?? undefined,
                }
              : undefined
          }
          onValidChange={setIsValid}
        />
      </FormLayout>
    </WizardStep>
  )
}
