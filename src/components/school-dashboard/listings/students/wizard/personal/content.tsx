"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import React, { useEffect, useRef, useState } from "react"
import { useParams } from "next/navigation"

import { FormHeading, FormLayout } from "@/components/form"
import type { WizardFormRef } from "@/components/form/wizard"
import { WizardStep } from "@/components/form/wizard"

import { useStudentWizard } from "../use-student-wizard"
import { PersonalForm } from "./form"

export default function PersonalContent() {
  const params = useParams()
  const studentId = params.id as string
  const formRef = useRef<WizardFormRef>(null)
  const { data, isLoading } = useStudentWizard()
  const [isValid, setIsValid] = useState(false)

  // Set initial validity from loaded data
  useEffect(() => {
    if (data) {
      setIsValid(
        data.givenName.trim().length >= 1 && data.surname.trim().length >= 1
      )
    }
  }, [data])

  return (
    <WizardStep
      entityId={studentId}
      nextStep={`/students/add/${studentId}/contact`}
      isValid={isValid}
      formRef={formRef}
      isLoading={isLoading}
    >
      <FormLayout>
        <FormHeading
          title="Personal Information"
          description="Enter the student's personal details."
        />
        <PersonalForm
          ref={formRef}
          studentId={studentId}
          initialData={
            data
              ? {
                  givenName: data.givenName,
                  middleName: data.middleName ?? undefined,
                  surname: data.surname,
                  dateOfBirth: data.dateOfBirth,
                  gender: data.gender as "male" | "female",
                  nationality: data.nationality ?? undefined,
                  profilePhotoUrl: data.profilePhotoUrl ?? undefined,
                }
              : undefined
          }
          onValidChange={setIsValid}
        />
      </FormLayout>
    </WizardStep>
  )
}
