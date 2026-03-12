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

import { completeStudentWizard } from "../actions"
import { useStudentWizard } from "../use-student-wizard"

export default function ReviewContent() {
  const params = useParams()
  const router = useRouter()
  const studentId = params.id as string
  const formRef = useRef<WizardFormRef>(null)
  const { data, isLoading } = useStudentWizard()
  const { enableNext, disableNext, setCustomNavigation } = useWizardValidation()

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const submittingRef = useRef(false)

  const isValid = !!data?.givenName?.trim() && !!data?.surname?.trim()

  const handleComplete = useCallback(async () => {
    if (submittingRef.current) return
    submittingRef.current = true
    setIsSubmitting(true)
    setError(null)

    const result = await completeStudentWizard(studentId)

    if (result.success) {
      router.push("/students")
    } else {
      submittingRef.current = false
      setIsSubmitting(false)
      setError(result.error || "Failed to complete. Please try again.")
    }
  }, [studentId, router])

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
      entityId={studentId}
      nextStep={undefined}
      isValid={isValid}
      formRef={formRef}
      isLoading={isLoading}
      isReviewStep
    >
      <FormLayout>
        <FormHeading
          title="Review & Submit"
          description="Review the student's information before completing."
        />

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {isSubmitting && (
          <div className="flex items-center justify-center gap-2 py-4">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Completing student setup...</span>
          </div>
        )}

        {/* Personal Information */}
        {data && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Personal Information</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <ReviewField label="Given Name" value={data.givenName} />
              <ReviewField label="Middle Name" value={data.middleName} />
              <ReviewField label="Surname" value={data.surname} />
              <ReviewField
                label="Date of Birth"
                value={formatDate(data.dateOfBirth)}
              />
              <ReviewField label="Gender" value={data.gender} />
              <ReviewField label="Nationality" value={data.nationality} />
            </CardContent>
          </Card>
        )}

        {/* Contact Information */}
        {data && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <ReviewField label="Email" value={data.email} />
              <ReviewField label="Mobile Number" value={data.mobileNumber} />
              <ReviewField
                label="Alternate Phone"
                value={data.alternatePhone}
              />
              <ReviewField label="Address" value={data.currentAddress} />
              <ReviewField label="City" value={data.city} />
              <ReviewField label="State" value={data.state} />
              <ReviewField label="Postal Code" value={data.postalCode} />
              <ReviewField label="Country" value={data.country} />
            </CardContent>
          </Card>
        )}

        {/* Emergency Contact */}
        {data && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Emergency Contact</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <ReviewField
                label="Contact Name"
                value={data.emergencyContactName}
              />
              <ReviewField
                label="Contact Phone"
                value={data.emergencyContactPhone}
              />
              <ReviewField
                label="Relationship"
                value={data.emergencyContactRelation}
              />
            </CardContent>
          </Card>
        )}

        {/* Enrollment Details */}
        {data && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Enrollment Details</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <ReviewField
                label="Enrollment Date"
                value={formatDate(data.enrollmentDate)}
              />
              <ReviewField
                label="Admission Number"
                value={data.admissionNumber}
              />
              <ReviewField label="Status" value={data.status} />
              <ReviewField label="Student Type" value={data.studentType} />
              <ReviewField label="Category" value={data.category} />
            </CardContent>
          </Card>
        )}

        {/* Health Information */}
        {data && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Health Information</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <ReviewField
                label="Medical Conditions"
                value={data.medicalConditions}
              />
              <ReviewField label="Allergies" value={data.allergies} />
              <ReviewField
                label="Medication Required"
                value={data.medicationRequired}
              />
              <ReviewField label="Doctor Name" value={data.doctorName} />
              <ReviewField label="Doctor Contact" value={data.doctorContact} />
              <ReviewField
                label="Insurance Provider"
                value={data.insuranceProvider}
              />
              <ReviewField
                label="Insurance Number"
                value={data.insuranceNumber}
              />
              <ReviewField label="Blood Group" value={data.bloodGroup} />
            </CardContent>
          </Card>
        )}

        {/* Previous Education */}
        {data && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Previous Education</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <ReviewField
                label="Previous School"
                value={data.previousSchoolName}
              />
              <ReviewField
                label="School Address"
                value={data.previousSchoolAddress}
              />
              <ReviewField label="Previous Grade" value={data.previousGrade} />
              <ReviewField
                label="Transfer Certificate No."
                value={data.transferCertificateNo}
              />
              <ReviewField
                label="Transfer Date"
                value={formatDate(data.transferDate)}
              />
              <ReviewField
                label="Academic Record"
                value={data.previousAcademicRecord}
              />
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
