"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { useCallback, useEffect, useRef, useState } from "react"
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
  const { dictionary } = useDictionary()
  const t = (dictionary?.school as any)?.students?.attachments as
    | Record<string, string>
    | undefined

  // Load attachment data (documents come from StudentDocument, not the wizard
  // provider). In an effect: this used to run during render behind a `loaded`
  // flag, which React 19 reports as "Cannot update a component while rendering
  // a different component" and "state update on a component that hasn't
  // mounted yet" on every wizard open.
  useEffect(() => {
    let cancelled = false
    getStudentAttachments(studentId).then((res) => {
      if (!cancelled && res.success && res.data) {
        setInitialData(res.data as unknown as Record<string, string>)
      }
    })
    return () => {
      cancelled = true
    }
  }, [studentId])

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
          title={t?.title || "Documents"}
          description={t?.description || "Upload documents to auto-fill data"}
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
