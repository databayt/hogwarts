"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import React, { useMemo, useRef, useState } from "react"
import { useParams } from "next/navigation"

import { FormHeading, FormLayout } from "@/components/form"
import type { WizardFormRef } from "@/components/form/wizard"
import { WizardStep } from "@/components/form/wizard"
import { useLocale } from "@/components/internationalization/use-locale"

import { getStepLabel, QUESTION_TYPE_LABELS } from "../labels"
import { useTemplateWizard } from "../use-template-wizard"
import { DifficultyForm } from "./form"

/**
 * Convert slug form ("multiple-choice") back to enum form ("MULTIPLE_CHOICE").
 */
function slugToEnum(slug: string): string {
  return slug.toUpperCase().replace(/-/g, "_")
}

/**
 * Convert enum form ("MULTIPLE_CHOICE") to slug form ("multiple-choice").
 */
function enumToSlug(enumVal: string): string {
  return enumVal.toLowerCase().replace(/_/g, "-")
}

export default function DifficultyContent() {
  const { locale } = useLocale()
  const params = useParams()
  const templateId = params.id as string
  const questionTypeSlug = params.questionType as string
  const questionType = slugToEnum(questionTypeSlug)

  const formRef = useRef<WizardFormRef>(null)
  const { data, isLoading } = useTemplateWizard()
  const [isValid, setIsValid] = useState(false)

  // Find the matching question type config
  const qtConfig = useMemo(
    () => data?.questionTypes.find((qt) => qt.type === questionType),
    [data, questionType]
  )

  // Determine the next step: next difficulty type or scoring
  const nextStep = useMemo(() => {
    if (!data) return `/exams/template/add/${templateId}/scoring`

    const types = data.questionTypes
    const currentIndex = types.findIndex((qt) => qt.type === questionType)

    if (currentIndex >= 0 && currentIndex < types.length - 1) {
      const nextType = types[currentIndex + 1]
      return `/exams/template/add/${templateId}/difficulty/${enumToSlug(nextType.type)}`
    }

    return `/exams/template/add/${templateId}/scoring`
  }, [data, questionType, templateId])

  const typeLabel =
    QUESTION_TYPE_LABELS[questionType]?.[locale === "ar" ? "ar" : "en"] ||
    questionType
  const totalCount = qtConfig?.count ?? 0
  const initialDifficulty = useMemo(() => {
    if (data?.distribution?.[questionType]) {
      return data.distribution[questionType] as {
        EASY: number
        MEDIUM: number
        HARD: number
      }
    }
    if (qtConfig?.difficulty) {
      return qtConfig.difficulty
    }
    return { EASY: 0, MEDIUM: 0, HARD: 0 }
  }, [data, questionType, qtConfig])

  return (
    <WizardStep
      entityId={templateId}
      nextStep={nextStep}
      isValid={isValid}
      formRef={formRef}
      isLoading={isLoading}
    >
      <FormLayout>
        <FormHeading
          title={`${typeLabel} ${getStepLabel("difficulty", "title", locale)}`}
          description={getStepLabel("difficulty", "description", locale)}
        />
        <DifficultyForm
          ref={formRef}
          templateId={templateId}
          questionType={questionType}
          totalCount={totalCount}
          initialDifficulty={initialDifficulty}
          onValidChange={setIsValid}
        />
      </FormLayout>
    </WizardStep>
  )
}
