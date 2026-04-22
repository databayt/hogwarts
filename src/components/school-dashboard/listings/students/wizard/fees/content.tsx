"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import React, { useEffect, useRef, useState } from "react"
import { useParams } from "next/navigation"

import type { FeePreview } from "@/lib/fee-preview"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { FeePreviewCard } from "@/components/finance/fee-preview-card"
import { FormHeading, FormLayout } from "@/components/form"
import type { WizardFormRef } from "@/components/form/wizard"
import { WizardStep } from "@/components/form/wizard"
import { useDictionary } from "@/components/internationalization/use-dictionary"
import { useLocale } from "@/components/internationalization/use-locale"

import { useStudentWizard } from "../use-student-wizard"
import { canApplyFeeAdjustments, getStudentFeePreview } from "./actions"
import { StudentFeeAdminControls } from "./admin-controls"

export default function FeesContent() {
  const params = useParams()
  const studentId = params.id as string
  const { locale } = useLocale()
  const formRef = useRef<WizardFormRef>(null)
  const { data, isLoading } = useStudentWizard()
  const { dictionary } = useDictionary()
  const students = (dictionary?.school as Record<string, unknown> | undefined)
    ?.students as Record<string, unknown> | undefined
  const t = students?.fees as Record<string, unknown> | undefined
  const feePreviewDict = students?.feePreview as
    | Record<string, string>
    | undefined
  const adminControlsDict =
    (t?.adminControls as Record<string, string> | undefined) ?? {}
  const stepTitle = typeof t?.title === "string" ? t.title : undefined
  const stepDescription =
    typeof t?.description === "string" ? t.description : undefined
  const noGradeSelected =
    typeof t?.noGradeSelected === "string" ? t.noGradeSelected : undefined

  const [preview, setPreview] = useState<FeePreview | null>(null)
  const [loadingPreview, setLoadingPreview] = useState(false)
  const [canApply, setCanApply] = useState(false)

  const academicGradeId = data?.academicGradeId

  useEffect(() => {
    if (!academicGradeId) {
      setPreview(null)
      return
    }
    setLoadingPreview(true)
    getStudentFeePreview(academicGradeId, studentId)
      .then((res) => {
        if (res.success && res.data) setPreview(res.data)
      })
      .finally(() => setLoadingPreview(false))
  }, [academicGradeId, studentId])

  useEffect(() => {
    canApplyFeeAdjustments().then(setCanApply)
  }, [])

  // Fees step is preview-only — always valid so the admin can proceed.
  // Admin adjustments (if entered) are committed via their own save action.
  const saveStub: WizardFormRef = {
    saveAndNext: () => Promise.resolve(),
  }
  formRef.current = saveStub

  return (
    <WizardStep
      entityId={studentId}
      nextStep={`/students/add/${studentId}/contact`}
      isValid={true}
      formRef={formRef}
      isLoading={isLoading}
    >
      <FormLayout>
        <FormHeading
          title={stepTitle || "School Fees"}
          description={
            stepDescription ||
            "Fees that will be assigned to this student based on the selected grade."
          }
        />
        {!academicGradeId ? (
          <Alert>
            <AlertDescription>
              {noGradeSelected ||
                "No academic grade selected in the enrollment step. Fees cannot be previewed yet."}
            </AlertDescription>
          </Alert>
        ) : loadingPreview ? (
          <div className="space-y-3">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        ) : preview ? (
          <div className="space-y-4">
            <FeePreviewCard
              preview={preview}
              dictionary={feePreviewDict}
              locale={locale}
            />
            {canApply && preview.matched && (
              <StudentFeeAdminControls
                studentId={studentId}
                scholarships={preview.scholarships}
                currency={preview.currency}
                locale={locale}
                dictionary={adminControlsDict}
              />
            )}
          </div>
        ) : (
          <Alert>
            <AlertDescription>
              {feePreviewDict?.noFeesDescription ||
                "No fee structures configured for this grade yet."}
            </AlertDescription>
          </Alert>
        )}
      </FormLayout>
    </WizardStep>
  )
}
