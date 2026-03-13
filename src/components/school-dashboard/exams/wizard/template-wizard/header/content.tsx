"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import React, { useRef, useState } from "react"
import { useParams } from "next/navigation"

import { FormHeading, FormLayout } from "@/components/form"
import type { WizardFormRef } from "@/components/form/wizard"
import { WizardStep } from "@/components/form/wizard"

import { useTemplateWizard } from "../use-template-wizard"
import { HeaderForm } from "./form"

export default function HeaderContent() {
  const params = useParams()
  const templateId = params.id as string
  const formRef = useRef<WizardFormRef>(null)
  const { data, isLoading } = useTemplateWizard()
  const [isValid, setIsValid] = useState(true)

  return (
    <WizardStep
      entityId={templateId}
      nextStep={`/exams/template/add/${templateId}/student-info`}
      isValid={isValid}
      formRef={formRef}
      isLoading={isLoading}
    >
      <FormLayout>
        <FormHeading
          title="Header"
          description="Choose a header design for your exam paper."
        />
        <HeaderForm
          ref={formRef}
          templateId={templateId}
          initialVariant={data?.headerVariant ?? "standard"}
          onValidChange={setIsValid}
        />
      </FormLayout>
    </WizardStep>
  )
}
