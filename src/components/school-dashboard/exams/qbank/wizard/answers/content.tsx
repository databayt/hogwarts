"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import React, { useEffect, useRef, useState } from "react"
import { useParams } from "next/navigation"

import { FormHeading, FormLayout } from "@/components/form"
import type { WizardFormRef } from "@/components/form/wizard"
import { WizardStep } from "@/components/form/wizard"

import { useQuestionWizard } from "../use-question-wizard"
import { getQuestionAnswers } from "./actions"
import { AnswersForm } from "./form"
import type { AnswersFormData } from "./validation"

export default function AnswersContent() {
  const params = useParams()
  const questionId = params.id as string
  const formRef = useRef<WizardFormRef>(null)
  const { data, isLoading } = useQuestionWizard()
  const [isValid, setIsValid] = useState(false)
  const [initialAnswers, setInitialAnswers] = useState<
    Partial<AnswersFormData> | undefined
  >(undefined)

  // Load existing answer data
  useEffect(() => {
    if (questionId) {
      getQuestionAnswers(questionId).then((result) => {
        if (result.success && result.data) {
          setInitialAnswers({
            options: result.data.options,
            acceptedAnswers: result.data.acceptedAnswers,
            caseSensitive: result.data.caseSensitive,
            sampleAnswer: result.data.sampleAnswer,
            gradingRubric: result.data.gradingRubric,
          })
        }
      })
    }
  }, [questionId])

  return (
    <WizardStep
      entityId={questionId}
      nextStep={undefined}
      isValid={isValid}
      formRef={formRef}
      isLoading={isLoading}
    >
      <FormLayout>
        <FormHeading
          title="Answer Options"
          description="Configure the answer options for this question."
        />
        <AnswersForm
          ref={formRef}
          questionId={questionId}
          initialData={initialAnswers}
          onValidChange={setIsValid}
        />
      </FormLayout>
    </WizardStep>
  )
}
