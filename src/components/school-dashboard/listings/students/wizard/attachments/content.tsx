"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useRef, useState } from "react"
import { useParams } from "next/navigation"

import { FormHeading, FormLayout } from "@/components/form"
import type { WizardFormRef } from "@/components/form/wizard"
import { WizardStep } from "@/components/form/wizard"

import { useStudentWizard } from "../use-student-wizard"
import { getStudentAttachments } from "./actions"
import { AttachmentsForm } from "./form"

export default function AttachmentsContent() {
  const params = useParams()
  const studentId = params.id as string
  const formRef = useRef<WizardFormRef>(null)
  const { isLoading } = useStudentWizard()
  const [isValid, setIsValid] = useState(true)
  const [initialData, setInitialData] = useState<Record<string, string>>()
  const [loaded, setLoaded] = useState(false)

  // Load attachment data (documents come from StudentDocument, not the wizard provider)
  if (!loaded) {
    setLoaded(true)
    getStudentAttachments(studentId).then((res) => {
      if (res.success && res.data) {
        setInitialData(res.data as unknown as Record<string, string>)
      }
    })
  }

  return (
    <WizardStep
      entityId={studentId}
      nextStep={`/students/add/${studentId}/personal`}
      isValid={isValid}
      formRef={formRef}
      isLoading={isLoading}
    >
      <FormLayout>
        <FormHeading
          title="Attachments"
          description="Upload photo and documents for the student."
        />
        <AttachmentsForm
          ref={formRef}
          studentId={studentId}
          initialData={initialData}
          onValidChange={setIsValid}
        />
      </FormLayout>
    </WizardStep>
  )
}
