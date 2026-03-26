"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import React, { useEffect, useRef, useState } from "react"
import { useParams } from "next/navigation"

import type { NameFormat } from "@/lib/name-utils"
import { composeFullName } from "@/lib/name-utils"
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

  const nameFormat = (data?.nameFormat as NameFormat) ?? "full"

  // Set initial validity from loaded data
  useEffect(() => {
    if (data) {
      if (nameFormat === "full") {
        const full = composeFullName(data.firstName, null, data.lastName)
        setIsValid(full.trim().length >= 1)
      } else {
        setIsValid(
          data.firstName.trim().length >= 1 && data.lastName.trim().length >= 1
        )
      }
    }
  }, [data, nameFormat])

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
          nameFormat={nameFormat}
          initialData={
            data
              ? {
                  firstName: data.firstName,
                  lastName: data.lastName,
                  gender: data.gender as "male" | "female" | undefined,
                  birthDate: data.birthDate ?? undefined,
                  nationality: data.nationality ?? undefined,
                }
              : undefined
          }
          onValidChange={setIsValid}
        />
      </FormLayout>
    </WizardStep>
  )
}
