"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import React, { useRef, useState } from "react"
import { useParams } from "next/navigation"

import { FormHeading, FormLayout } from "@/components/form"
import type { WizardFormRef } from "@/components/form/wizard"
import { WizardStep } from "@/components/form/wizard"

import { useStudentWizard } from "../use-student-wizard"
import { ContactForm } from "./form"

export default function ContactContent() {
  const params = useParams()
  const studentId = params.id as string
  const formRef = useRef<WizardFormRef>(null)
  const { data, isLoading } = useStudentWizard()
  const [isValid, setIsValid] = useState(true)

  return (
    <WizardStep
      entityId={studentId}
      nextStep={`/students/add/${studentId}/emergency`}
      isValid={isValid}
      formRef={formRef}
      isLoading={isLoading}
    >
      <FormLayout>
        <FormHeading
          title="Contact Information"
          description="Add the student's contact details and address."
        />
        <ContactForm
          ref={formRef}
          studentId={studentId}
          initialData={
            data
              ? {
                  email: data.email ?? undefined,
                  mobileNumber: data.mobileNumber ?? undefined,
                  alternatePhone: data.alternatePhone ?? undefined,
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
