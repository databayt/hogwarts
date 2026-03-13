"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import React, { useRef, useState } from "react"
import { useParams } from "next/navigation"

import { FormHeading, FormLayout } from "@/components/form"
import type { WizardFormRef } from "@/components/form/wizard"
import { WizardStep } from "@/components/form/wizard"

import { DEFAULT_DECORATIONS } from "../../types"
import { useTemplateWizard } from "../use-template-wizard"
import { PrintForm } from "./form"

export default function PrintContent() {
  const params = useParams()
  const templateId = params.id as string
  const formRef = useRef<WizardFormRef>(null)
  const { data, isLoading } = useTemplateWizard()
  const [isValid, setIsValid] = useState(true)

  return (
    <WizardStep
      entityId={templateId}
      nextStep={`/exams/template/add/${templateId}/preview`}
      isValid={isValid}
      formRef={formRef}
      isLoading={isLoading}
    >
      <FormLayout>
        <FormHeading
          title="Print Settings"
          description="Configure page size, orientation, and decorations."
        />
        <PrintForm
          ref={formRef}
          templateId={templateId}
          initialData={{
            pageSize: data?.pageSize ?? "A4",
            orientation: data?.orientation ?? "portrait",
            answerSheetType: data?.answerSheetType ?? "SEPARATE",
            layout: data?.layout ?? "SINGLE_COLUMN",
            decorations: data?.decorations ?? DEFAULT_DECORATIONS,
          }}
          onValidChange={setIsValid}
        />
      </FormLayout>
    </WizardStep>
  )
}
