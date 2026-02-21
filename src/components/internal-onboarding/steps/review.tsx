"use client"

import React, { useCallback, useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { FormHeading } from "@/components/form"
import { useWizardValidation } from "@/components/form/template/wizard-validation-context"
import { useLocale } from "@/components/internationalization/use-locale"

import { submitInternalOnboarding } from "../actions"
import { STEP_META } from "../config"
import type {
  AdminDetailsData,
  ContactStepData,
  PersonalStepData,
  StaffDetailsData,
  StudentDetailsData,
  TeacherDetailsData,
} from "../types"
import { useOnboarding } from "../use-onboarding"

export function ReviewStep() {
  const router = useRouter()
  const params = useParams()
  const { locale } = useLocale()
  const subdomain = params.subdomain as string

  const { state, schoolId } = useOnboarding()
  const { enableNext, disableNext, setCustomNavigation } = useWizardValidation()

  const [agreed, setAgreed] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { personal, contact, roleDetails } = state.formData

  const handleSubmit = useCallback(async () => {
    if (!personal || !contact || !roleDetails || !state.role) return

    setIsSubmitting(true)
    setError(null)

    const result = await submitInternalOnboarding(schoolId, {
      role: state.role,
      personal: personal as PersonalStepData,
      contact: contact as ContactStepData,
      roleDetails,
      documents: state.formData.documents,
    })

    setIsSubmitting(false)

    if (result.success) {
      // Clear localStorage draft
      try {
        localStorage.removeItem(`internal_onboarding_draft_${schoolId}`)
      } catch {
        // Ignore
      }
      router.push(`/${locale}/s/${subdomain}/join/welcome`)
    } else {
      setError(result.error || "Failed to submit. Please try again.")
    }
  }, [
    personal,
    contact,
    roleDetails,
    state.role,
    state.formData.documents,
    schoolId,
    locale,
    subdomain,
    router,
  ])

  useEffect(() => {
    const hasRequiredData = personal && contact && roleDetails && state.role

    if (hasRequiredData && agreed && !isSubmitting) {
      enableNext()
      setCustomNavigation({ onNext: handleSubmit })
    } else {
      disableNext()
      setCustomNavigation(undefined)
    }
  }, [
    personal,
    contact,
    roleDetails,
    state.role,
    agreed,
    isSubmitting,
    enableNext,
    disableNext,
    setCustomNavigation,
    handleSubmit,
  ])

  const meta = STEP_META.review

  return (
    <div className="space-y-8">
      <FormHeading title={meta.title} description={meta.description} />

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {isSubmitting && (
        <div className="flex items-center justify-center gap-2 py-4">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Submitting your application...</span>
        </div>
      )}

      {/* Role */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Role</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="capitalize">{state.role}</p>
        </CardContent>
      </Card>

      {/* Personal Information */}
      {personal && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Personal Information</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <ReviewField label="First Name" value={personal.givenName} />
            <ReviewField label="Middle Name" value={personal.middleName} />
            <ReviewField label="Last Name" value={personal.surname} />
            <ReviewField label="Date of Birth" value={personal.dateOfBirth} />
            <ReviewField label="Gender" value={personal.gender} />
            <ReviewField label="Nationality" value={personal.nationality} />
          </CardContent>
        </Card>
      )}

      {/* Contact Information */}
      {contact && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <ReviewField label="Email" value={contact.email} />
            <ReviewField label="Phone" value={contact.phone} />
            <ReviewField label="Address" value={contact.address} />
            <ReviewField label="City" value={contact.city} />
            <ReviewField label="State" value={contact.state} />
            <ReviewField label="Country" value={contact.country} />
          </CardContent>
        </Card>
      )}

      {/* Role-Specific Details */}
      {roleDetails && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Role Details</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            {state.role === "teacher" && (
              <TeacherReview data={roleDetails as TeacherDetailsData} />
            )}
            {state.role === "staff" && (
              <StaffReview data={roleDetails as StaffDetailsData} />
            )}
            {state.role === "admin" && (
              <AdminReview data={roleDetails as AdminDetailsData} />
            )}
            {state.role === "student" && (
              <StudentReview data={roleDetails as StudentDetailsData} />
            )}
          </CardContent>
        </Card>
      )}

      {/* Terms */}
      <div className="flex items-start gap-3 rounded-lg border p-4">
        <Checkbox
          id="agree"
          checked={agreed}
          onCheckedChange={(checked) => setAgreed(checked === true)}
        />
        <Label htmlFor="agree" className="text-sm leading-relaxed">
          I confirm that all information provided is true and accurate. I
          understand that my account will require admin approval before I can
          access the school platform.
        </Label>
      </div>
    </div>
  )
}

// =============================================================================
// REVIEW SUB-COMPONENTS
// =============================================================================

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

function TeacherReview({ data }: { data: TeacherDetailsData }) {
  return (
    <>
      <ReviewField label="Subjects" value={data.subjects?.join(", ")} />
      <ReviewField label="Years of Experience" value={data.yearsOfExperience} />
      <ReviewField label="Employment Type" value={data.employmentType} />
      <ReviewField label="Qualification" value={data.qualificationName} />
      <ReviewField label="Institution" value={data.qualificationInstitution} />
    </>
  )
}

function StaffReview({ data }: { data: StaffDetailsData }) {
  return (
    <>
      <ReviewField label="Position" value={data.position} />
      <ReviewField label="Employment Type" value={data.employmentType} />
      <ReviewField label="Qualification" value={data.qualificationName} />
      <ReviewField label="Institution" value={data.qualificationInstitution} />
    </>
  )
}

function AdminReview({ data }: { data: AdminDetailsData }) {
  return (
    <>
      <ReviewField label="Position" value={data.position} />
      <ReviewField
        label="Administrative Area"
        value={data.administrativeArea}
      />
    </>
  )
}

function StudentReview({ data }: { data: StudentDetailsData }) {
  return (
    <>
      <ReviewField label="Grade Level" value={data.gradeLevel} />
      <ReviewField label="Student Type" value={data.studentType} />
      <ReviewField label="Previous School" value={data.previousSchool} />
      <ReviewField label="Previous Grade" value={data.previousGrade} />
    </>
  )
}
