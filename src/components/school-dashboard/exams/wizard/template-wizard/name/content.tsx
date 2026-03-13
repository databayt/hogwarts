"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import React, { useEffect, useRef, useState } from "react"
import { useParams } from "next/navigation"

import { FormHeading, FormLayout } from "@/components/form"
import type { WizardFormRef } from "@/components/form/wizard"
import { WizardStep } from "@/components/form/wizard"

import { useTemplateWizard } from "../use-template-wizard"
import { NameForm } from "./form"

export default function NameContent() {
  const params = useParams()
  const templateId = params.id as string
  const formRef = useRef<WizardFormRef>(null)
  const { data, isLoading } = useTemplateWizard()
  const [isValid, setIsValid] = useState(false)

  useEffect(() => {
    if (data) {
      setIsValid(data.name.trim().length >= 1)
    }
  }, [data])

  return (
    <WizardStep
      entityId={templateId}
      nextStep={`/exams/template/add/${templateId}/subject`}
      isValid={isValid}
      formRef={formRef}
      isLoading={isLoading}
    >
      <FormLayout>
        <FormHeading
          title="Template Name"
          description="Give your exam template a name and description."
        />
        <NameForm
          ref={formRef}
          templateId={templateId}
          initialData={
            data
              ? {
                  name: data.name,
                  description: data.description ?? undefined,
                  examType: data.examType,
                }
              : undefined
          }
          onValidChange={setIsValid}
        />
      </FormLayout>
    </WizardStep>
  )
}
