"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import React, { useEffect, useRef, useState } from "react"
import { useParams } from "next/navigation"

import { FormHeading, FormLayout } from "@/components/form"
import type { WizardFormRef } from "@/components/form/wizard"
import { WizardStep } from "@/components/form/wizard"

import { useAssignmentWizard } from "../use-assignment-wizard"
import { DetailsForm } from "./form"

export default function DetailsContent() {
  const params = useParams()
  const assignmentId = params.id as string
  const formRef = useRef<WizardFormRef>(null)
  const { data, isLoading } = useAssignmentWizard()
  const [isValid, setIsValid] = useState(false)

  // Set initial validity from loaded data
  useEffect(() => {
    if (data) {
      const tp = Number(data.totalPoints)
      const w = Number(data.weight)
      setIsValid(tp > 0 && w > 0 && w <= 100 && !!data.dueDate)
    }
  }, [data])

  return (
    <WizardStep
      entityId={assignmentId}
      nextStep={undefined}
      isValid={isValid}
      formRef={formRef}
      isLoading={isLoading}
    >
      <FormLayout>
        <FormHeading
          title="Details & Grading"
          description="Set the grading details, due date, and instructions."
        />
        <DetailsForm
          ref={formRef}
          assignmentId={assignmentId}
          initialData={
            data
              ? {
                  totalPoints: Number(data.totalPoints),
                  weight: Number(data.weight),
                  dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
                  instructions: data.instructions ?? undefined,
                }
              : undefined
          }
          onValidChange={setIsValid}
        />
      </FormLayout>
    </WizardStep>
  )
}
