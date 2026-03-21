"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import React, { useEffect, useRef, useState } from "react"
import { useParams } from "next/navigation"

import { FormHeading, FormLayout } from "@/components/form"
import type { WizardFormRef } from "@/components/form/wizard"
import { WizardStep } from "@/components/form/wizard"
import { useDictionary } from "@/components/internationalization/use-dictionary"

import { useQuestionWizard } from "../use-question-wizard"
import { QuestionForm } from "./form"

function useTabHeadings(): Record<
  string,
  { title: string; description: string }
> {
  const { dictionary } = useDictionary()
  const t = dictionary?.school?.exams?.qbankUi?.wizard?.question as
    | Record<string, string>
    | undefined
  return {
    question: {
      title: t?.tabQuestion ?? "Question",
      description:
        t?.tabQuestionDesc ?? "Enter the question text, subject, and type.",
    },
    details: {
      title: t?.tabDetailsTitle ?? "Question Details",
      description:
        t?.tabDetailsDesc ?? "Set difficulty, points, tags, and explanation.",
    },
  }
}

export default function QuestionContent() {
  const params = useParams()
  const questionId = params.id as string
  const formRef = useRef<WizardFormRef>(null)
  const { data, isLoading } = useQuestionWizard()
  const TAB_HEADINGS = useTabHeadings()
  const [isValid, setIsValid] = useState(false)
  const [heading, setHeading] = useState(TAB_HEADINGS.question)

  const handleTabChange = (tabId: string) => {
    setHeading(TAB_HEADINGS[tabId] || TAB_HEADINGS.question)
  }

  // Set initial validity from loaded data
  useEffect(() => {
    if (data) {
      setIsValid(
        data.questionText.trim().length >= 10 &&
          data.subjectId.trim().length > 0
      )
    }
  }, [data])

  return (
    <WizardStep
      entityId={questionId}
      nextStep={`/exams/qbank/add/${questionId}/answers`}
      isValid={isValid}
      formRef={formRef}
      isLoading={isLoading}
    >
      <FormLayout>
        <FormHeading title={heading.title} description={heading.description} />
        <QuestionForm
          ref={formRef}
          questionId={questionId}
          initialData={
            data
              ? {
                  subjectId: data.subjectId,
                  questionText: data.questionText,
                  questionType: data.questionType as
                    | "MULTIPLE_CHOICE"
                    | "TRUE_FALSE"
                    | "FILL_BLANK"
                    | "SHORT_ANSWER"
                    | "ESSAY"
                    | "MATCHING"
                    | "ORDERING"
                    | "MULTI_SELECT",
                  difficulty: data.difficulty as "EASY" | "MEDIUM" | "HARD",
                  bloomLevel: data.bloomLevel as
                    | "REMEMBER"
                    | "UNDERSTAND"
                    | "APPLY"
                    | "ANALYZE"
                    | "EVALUATE"
                    | "CREATE",
                  points: data.points,
                  timeEstimate: data.timeEstimate ?? undefined,
                  tags: data.tags.join(", "),
                  explanation: data.explanation ?? undefined,
                  imageUrl: data.imageUrl ?? undefined,
                }
              : undefined
          }
          onValidChange={setIsValid}
          onTabChange={handleTabChange}
        />
      </FormLayout>
    </WizardStep>
  )
}
