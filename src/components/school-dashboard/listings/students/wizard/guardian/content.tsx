"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useEffect, useRef, useState } from "react"
import { useParams } from "next/navigation"

import type { NameFormat } from "@/lib/name-utils"
import { FormHeading, FormLayout } from "@/components/form"
import type { WizardFormRef } from "@/components/form/wizard"
import { WizardStep } from "@/components/form/wizard"
import { useDictionary } from "@/components/internationalization/use-dictionary"

import { useStudentWizard } from "../use-student-wizard"
import { getStudentGuardians } from "./actions"
import { GuardianForm } from "./form"
import type { GuardianFormData } from "./validation"

export default function GuardianContent() {
  const params = useParams()
  const studentId = params.id as string
  const formRef = useRef<WizardFormRef>(null)
  const { data, isLoading } = useStudentWizard()
  const { dictionary } = useDictionary()
  const students = (dictionary?.school as Record<string, unknown>)?.students as
    | Record<string, unknown>
    | undefined
  const t = (students as Record<string, unknown>)?.guardian as
    | Record<string, string>
    | undefined
  const [isValid, setIsValid] = useState(false)
  const [guardianData, setGuardianData] = useState<
    Partial<GuardianFormData> | undefined
  >()

  const nameFormat = (data?.nameFormat as NameFormat) ?? "full"

  // Load existing guardian data
  useEffect(() => {
    if (studentId) {
      getStudentGuardians(studentId).then((result) => {
        if (result.success && result.data) {
          setGuardianData(result.data)
          // Set initial validity
          setIsValid(
            (result.data.fatherFirstName?.trim().length ?? 0) > 0 ||
              (result.data.motherFirstName?.trim().length ?? 0) > 0
          )
        }
      })
    }
  }, [studentId])

  return (
    <WizardStep
      entityId={studentId}
      nextStep={`/students/add/${studentId}/enrollment`}
      isValid={isValid}
      formRef={formRef}
      isLoading={isLoading}
    >
      <FormLayout>
        <FormHeading
          title={t?.title || "Parents / Guardians"}
          description={
            t?.description ||
            "Enter the student's parent or guardian information."
          }
        />
        <GuardianForm
          ref={formRef}
          studentId={studentId}
          nameFormat={nameFormat}
          initialData={guardianData}
          onValidChange={setIsValid}
        />
      </FormLayout>
    </WizardStep>
  )
}
