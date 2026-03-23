"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import React, { useEffect, useRef, useState } from "react"
import { useParams } from "next/navigation"

import { FormHeading, FormLayout } from "@/components/form"
import type { WizardFormRef } from "@/components/form/wizard"
import { WizardStep } from "@/components/form/wizard"
import { useDictionary } from "@/components/internationalization/use-dictionary"

import { useAssignmentWizard } from "../use-assignment-wizard"
import { InformationForm } from "./form"
// Import type for cast
import type { InformationFormData } from "./validation"

export default function InformationContent() {
  const params = useParams()
  const assignmentId = params.id as string
  const formRef = useRef<WizardFormRef>(null)
  const { data, isLoading } = useAssignmentWizard()
  const { dictionary } = useDictionary()
  const fd = (dictionary?.school as Record<string, any>)?.assignments?.form as
    | Record<string, any>
    | undefined
  const [isValid, setIsValid] = useState(false)

  // Set initial validity from loaded data
  useEffect(() => {
    if (data) {
      setIsValid(
        data.title.trim().length >= 1 && data.classId.trim().length >= 1
      )
    }
  }, [data])

  return (
    <WizardStep
      entityId={assignmentId}
      nextStep={`/assignments/add/${assignmentId}/details`}
      isValid={isValid}
      formRef={formRef}
      isLoading={isLoading}
    >
      <FormLayout>
        <FormHeading
          title={fd?.assignmentInformation || "Assignment Information"}
          description={
            fd?.enterBasicInfo || "Enter the assignment's basic information."
          }
        />
        <InformationForm
          ref={formRef}
          assignmentId={assignmentId}
          initialData={
            data
              ? {
                  title: data.title,
                  classId: data.classId,
                  type: data.type as InformationFormData["type"],
                  description: data.description ?? undefined,
                }
              : undefined
          }
          onValidChange={setIsValid}
        />
      </FormLayout>
    </WizardStep>
  )
}
