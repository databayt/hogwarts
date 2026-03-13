"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import React, { useEffect, useRef, useState } from "react"
import { useParams } from "next/navigation"

import { FormHeading, FormLayout } from "@/components/form"
import type { WizardFormRef } from "@/components/form/wizard"
import { WizardStep } from "@/components/form/wizard"

import { useTemplateWizard } from "../use-template-wizard"
import { getSchoolTemplates } from "./actions"
import { GalleryForm } from "./form"

export default function GalleryContent() {
  const params = useParams()
  const templateId = params.id as string
  const formRef = useRef<WizardFormRef>(null)
  const { data, isLoading } = useTemplateWizard()
  const [isValid, setIsValid] = useState(true)
  const [schoolTemplates, setSchoolTemplates] = useState<
    { id: string; name: string; blockConfig: unknown }[]
  >([])

  useEffect(() => {
    getSchoolTemplates().then((result) => {
      if (result.success && result.data) {
        setSchoolTemplates(result.data)
      }
    })
  }, [])

  return (
    <WizardStep
      entityId={templateId}
      nextStep={`/exams/template/add/${templateId}/name`}
      isValid={isValid}
      formRef={formRef}
      isLoading={isLoading}
    >
      <FormLayout>
        <FormHeading
          title="Choose a Template"
          description="Start from a regional preset or begin from scratch."
        />
        <GalleryForm
          ref={formRef}
          templateId={templateId}
          initialPresetId={data?.selectedPresetId ?? null}
          schoolTemplates={schoolTemplates}
          onValidChange={setIsValid}
        />
      </FormLayout>
    </WizardStep>
  )
}
