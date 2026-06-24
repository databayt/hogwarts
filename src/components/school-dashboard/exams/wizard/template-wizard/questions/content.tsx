"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import React, { useRef, useState } from "react"
import { useParams } from "next/navigation"

import { FormHeading, FormLayout } from "@/components/form"
import type { WizardFormRef } from "@/components/form/wizard"
import { WizardStep } from "@/components/form/wizard"
import { useLocale } from "@/components/internationalization/use-locale"

import { getNextStep } from "../config"
import { getStepLabel } from "../labels"
import { useTemplateWizard } from "../use-template-wizard"
import { QuestionsForm } from "./form"

interface Props {
  /** Static-dictionary slice (generate.wizard.*) — falls back to local labels */
  dictionary?: { title?: string; description?: string }
}

export default function QuestionsContent({ dictionary }: Props) {
  const { locale } = useLocale()
  const params = useParams()
  const templateId = params.id as string
  const formRef = useRef<WizardFormRef>(null)
  const { data, isLoading } = useTemplateWizard()
  const [isValid, setIsValid] = useState(false)

  return (
    <WizardStep
      entityId={templateId}
      nextStep={getNextStep("questions", templateId)}
      isValid={isValid}
      formRef={formRef}
      isLoading={isLoading}
    >
      <FormLayout>
        <FormHeading
          title={
            dictionary?.title ?? getStepLabel("questions", "title", locale)
          }
          description={
            dictionary?.description ??
            getStepLabel("questions", "description", locale)
          }
        />
        <QuestionsForm
          ref={formRef}
          templateId={templateId}
          initialData={
            data && data.questionTypes.length > 0
              ? data.questionTypes
              : undefined
          }
          onValidChange={setIsValid}
        />
      </FormLayout>
    </WizardStep>
  )
}
