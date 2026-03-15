"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import React, { useRef, useState } from "react"
import { useParams } from "next/navigation"

import { FormHeading, FormLayout } from "@/components/form"
import type { WizardFormRef } from "@/components/form/wizard"
import { WizardStep } from "@/components/form/wizard"
import { useLocale } from "@/components/internationalization/use-locale"

import { getStepLabel } from "../labels"
import { useExamGenerateWizard } from "../use-exam-generate-wizard"
import { PaperConfigForm } from "./form"

export default function PaperConfigContent() {
  const params = useParams()
  const generatedExamId = params.id as string
  const formRef = useRef<WizardFormRef>(null)
  const { data, isLoading } = useExamGenerateWizard()
  const [isValid, setIsValid] = useState(true) // Optional step
  const { locale } = useLocale()

  return (
    <WizardStep
      entityId={generatedExamId}
      nextStep={`/exams/generate/add/${generatedExamId}/preview`}
      isValid={isValid}
      formRef={formRef}
      isLoading={isLoading}
    >
      <FormLayout>
        <FormHeading
          title={getStepLabel("paper-config", "title", locale)}
          description={getStepLabel("paper-config", "description", locale)}
        />
        <PaperConfigForm
          ref={formRef}
          generatedExamId={generatedExamId}
          initialData={
            data
              ? {
                  template: data.paperTemplate as
                    | "CLASSIC"
                    | "MODERN"
                    | "FORMAL"
                    | "CUSTOM",
                  pageSize: data.pageSize as "A4" | "Letter",
                  shuffleQuestions: data.shuffleQuestions,
                  shuffleOptions: data.shuffleOptions,
                  versionCount: data.versionCount,
                  showSchoolLogo: data.showSchoolLogo,
                  showInstructions: data.showInstructions,
                  showPointsPerQuestion: data.showPointsPerQuestion,
                }
              : undefined
          }
          onValidChange={setIsValid}
        />
      </FormLayout>
    </WizardStep>
  )
}
