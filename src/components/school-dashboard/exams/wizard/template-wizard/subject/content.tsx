"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import React, { useEffect, useRef, useState } from "react"
import { useParams } from "next/navigation"

import { FormHeading, FormLayout } from "@/components/form"
import type { WizardFormRef } from "@/components/form/wizard"
import { WizardStep } from "@/components/form/wizard"

import { useTemplateWizard } from "../use-template-wizard"
import { getSubjectOptions } from "./actions"
import { SubjectForm } from "./form"

export default function SubjectContent() {
  const params = useParams()
  const templateId = params.id as string
  const formRef = useRef<WizardFormRef>(null)
  const { data, isLoading } = useTemplateWizard()
  const [isValid, setIsValid] = useState(false)
  const [subjectOptions, setSubjectOptions] = useState<
    { id: string; subjectName: string }[]
  >([])

  // Fetch subject options on mount
  useEffect(() => {
    let mounted = true
    getSubjectOptions().then((result) => {
      if (mounted && result.success && result.data) {
        setSubjectOptions(result.data)
      }
    })
    return () => {
      mounted = false
    }
  }, [])

  // Set initial validity from loaded data
  useEffect(() => {
    if (data) {
      setIsValid(data.subjectId.trim().length >= 1)
    }
  }, [data])

  return (
    <WizardStep
      entityId={templateId}
      nextStep={`/exams/template/add/${templateId}/targeting`}
      isValid={isValid}
      formRef={formRef}
      isLoading={isLoading}
    >
      <FormLayout>
        <FormHeading
          title="Subject"
          description="Select the subject for this template."
        />
        <SubjectForm
          ref={formRef}
          templateId={templateId}
          initialData={
            data
              ? {
                  subjectId: data.subjectId,
                }
              : undefined
          }
          onValidChange={setIsValid}
          subjectOptions={subjectOptions}
        />
      </FormLayout>
    </WizardStep>
  )
}
