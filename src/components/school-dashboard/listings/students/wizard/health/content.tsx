"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import React, { useRef, useState } from "react"
import { useParams } from "next/navigation"

import { FormHeading, FormLayout } from "@/components/form"
import type { WizardFormRef } from "@/components/form/wizard"
import { WizardStep } from "@/components/form/wizard"

import { useStudentWizard } from "../use-student-wizard"
import { HealthForm } from "./form"

export default function HealthContent() {
  const params = useParams()
  const studentId = params.id as string
  const formRef = useRef<WizardFormRef>(null)
  const { data, isLoading } = useStudentWizard()
  const [isValid, setIsValid] = useState(true)

  return (
    <WizardStep
      entityId={studentId}
      nextStep={`/students/add/${studentId}/previous-education`}
      isValid={isValid}
      formRef={formRef}
      isLoading={isLoading}
    >
      <FormLayout>
        <FormHeading
          title="Health Information"
          description="Add the student's medical and health details."
        />
        <HealthForm
          ref={formRef}
          studentId={studentId}
          initialData={
            data
              ? {
                  medicalConditions: data.medicalConditions ?? undefined,
                  allergies: data.allergies ?? undefined,
                  medicationRequired: data.medicationRequired ?? undefined,
                  doctorName: data.doctorName ?? undefined,
                  doctorContact: data.doctorContact ?? undefined,
                  insuranceProvider: data.insuranceProvider ?? undefined,
                  insuranceNumber: data.insuranceNumber ?? undefined,
                  bloodGroup: data.bloodGroup ?? undefined,
                }
              : undefined
          }
          onValidChange={setIsValid}
        />
      </FormLayout>
    </WizardStep>
  )
}
