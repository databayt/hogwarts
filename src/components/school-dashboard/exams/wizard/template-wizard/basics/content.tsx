"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import React, { useEffect, useRef, useState } from "react"
import { useParams } from "next/navigation"

import { FormHeading, FormLayout } from "@/components/form"
import type { WizardFormRef } from "@/components/form/wizard"
import { WizardStep } from "@/components/form/wizard"
import { useLocale } from "@/components/internationalization/use-locale"

import { getNextStep } from "../config"
import { getStepLabel } from "../labels"
import { useTemplateWizard } from "../use-template-wizard"
import { getSubjectOptions } from "./actions"
import { BasicsForm } from "./form"

interface Props {
  /** Static-dictionary slice (generate.wizard.*) — falls back to local labels */
  dictionary?: { title?: string; description?: string }
}

export default function BasicsContent({ dictionary }: Props) {
  const { locale } = useLocale()
  const params = useParams()
  const templateId = params.id as string
  const formRef = useRef<WizardFormRef>(null)
  const { data, isLoading } = useTemplateWizard()
  const [isValid, setIsValid] = useState(false)
  const [subjectOptions, setSubjectOptions] = useState<
    { id: string; name: string }[]
  >([])

  // Fetch subject options on mount
  useEffect(() => {
    let mounted = true
    getSubjectOptions().then((result) => {
      if (mounted && result.success && result.data) {
        setSubjectOptions(result.data.map((s) => ({ id: s.id, name: s.name })))
      }
    })
    return () => {
      mounted = false
    }
  }, [])

  // Set initial validity from loaded data
  useEffect(() => {
    if (data) {
      setIsValid(
        data.name.trim().length >= 1 &&
          data.subjectId.trim().length >= 1 &&
          data.duration >= 5 &&
          data.totalMarks >= 1
      )
    }
  }, [data])

  return (
    <WizardStep
      entityId={templateId}
      nextStep={getNextStep("basics", templateId)}
      isValid={isValid}
      formRef={formRef}
      isLoading={isLoading}
    >
      <FormLayout>
        <FormHeading
          title={dictionary?.title ?? getStepLabel("basics", "title", locale)}
          description={
            dictionary?.description ??
            getStepLabel("basics", "description", locale)
          }
        />
        <BasicsForm
          ref={formRef}
          templateId={templateId}
          initialData={
            data
              ? {
                  name: data.name,
                  description: data.description ?? undefined,
                  examType: data.examType,
                  subjectId: data.subjectId,
                  duration: data.duration,
                  totalMarks: data.totalMarks,
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
