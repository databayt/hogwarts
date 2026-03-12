"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import React, { useRef, useState } from "react"
import { useParams } from "next/navigation"

import { FormHeading, FormLayout } from "@/components/form"
import type { WizardFormRef } from "@/components/form/wizard"
import { WizardStep } from "@/components/form/wizard"

import { useStudentWizard } from "../use-student-wizard"
import { PreviousEducationForm } from "./form"

export default function PreviousEducationContent() {
  const params = useParams()
  const studentId = params.id as string
  const formRef = useRef<WizardFormRef>(null)
  const { data, isLoading } = useStudentWizard()
  const [isValid, setIsValid] = useState(true)

  return (
    <WizardStep
      entityId={studentId}
      nextStep={`/students/add/${studentId}/review`}
      isValid={isValid}
      formRef={formRef}
      isLoading={isLoading}
    >
      <FormLayout>
        <FormHeading
          title="Previous Education"
          description="Enter details about the student's previous school."
        />
        <PreviousEducationForm
          ref={formRef}
          studentId={studentId}
          initialData={
            data
              ? {
                  previousSchoolName: data.previousSchoolName ?? undefined,
                  previousSchoolAddress:
                    data.previousSchoolAddress ?? undefined,
                  previousGrade: data.previousGrade ?? undefined,
                  transferCertificateNo:
                    data.transferCertificateNo ?? undefined,
                  transferDate: data.transferDate ?? undefined,
                  previousAcademicRecord:
                    data.previousAcademicRecord ?? undefined,
                }
              : undefined
          }
          onValidChange={setIsValid}
        />
      </FormLayout>
    </WizardStep>
  )
}
