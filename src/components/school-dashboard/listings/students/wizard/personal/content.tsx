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
import { useDictionary } from "@/components/internationalization/use-dictionary"

import { useStudentWizard } from "../use-student-wizard"
import { PersonalForm } from "./form"

export default function PersonalContent() {
  const params = useParams()
  const studentId = params.id as string
  const formRef = useRef<WizardFormRef>(null)
  const { data, isLoading } = useStudentWizard()
  const { dictionary } = useDictionary()
  const students = (dictionary?.school as Record<string, unknown>)?.students as
    | Record<string, unknown>
    | undefined
  const t = students?.personal as Record<string, string> | undefined
  const [isValid, setIsValid] = useState(false)

  const nameFormat = (data?.nameFormat as NameFormat) ?? "full"

  // Set initial validity from loaded data
  useEffect(() => {
    if (data) {
      if (nameFormat === "full") {
        const full = composeFullName(
          data.firstName,
          data.middleName,
          data.lastName
        )
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
      entityId={studentId}
      nextStep={`/students/add/${studentId}/guardian`}
      isValid={isValid}
      formRef={formRef}
      isLoading={isLoading}
    >
      <FormLayout>
        <FormHeading
          title={t?.title || "Personal Information"}
          description={
            t?.description || "Enter the student's personal details."
          }
        />
        <PersonalForm
          ref={formRef}
          studentId={studentId}
          nameFormat={nameFormat}
          initialData={
            data
              ? {
                  firstName: data.firstName,
                  middleName: data.middleName ?? undefined,
                  lastName: data.lastName,
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
