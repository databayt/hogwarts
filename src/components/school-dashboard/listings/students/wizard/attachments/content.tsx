"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useCallback, useRef, useState } from "react"
import { useParams } from "next/navigation"

import { FormHeading, FormLayout } from "@/components/form"
import type { WizardFormRef } from "@/components/form/wizard"
import { WizardStep } from "@/components/form/wizard"
import { useDictionary } from "@/components/internationalization/use-dictionary"

import { useStudentWizard } from "../use-student-wizard"
import { getStudentAttachments } from "./actions"
import { extractStudentAutoFill } from "./extract-action"
import type { StudentAutoFillResult } from "./extract-action"
import { AttachmentsForm } from "./form"

export default function AttachmentsContent() {
  const params = useParams()
  const studentId = params.id as string
  const formRef = useRef<WizardFormRef>(null)
  const { isLoading, updateData } = useStudentWizard()
  const [isValid, setIsValid] = useState(true)
  const [initialData, setInitialData] = useState<Record<string, string>>()
  const [loaded, setLoaded] = useState(false)
  const { dictionary } = useDictionary()
  const t = (dictionary?.school as any)?.students?.attachments as
    | Record<string, string>
    | undefined

  // Load attachment data (documents come from StudentDocument, not the wizard provider)
  if (!loaded) {
    setLoaded(true)
    getStudentAttachments(studentId).then((res) => {
      if (res.success && res.data) {
        setInitialData(res.data as unknown as Record<string, string>)
      }
    })
  }

  // AI auto-fill: fire-and-forget extraction on document upload
  const handleDocumentUploaded = useCallback(
    (slotKey: string, fileUrl: string) => {
      extractStudentAutoFill(fileUrl, slotKey).then((result) => {
        if (result.success && result.data) {
          const d = result.data as StudentAutoFillResult
          // Merge into wizard data for downstream steps to auto-fill from
          if (d.personal || d.contact || d.previousEducation) {
            updateData?.({
              autoFillResults: d,
            } as Record<string, unknown>)
          }
        }
      })
    },
    [updateData]
  )

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
          title={t?.title || "Attachments"}
          description={
            t?.description || "Upload photo and documents for the student."
          }
        />
        <AttachmentsForm
          ref={formRef}
          studentId={studentId}
          initialData={initialData}
          onValidChange={setIsValid}
          onDocumentUploaded={handleDocumentUploaded}
          dictionary={t}
        />
      </FormLayout>
    </WizardStep>
  )
}
