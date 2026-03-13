"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import React, { useRef, useState } from "react"
import { useParams } from "next/navigation"

import { FormHeading, FormLayout } from "@/components/form"
import type { WizardFormRef } from "@/components/form/wizard"
import { WizardStep } from "@/components/form/wizard"

import { useTemplateWizard } from "../use-template-wizard"
import { QuestionTypesForm } from "./form"

export default function QuestionTypesContent() {
  const params = useParams()
  const templateId = params.id as string
  const formRef = useRef<WizardFormRef>(null)
  const { data, isLoading } = useTemplateWizard()
  const [isValid, setIsValid] = useState(false)

  return (
    <WizardStep
      entityId={templateId}
      nextStep={`/exams/template/add/${templateId}/duration-marks`}
      isValid={isValid}
      formRef={formRef}
      isLoading={isLoading}
    >
      <FormLayout>
        <FormHeading
          title="Question Types"
          description="Select question types and count for each."
        />
        <QuestionTypesForm
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
