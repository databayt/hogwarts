"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import React, { useRef, useState } from "react"
import { useParams } from "next/navigation"

import { FormHeading, FormLayout } from "@/components/form"
import type { WizardFormRef } from "@/components/form/wizard"
import { WizardStep } from "@/components/form/wizard"

import { DEFAULT_GRADE_BOUNDARIES } from "../../types"
import { useTemplateWizard } from "../use-template-wizard"
import { ScoringForm } from "./form"

export default function ScoringContent() {
  const params = useParams()
  const templateId = params.id as string
  const formRef = useRef<WizardFormRef>(null)
  const { data, isLoading } = useTemplateWizard()
  const [isValid, setIsValid] = useState(true)

  return (
    <WizardStep
      entityId={templateId}
      nextStep={`/exams/template/add/${templateId}/print`}
      isValid={isValid}
      formRef={formRef}
      isLoading={isLoading}
    >
      <FormLayout>
        <FormHeading
          title="Scoring & Grades"
          description="Set the passing score and grade boundaries."
        />
        <ScoringForm
          ref={formRef}
          templateId={templateId}
          initialData={{
            passingScore: data?.passingScore ?? 50,
            gradeBoundaries: data?.gradeBoundaries ?? DEFAULT_GRADE_BOUNDARIES,
          }}
          onValidChange={setIsValid}
        />
      </FormLayout>
    </WizardStep>
  )
}
