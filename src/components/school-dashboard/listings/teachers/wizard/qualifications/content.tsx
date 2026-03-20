"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import React, { useRef, useState } from "react"
import { useParams } from "next/navigation"

import { FormHeading, FormLayout } from "@/components/form"
import type { WizardFormRef } from "@/components/form/wizard"
import { WizardStep } from "@/components/form/wizard"

import { useTeacherWizard } from "../use-teacher-wizard"
import { QualificationsForm } from "./form"

export default function QualificationsContent() {
  const params = useParams()
  const teacherId = params.id as string
  const formRef = useRef<WizardFormRef>(null)
  const { data, isLoading } = useTeacherWizard()
  const [isValid, setIsValid] = useState(true) // optional step

  return (
    <WizardStep
      entityId={teacherId}
      nextStep={`/teachers/add/${teacherId}/experience`}
      isValid={isValid}
      formRef={formRef}
      isLoading={isLoading}
    >
      <FormLayout>
        <FormHeading
          title="Qualifications"
          description="Add degrees, certifications, and licenses. This step is optional."
        />
        <QualificationsForm
          ref={formRef}
          teacherId={teacherId}
          initialData={
            data
              ? {
                  degrees:
                    data.qualifications.find(
                      (q) => q.qualificationType === "DEGREE"
                    )?.documentUrl ?? "",
                  certifications:
                    data.qualifications.find(
                      (q) => q.qualificationType === "CERTIFICATION"
                    )?.documentUrl ?? "",
                  licenses:
                    data.qualifications.find(
                      (q) => q.qualificationType === "LICENSE"
                    )?.documentUrl ?? "",
                  cv: "",
                  id: "",
                  other: "",
                }
              : undefined
          }
          onValidChange={setIsValid}
        />
      </FormLayout>
    </WizardStep>
  )
}
