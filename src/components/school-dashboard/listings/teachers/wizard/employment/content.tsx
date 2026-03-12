"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import React, { useRef, useState } from "react"
import { useParams } from "next/navigation"

import { FormHeading, FormLayout } from "@/components/form"
import type { WizardFormRef } from "@/components/form/wizard"
import { WizardStep } from "@/components/form/wizard"

import { useTeacherWizard } from "../use-teacher-wizard"
import { EmploymentForm } from "./form"

export default function EmploymentContent() {
  const params = useParams()
  const teacherId = params.id as string
  const formRef = useRef<WizardFormRef>(null)
  const { data, isLoading } = useTeacherWizard()
  const [isValid, setIsValid] = useState(true) // optional step

  return (
    <WizardStep
      entityId={teacherId}
      nextStep={`/teachers/add/${teacherId}/qualifications`}
      isValid={isValid}
      formRef={formRef}
      isLoading={isLoading}
    >
      <FormLayout>
        <FormHeading
          title="Employment Details"
          description="Add employment information. This step is optional."
        />
        <EmploymentForm
          ref={formRef}
          teacherId={teacherId}
          initialData={
            data
              ? {
                  employeeId: data.employeeId ?? undefined,
                  joiningDate: data.joiningDate ?? undefined,
                  employmentStatus: data.employmentStatus as
                    | "ACTIVE"
                    | "ON_LEAVE"
                    | "TERMINATED"
                    | "RETIRED",
                  employmentType: data.employmentType as
                    | "FULL_TIME"
                    | "PART_TIME"
                    | "CONTRACT"
                    | "SUBSTITUTE",
                  contractStartDate: data.contractStartDate ?? undefined,
                  contractEndDate: data.contractEndDate ?? undefined,
                }
              : undefined
          }
          onValidChange={setIsValid}
        />
      </FormLayout>
    </WizardStep>
  )
}
