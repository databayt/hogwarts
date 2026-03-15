"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import React, { useRef, useState } from "react"
import { useParams } from "next/navigation"

import { FormHeading, FormLayout } from "@/components/form"
import type { WizardFormRef } from "@/components/form/wizard"
import { WizardStep } from "@/components/form/wizard"

import { useTeacherWizard } from "../use-teacher-wizard"
import { ExpertiseForm } from "./form"

export default function ExpertiseContent() {
  const params = useParams()
  const teacherId = params.id as string
  const formRef = useRef<WizardFormRef>(null)
  const { data, isLoading } = useTeacherWizard()
  const [isValid, setIsValid] = useState(true) // optional step

  return (
    <WizardStep
      entityId={teacherId}
      nextStep={`/teachers/add/${teacherId}/contact`}
      isValid={isValid}
      formRef={formRef}
      isLoading={isLoading}
    >
      <FormLayout>
        <FormHeading
          title="Subject Expertise"
          description="Select the teacher's subject expertise areas. This step is optional."
        />
        <ExpertiseForm
          ref={formRef}
          teacherId={teacherId}
          initialData={
            data
              ? {
                  subjectExpertise: data.subjectExpertise.map((e) => ({
                    subjectId: e.subjectId,
                    expertiseLevel: e.expertiseLevel as "PRIMARY" | "SECONDARY",
                  })),
                }
              : undefined
          }
          onValidChange={setIsValid}
        />
      </FormLayout>
    </WizardStep>
  )
}
