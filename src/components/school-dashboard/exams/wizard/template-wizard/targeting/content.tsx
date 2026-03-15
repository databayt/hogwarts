"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import React, { useCallback, useEffect, useRef, useState } from "react"
import { useParams } from "next/navigation"

import { FormHeading, FormLayout } from "@/components/form"
import type { WizardFormRef } from "@/components/form/wizard"
import { WizardStep } from "@/components/form/wizard"
import { useLocale } from "@/components/internationalization/use-locale"

import { getStepLabel } from "../labels"
import { useTemplateWizard } from "../use-template-wizard"
import {
  getClassroomOptions,
  getGradeOptions,
  getSectionOptions,
} from "./actions"
import { TargetingForm } from "./form"

interface SelectOption {
  id: string
  name: string
}

export default function TargetingContent() {
  const { locale } = useLocale()
  const params = useParams()
  const templateId = params.id as string
  const formRef = useRef<WizardFormRef>(null)
  const { data, isLoading } = useTemplateWizard()
  const [isValid, setIsValid] = useState(true) // optional step

  const [gradeOptions, setGradeOptions] = useState<SelectOption[]>([])
  const [sectionOptions, setSectionOptions] = useState<SelectOption[]>([])
  const [classroomOptions, setClassroomOptions] = useState<SelectOption[]>([])

  // Fetch grade options on mount
  useEffect(() => {
    getGradeOptions().then((result) => {
      if (result.success && result.data) {
        setGradeOptions(result.data)
      }
    })
  }, [])

  // Track gradeIds from data for refetching dependent options
  const currentGradeIds = data?.gradeIds ?? []
  const gradeIdsKey = currentGradeIds.join(",")

  // Refetch section and classroom options when gradeIds change
  const fetchDependentOptions = useCallback(async (gradeIds: string[]) => {
    const [sectionsResult, classroomsResult] = await Promise.all([
      getSectionOptions(gradeIds),
      getClassroomOptions(gradeIds),
    ])

    if (sectionsResult.success && sectionsResult.data) {
      setSectionOptions(sectionsResult.data)
    }
    if (classroomsResult.success && classroomsResult.data) {
      setClassroomOptions(classroomsResult.data)
    }
  }, [])

  useEffect(() => {
    fetchDependentOptions(currentGradeIds)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gradeIdsKey, fetchDependentOptions])

  return (
    <WizardStep
      entityId={templateId}
      nextStep={`/exams/template/add/${templateId}/question-types`}
      isValid={isValid}
      formRef={formRef}
      isLoading={isLoading}
    >
      <FormLayout>
        <FormHeading
          title={getStepLabel("targeting", "title", locale)}
          description={getStepLabel("targeting", "description", locale)}
        />
        <TargetingForm
          ref={formRef}
          templateId={templateId}
          initialData={
            data
              ? {
                  gradeIds: data.gradeIds,
                  sectionIds: data.sectionIds,
                  classroomIds: data.classroomIds,
                }
              : undefined
          }
          onValidChange={setIsValid}
          gradeOptions={gradeOptions}
          sectionOptions={sectionOptions}
          classroomOptions={classroomOptions}
        />
      </FormLayout>
    </WizardStep>
  )
}
