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
import { TemplateForm } from "./form"

export default function TemplateContent() {
  const params = useParams()
  const generatedExamId = params.id as string
  const formRef = useRef<WizardFormRef>(null)
  const { data, isLoading } = useExamGenerateWizard()
  const [isValid, setIsValid] = useState(false)
  const { locale } = useLocale()

  return (
    <WizardStep
      entityId={generatedExamId}
      nextStep={`/exams/generate/add/${generatedExamId}/exam`}
      isValid={isValid}
      formRef={formRef}
      isLoading={isLoading}
    >
      <FormLayout>
        <FormHeading
          title={getStepLabel("template", "title", locale)}
          description={getStepLabel("template", "description", locale)}
        />
        <TemplateForm
          ref={formRef}
          generatedExamId={generatedExamId}
          initialTemplateId={data?.templateId}
          onValidChange={setIsValid}
        />
      </FormLayout>
    </WizardStep>
  )
}
