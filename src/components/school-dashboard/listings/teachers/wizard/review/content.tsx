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

import { completeTeacherWizard } from "../actions"
import { useTeacherWizard } from "../use-teacher-wizard"

export default function ReviewContent() {
  const params = useParams()
  const router = useRouter()
  const teacherId = params.id as string
  const formRef = useRef<WizardFormRef>(null)
  const { data, isLoading } = useTeacherWizard()
  const { enableNext, disableNext, setCustomNavigation } = useWizardValidation()

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const submittingRef = useRef(false)

  const isValid =
    !!data?.givenName?.trim() &&
    !!data?.surname?.trim() &&
    !!data?.emailAddress &&
    !data.emailAddress.endsWith("@draft.internal")

  const handleComplete = useCallback(async () => {
    if (submittingRef.current) return
    submittingRef.current = true
    setIsSubmitting(true)
    setError(null)

    const result = await completeTeacherWizard(teacherId)

    if (result.success) {
      router.push("/teachers")
    } else {
      submittingRef.current = false
      setIsSubmitting(false)
      setError(result.error || "Failed to complete. Please try again.")
    }
  }, [teacherId, router])

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

  const formatDate = (date: Date | null | undefined) => {
    if (!date) return null
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  return (
    <WizardStep
      entityId={teacherId}
      nextStep={undefined}
      isValid={isValid}
      formRef={formRef}
      isLoading={isLoading}
      isReviewStep
    >
      <FormLayout>
        <FormHeading
          title="Review & Submit"
          description="Review the teacher's information before completing."
        />

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {isSubmitting && (
          <div className="flex items-center justify-center gap-2 py-4">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Completing teacher setup...</span>
          </div>
        )}

        {/* Personal Information */}
        {data && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Personal Information</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <ReviewField label="First Name" value={data.givenName} />
              <ReviewField label="Last Name" value={data.surname} />
              <ReviewField label="Gender" value={data.gender} />
              <ReviewField
                label="Date of Birth"
                value={formatDate(data.birthDate)}
              />
            </CardContent>
          </Card>
        )}

        {/* Contact Information */}
        {data && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Contact Details</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <ReviewField label="Email" value={data.emailAddress} />
              {data.phoneNumbers.map((phone, i) => (
                <ReviewField
                  key={phone.id || i}
                  label={`${phone.phoneType}${phone.isPrimary ? " (Primary)" : ""}`}
                  value={phone.phoneNumber}
                />
              ))}
            </CardContent>
          </Card>
        )}

        {/* Employment Details */}
        {data && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Employment Details</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <ReviewField label="Employee ID" value={data.employeeId} />
              <ReviewField label="Status" value={data.employmentStatus} />
              <ReviewField label="Type" value={data.employmentType} />
              <ReviewField
                label="Joining Date"
                value={formatDate(data.joiningDate)}
              />
              <ReviewField
                label="Contract Start"
                value={formatDate(data.contractStartDate)}
              />
              <ReviewField
                label="Contract End"
                value={formatDate(data.contractEndDate)}
              />
            </CardContent>
          </Card>
        )}

        {/* Qualifications */}
        {data && data.qualifications.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Qualifications</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {data.qualifications.map((q) => (
                <div
                  key={q.id}
                  className="border-b pb-3 last:border-0 last:pb-0"
                >
                  <p className="font-medium">{q.name}</p>
                  <div className="text-muted-foreground grid grid-cols-2 gap-2 text-sm">
                    <span>Type: {q.qualificationType}</span>
                    {q.institution && <span>Institution: {q.institution}</span>}
                    {q.major && <span>Major: {q.major}</span>}
                    {q.dateObtained && (
                      <span>Obtained: {formatDate(q.dateObtained)}</span>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Experience */}
        {data && data.experiences.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Experience</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {data.experiences.map((exp) => (
                <div
                  key={exp.id}
                  className="border-b pb-3 last:border-0 last:pb-0"
                >
                  <p className="font-medium">
                    {exp.position} at {exp.institution}
                  </p>
                  <div className="text-muted-foreground text-sm">
                    <span>
                      {formatDate(exp.startDate)} &ndash;{" "}
                      {exp.isCurrent ? "Present" : formatDate(exp.endDate)}
                    </span>
                    {exp.description && (
                      <p className="mt-1">{exp.description}</p>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Subject Expertise */}
        {data && data.subjectExpertise.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Subject Expertise</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {data.subjectExpertise.map((e) => (
                <div
                  key={e.id}
                  className="border-b pb-3 last:border-0 last:pb-0"
                >
                  <p className="font-medium">{e.subject.subjectName}</p>
                  <p className="text-muted-foreground text-sm capitalize">
                    {e.expertiseLevel.toLowerCase().replace("_", " ")}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
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
