"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import React, { useRef, useState } from "react"
import { useParams } from "next/navigation"

import { FormHeading, FormLayout } from "@/components/form"
import type { WizardFormRef } from "@/components/form/wizard"
import { WizardStep } from "@/components/form/wizard"

import { useStudentWizard } from "../use-student-wizard"
import { EnrollmentForm } from "./form"

export default function EnrollmentContent() {
  const params = useParams()
  const studentId = params.id as string
  const formRef = useRef<WizardFormRef>(null)
  const { data, isLoading } = useStudentWizard()
  const [isValid, setIsValid] = useState(true)

  return (
    <WizardStep
      entityId={studentId}
      nextStep={`/students/add/${studentId}/health`}
      isValid={isValid}
      formRef={formRef}
      isLoading={isLoading}
    >
      <FormLayout>
        <FormHeading
          title="Enrollment Details"
          description="Enter the student's enrollment information."
        />
        <EnrollmentForm
          ref={formRef}
          studentId={studentId}
          initialData={
            data
              ? ({
                  enrollmentDate: data.enrollmentDate ?? undefined,
                  admissionNumber: data.admissionNumber ?? undefined,
                  status: data.status ?? undefined,
                  studentType: data.studentType ?? undefined,
                  category: data.category ?? undefined,
                  academicGradeId: data.academicGradeId ?? undefined,
                  sectionId: data.sectionId ?? undefined,
                } as Partial<Record<string, unknown>>)
              : undefined
          }
          onValidChange={setIsValid}
        />
      </FormLayout>
    </WizardStep>
  )
}
