"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import React, { useMemo, useRef, useState } from "react"
import { useParams } from "next/navigation"

import { FormHeading, FormLayout } from "@/components/form"
import type { WizardFormRef } from "@/components/form/wizard"
import { WizardStep } from "@/components/form/wizard"
import { useDictionary } from "@/components/internationalization/use-dictionary"

import { useStudentWizard } from "../use-student-wizard"
import { HealthForm } from "./form"

export default function HealthContent() {
  const params = useParams()
  const studentId = params.id as string
  const formRef = useRef<WizardFormRef>(null)
  const { data, isLoading } = useStudentWizard()
  const [isValid, setIsValid] = useState(true)

  const { dictionary } = useDictionary()
  const students = (dictionary?.school as any)?.students
  const t = students?.health as Record<string, string> | undefined

  const TAB_HEADINGS: Record<string, { title: string; description: string }> =
    useMemo(
      () => ({
        medical: {
          title: t?.title || "Medical Information",
          description:
            t?.description ||
            "Add the student's medical conditions and allergies.",
        },
        insurance: {
          title: t?.doctorInsuranceTitle || "Doctor & Insurance",
          description:
            t?.doctorInsuranceDescription ||
            "Add the student's doctor and insurance details.",
        },
      }),
      [t]
    )

  const [heading, setHeading] = useState(TAB_HEADINGS.medical)

  // Sync heading when dictionary loads or tab changes
  React.useEffect(() => {
    setHeading(TAB_HEADINGS.medical)
  }, [TAB_HEADINGS])

  const handleTabChange = (tabId: string) => {
    setHeading(TAB_HEADINGS[tabId] || TAB_HEADINGS.medical)
  }

  return (
    <WizardStep
      entityId={studentId}
      nextStep={`/students/add/${studentId}/previous-education`}
      isValid={isValid}
      formRef={formRef}
      isLoading={isLoading}
    >
      <FormLayout>
        <FormHeading title={heading.title} description={heading.description} />
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
          onTabChange={handleTabChange}
        />
      </FormLayout>
    </WizardStep>
  )
}
