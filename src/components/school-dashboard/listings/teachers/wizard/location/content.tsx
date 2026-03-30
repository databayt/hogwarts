"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import React, { useRef, useState } from "react"
import { useParams } from "next/navigation"

import { FormHeading, FormLayout } from "@/components/form"
import type { WizardFormRef } from "@/components/form/wizard"
import { WizardStep } from "@/components/form/wizard"
import { useDictionary } from "@/components/internationalization/use-dictionary"

import { useTeacherWizard } from "../use-teacher-wizard"
import { LocationForm } from "./form"

export default function LocationContent() {
  const params = useParams()
  const teacherId = params.id as string
  const formRef = useRef<WizardFormRef>(null)
  const { data, isLoading } = useTeacherWizard()
  const { dictionary } = useDictionary()
  const teachers = (dictionary?.school as Record<string, unknown>)?.teachers as
    | Record<string, unknown>
    | undefined
  const wizard = teachers?.wizard as Record<string, unknown> | undefined
  const t = wizard?.location as Record<string, string> | undefined
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
          title={t?.title || "Location"}
          description={
            t?.description ||
            "Add the teacher's home address. This step is optional."
          }
        />
        <LocationForm
          ref={formRef}
          teacherId={teacherId}
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
