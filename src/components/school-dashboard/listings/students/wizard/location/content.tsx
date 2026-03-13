"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import React, { useRef, useState } from "react"
import { useParams } from "next/navigation"

import { FormHeading, FormLayout } from "@/components/form"
import type { WizardFormRef } from "@/components/form/wizard"
import { WizardStep } from "@/components/form/wizard"
import { useDictionary } from "@/components/internationalization/use-dictionary"

import { useStudentWizard } from "../use-student-wizard"
import { LocationForm } from "./form"

export default function LocationContent() {
  const params = useParams()
  const studentId = params.id as string
  const formRef = useRef<WizardFormRef>(null)
  const { data, isLoading } = useStudentWizard()
  const [isValid, setIsValid] = useState(true)

  const { dictionary } = useDictionary()
  const students = (dictionary?.school as any)?.students
  const t = students?.location as Record<string, string> | undefined

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
          title={t?.title || "Location"}
          description={t?.description || "Add the student's home address."}
        />
        <LocationForm
          ref={formRef}
          studentId={studentId}
          initialData={
            data
              ? {
                  currentAddress: data.currentAddress ?? undefined,
                  city: data.city ?? undefined,
                  state: data.state ?? undefined,
                  postalCode: data.postalCode ?? undefined,
                  country: data.country ?? undefined,
                }
              : undefined
          }
          onValidChange={setIsValid}
        />
      </FormLayout>
    </WizardStep>
  )
}
