"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import React, { useEffect, useRef, useState } from "react"
import { useParams } from "next/navigation"

import { FormHeading, FormLayout } from "@/components/form"
import type { WizardFormRef } from "@/components/form/wizard"
import { WizardStep } from "@/components/form/wizard"

import { useClassWizard } from "../use-class-wizard"
import { InformationForm } from "./form"

export default function InformationContent() {
  const params = useParams()
  const classId = params.id as string
  const formRef = useRef<WizardFormRef>(null)
  const { data, isLoading } = useClassWizard()
  const [isValid, setIsValid] = useState(false)

  // Set initial validity from loaded data
  useEffect(() => {
    if (data) {
      setIsValid(
        data.name.trim().length >= 1 &&
          !data.name.startsWith("Draft-") &&
          data.subjectId.length >= 1 &&
          data.teacherId.length >= 1
      )
    }
  }, [data])

  return (
    <WizardStep
      entityId={classId}
      nextStep={`/classes/add/${classId}/schedule`}
      isValid={isValid}
      formRef={formRef}
      isLoading={isLoading}
    >
      <FormLayout>
        <FormHeading
          title="Class Information"
          description="Enter the basic class details, subject, and assigned teacher."
        />
        <InformationForm
          ref={formRef}
          classId={classId}
          initialData={
            data
              ? {
                  name: data.name.startsWith("Draft-") ? "" : data.name,
                  subjectId: data.subjectId,
                  teacherId: data.teacherId,
                  gradeId: data.gradeId ?? undefined,
                  courseCode: data.courseCode ?? undefined,
                  evaluationType: data.evaluationType as
                    | "NORMAL"
                    | "GPA"
                    | "CWA"
                    | "CCE",
                }
              : undefined
          }
          onValidChange={setIsValid}
        />
      </FormLayout>
    </WizardStep>
  )
}
