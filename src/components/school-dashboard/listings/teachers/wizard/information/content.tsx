"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import React, { useEffect, useRef, useState } from "react"
import { useParams } from "next/navigation"

import { FormHeading, FormLayout } from "@/components/form"
import type { WizardFormRef } from "@/components/form/wizard"
import { WizardStep } from "@/components/form/wizard"

import { useTeacherWizard } from "../use-teacher-wizard"
import { InformationForm } from "./form"

export default function InformationContent() {
  const params = useParams()
  const teacherId = params.id as string
  const formRef = useRef<WizardFormRef>(null)
  const { data, isLoading } = useTeacherWizard()
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
      entityId={teacherId}
      nextStep={`/teachers/add/${teacherId}/expertise`}
      isValid={isValid}
      formRef={formRef}
      isLoading={isLoading}
    >
      <FormLayout>
        <FormHeading
          title="Basic Information"
          description="Enter the teacher's personal information."
        />
        <InformationForm
          ref={formRef}
          teacherId={teacherId}
          initialData={
            data
              ? {
                  givenName: data.givenName,
                  surname: data.surname,
                  gender: data.gender as "male" | "female" | undefined,
                  birthDate: data.birthDate ?? undefined,
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
