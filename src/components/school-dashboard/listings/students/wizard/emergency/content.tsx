"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import React, { useRef, useState } from "react"
import { useParams } from "next/navigation"

import { FormHeading, FormLayout } from "@/components/form"
import type { WizardFormRef } from "@/components/form/wizard"
import { WizardStep } from "@/components/form/wizard"

import { useStudentWizard } from "../use-student-wizard"
import { EmergencyForm } from "./form"

export default function EmergencyContent() {
  const params = useParams()
  const studentId = params.id as string
  const formRef = useRef<WizardFormRef>(null)
  const { data, isLoading } = useStudentWizard()
  const [isValid, setIsValid] = useState(true)

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
          title="Emergency Contact"
          description="Add emergency contact information for the student."
        />
        <EmergencyForm
          ref={formRef}
          studentId={studentId}
          initialData={
            data
              ? {
                  emergencyContactName: data.emergencyContactName ?? undefined,
                  emergencyContactPhone:
                    data.emergencyContactPhone ?? undefined,
                  emergencyContactRelation:
                    data.emergencyContactRelation ?? undefined,
                }
              : undefined
          }
          onValidChange={setIsValid}
        />
      </FormLayout>
    </WizardStep>
  )
}
