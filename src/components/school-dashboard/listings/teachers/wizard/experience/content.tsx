"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import React, { useRef, useState } from "react"
import { useParams } from "next/navigation"

import { FormHeading, FormLayout } from "@/components/form"
import type { WizardFormRef } from "@/components/form/wizard"
import { WizardStep } from "@/components/form/wizard"

import { useTeacherWizard } from "../use-teacher-wizard"
import { ExperienceForm } from "./form"

export default function ExperienceContent() {
  const params = useParams()
  const teacherId = params.id as string
  const formRef = useRef<WizardFormRef>(null)
  const { data, isLoading } = useTeacherWizard()
  const [isValid, setIsValid] = useState(true) // optional step

  return (
    <WizardStep
      entityId={teacherId}
      nextStep={`/teachers/add/${teacherId}/expertise`}
      isValid={isValid}
      formRef={formRef}
      isLoading={isLoading}
    >
      <FormLayout>
        <FormHeading
          title="Work Experience"
          description="Add previous work experience. This step is optional."
        />
        <ExperienceForm
          ref={formRef}
          teacherId={teacherId}
          initialData={
            data
              ? {
                  experiences: data.experiences.map((e) => ({
                    institution: e.institution,
                    position: e.position,
                    startDate: e.startDate,
                    endDate: e.endDate ?? undefined,
                    isCurrent: e.isCurrent,
                    description: e.description ?? undefined,
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
