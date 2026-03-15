"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import React, { useEffect, useRef, useState } from "react"
import { useParams } from "next/navigation"

import { FormHeading, FormLayout } from "@/components/form"
import type { WizardFormRef } from "@/components/form/wizard"
import { WizardStep } from "@/components/form/wizard"
import { useLocale } from "@/components/internationalization/use-locale"

import { getStepLabel } from "../labels"
import { useTemplateWizard } from "../use-template-wizard"
import { DurationMarksForm } from "./form"

export default function DurationMarksContent() {
  const { locale } = useLocale()
  const params = useParams()
  const templateId = params.id as string
  const formRef = useRef<WizardFormRef>(null)
  const { data, isLoading } = useTemplateWizard()
  const [isValid, setIsValid] = useState(false)

  // Set initial validity from loaded data
  useEffect(() => {
    if (data) {
      setIsValid(data.duration >= 5 && data.totalMarks >= 1)
    }
  }, [data])

  return (
    <WizardStep
      entityId={templateId}
      nextStep={`/exams/template/add/${templateId}/header`}
      isValid={isValid}
      formRef={formRef}
      isLoading={isLoading}
    >
      <FormLayout>
        <FormHeading
          title={getStepLabel("duration-marks", "title", locale)}
          description={getStepLabel("duration-marks", "description", locale)}
        />
        <DurationMarksForm
          ref={formRef}
          templateId={templateId}
          initialData={
            data
              ? {
                  duration: data.duration,
                  totalMarks: data.totalMarks,
                }
              : undefined
          }
          onValidChange={setIsValid}
        />
      </FormLayout>
    </WizardStep>
  )
}
