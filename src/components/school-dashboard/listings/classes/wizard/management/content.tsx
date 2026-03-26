"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import React, { useCallback, useEffect, useRef, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FormHeading, FormLayout } from "@/components/form"
import { useWizardValidation } from "@/components/form/template/wizard-validation-context"
import type { WizardFormRef } from "@/components/form/wizard"
import { WizardStep } from "@/components/form/wizard"
import { useDictionary } from "@/components/internationalization/use-dictionary"

import { completeClassWizard } from "../actions"
import { useClassWizard } from "../use-class-wizard"
import { ManagementForm } from "./form"

export default function ManagementContent() {
  const params = useParams()
  const router = useRouter()
  const classId = params.id as string
  const formRef = useRef<WizardFormRef>(null)
  const { data, isLoading } = useClassWizard()
  const { enableNext, disableNext, setCustomNavigation } = useWizardValidation()
  const { dictionary } = useDictionary()
  const d = dictionary?.school?.classes?.wizard?.management

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const submittingRef = useRef(false)

  const isValid = !!data?.name?.trim() && !data.name.startsWith("Draft-")

  const handleComplete = useCallback(async () => {
    if (submittingRef.current) return
    submittingRef.current = true
    setIsSubmitting(true)
    setError(null)

    // Save management data first
    if (formRef.current) {
      try {
        await formRef.current.saveAndNext()
      } catch {
        submittingRef.current = false
        setIsSubmitting(false)
        return
      }
    }

    const result = await completeClassWizard(classId)

    if (result.success) {
      router.push("/classes")
    } else {
      submittingRef.current = false
      setIsSubmitting(false)
      setError(result.error || "Failed to complete. Please try again.")
    }
  }, [classId, router])

  useEffect(() => {
    if (isValid && !isSubmitting) {
      enableNext()
      setCustomNavigation({ onNext: handleComplete })
    } else {
      disableNext()
      setCustomNavigation(undefined)
    }
  }, [
    isValid,
    isSubmitting,
    enableNext,
    disableNext,
    setCustomNavigation,
    handleComplete,
  ])

  return (
    <WizardStep
      entityId={classId}
      nextStep={undefined}
      isValid={isValid}
      formRef={formRef}
      isLoading={isLoading}
      isReviewStep
    >
      <FormLayout>
        <FormHeading
          title={d?.title || "Management & Review"}
          description={
            d?.description ||
            "Set capacity and prerequisites, then review the class details."
          }
        />

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {isSubmitting && (
          <div className="flex items-center justify-center gap-2 py-4">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>{d?.completingSetup || "Completing class setup..."}</span>
          </div>
        )}

        {/* Management Form */}
        <ManagementForm
          ref={formRef}
          classId={classId}
          initialData={
            data
              ? {
                  credits: data.credits ?? undefined,
                  minCapacity: data.minCapacity ?? undefined,
                  maxCapacity: data.maxCapacity ?? undefined,
                  prerequisiteId: data.prerequisiteId ?? undefined,
                }
              : undefined
          }
        />

        {/* Review Summary */}
        {data && (
          <>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  {d?.reviewClassInfo || "Class Information"}
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <ReviewField
                  label={d?.reviewClassName || "Class Name"}
                  value={data.name}
                />
                <ReviewField
                  label={d?.reviewSubject || "Subject"}
                  value={data.subject?.name}
                />
                <ReviewField
                  label={d?.reviewTeacher || "Teacher"}
                  value={
                    data.teacher
                      ? `${data.teacher.firstName} ${data.teacher.lastName}`
                      : null
                  }
                />
                <ReviewField
                  label={d?.reviewGrade || "Grade"}
                  value={data.grade?.name}
                />
                <ReviewField
                  label={d?.reviewCourseCode || "Course Code"}
                  value={data.courseCode}
                />
                <ReviewField
                  label={d?.reviewEvaluationType || "Evaluation Type"}
                  value={data.evaluationType}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  {d?.reviewSchedule || "Schedule"}
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <ReviewField
                  label={d?.reviewTerm || "Term"}
                  value={data.term?.name}
                />
                <ReviewField
                  label={d?.reviewStartPeriod || "Start Period"}
                  value={data.startPeriod?.name}
                />
                <ReviewField
                  label={d?.reviewEndPeriod || "End Period"}
                  value={data.endPeriod?.name}
                />
                <ReviewField
                  label={d?.reviewClassroom || "Classroom"}
                  value={data.classroom?.name}
                />
                <ReviewField
                  label={d?.reviewDuration || "Duration"}
                  value={
                    data.duration
                      ? `${data.duration} ${d?.weeksUnit || "weeks"}`
                      : null
                  }
                />
              </CardContent>
            </Card>
          </>
        )}
      </FormLayout>
    </WizardStep>
  )
}

function ReviewField({
  label,
  value,
}: {
  label: string
  value?: string | number | null
}) {
  if (!value) return null
  return (
    <div>
      <p className="text-muted-foreground text-xs">{label}</p>
      <p className="text-sm font-medium">{String(value)}</p>
    </div>
  )
}
