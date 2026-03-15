"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import React, { useRef, useState } from "react"
import { useParams } from "next/navigation"

import { FormHeading, FormLayout } from "@/components/form"
import type { WizardFormRef } from "@/components/form/wizard"
import { WizardStep } from "@/components/form/wizard"

import { useTeacherWizard } from "../use-teacher-wizard"
import { LocationForm } from "./form"

export default function LocationContent() {
  const params = useParams()
  const teacherId = params.id as string
  const formRef = useRef<WizardFormRef>(null)
  const { data, isLoading } = useTeacherWizard()
  const [isValid, setIsValid] = useState(true)

  return (
    <WizardStep
      entityId={teacherId}
      nextStep={`/teachers/add/${teacherId}/employment`}
      isValid={isValid}
      formRef={formRef}
      isLoading={isLoading}
    >
      <FormLayout>
        <FormHeading
          title="Location"
          description="Add the teacher's home address. This step is optional."
        />
        <LocationForm
          ref={formRef}
          teacherId={teacherId}
          initialData={
            data
              ? {
                  currentAddress: (data as any).currentAddress ?? undefined,
                  city: (data as any).city ?? undefined,
                  state: (data as any).state ?? undefined,
                  postalCode: (data as any).postalCode ?? undefined,
                  country: (data as any).country ?? undefined,
                }
              : undefined
          }
          onValidChange={setIsValid}
        />
      </FormLayout>
    </WizardStep>
  )
}
