"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import React, { useRef, useState } from "react"
import { useParams } from "next/navigation"

import { FormHeading, FormLayout } from "@/components/form"
import type { WizardFormRef } from "@/components/form/wizard"
import { WizardStep } from "@/components/form/wizard"
import { useDictionary } from "@/components/internationalization/use-dictionary"

import { useTeacherWizard } from "../use-teacher-wizard"
import type { GradeWithSubjects } from "./actions"
import { ExpertiseForm } from "./form"

interface ExpertiseContentProps {
  grades: GradeWithSubjects[]
}

export default function ExpertiseContent({ grades }: ExpertiseContentProps) {
  const params = useParams()
  const teacherId = params.id as string
  const formRef = useRef<WizardFormRef>(null)
  const { data, isLoading } = useTeacherWizard()
  const { dictionary } = useDictionary()
  const teachers = (dictionary?.school as Record<string, unknown>)?.teachers as
    | Record<string, unknown>
    | undefined
  const wizard = teachers?.wizard as Record<string, unknown> | undefined
  const t = wizard?.expertise as Record<string, string> | undefined
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
          title={t?.title || "Subject Expertise"}
          description={
            t?.description ||
            "Select the teacher's subject expertise areas. This step is optional."
          }
        />
        <ExpertiseForm
          ref={formRef}
          teacherId={teacherId}
          grades={grades}
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
