"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { FormHeading } from "@/components/form"
import { useWizardValidation } from "@/components/form/template/wizard-validation-context"
import { useDictionary } from "@/components/internationalization/use-dictionary"
import { useLocale } from "@/components/internationalization/use-locale"

import { submitInternalOnboarding } from "../actions"
import { getStepMeta } from "../config"
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
  const { dictionary } = useDictionary()

  const d = dictionary?.school?.onboarding?.internalJoin
  const rv = d?.review
  const meta = useMemo(() => getStepMeta(d).review, [d])

  const { state, schoolId } = useOnboarding()
  const { enableNext, disableNext, setCustomNavigation } = useWizardValidation()

  const [agreed, setAgreed] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const submittingRef = useRef(false)

  const { personal, contact, roleDetails } = state.formData

  const handleSubmit = useCallback(async () => {
    if (!personal || !contact || !roleDetails || !state.role) return
    if (submittingRef.current) return

    submittingRef.current = true
    setIsSubmitting(true)
    setError(null)

    const result = await submitInternalOnboarding(schoolId, {
      role: state.role,
      personal: personal as PersonalStepData,
      contact: contact as ContactStepData,
      roleDetails,
      documents: state.formData.documents,
    })

    if (result.success) {
      // Clear localStorage draft
      try {
        localStorage.removeItem(`internal_onboarding_draft_${schoolId}`)
      } catch {
        // Ignore
      }
      const ref = result.data?.userId?.slice(-8).toUpperCase() || ""
      const name = encodeURIComponent(
        `${personal.firstName} ${personal.lastName}`
      )
      const role = encodeURIComponent(state.role)
      const phone = contact.phone ? encodeURIComponent(contact.phone) : ""
      const params = new URLSearchParams({ ref, name, role })
      if (phone) params.set("phone", phone)
      router.push(`/${locale}/internal-onboarding/welcome?${params.toString()}`)
    } else {
      submittingRef.current = false
      setIsSubmitting(false)
      setError(
        result.error ||
          (rv?.submitFailed ?? "Failed to submit. Please try again.")
      )
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
    rv,
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
          <span>{rv?.submitting ?? "Submitting your application..."}</span>
        </div>
      )}

      {/* Role */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{rv?.role ?? "Role"}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="capitalize">{state.role}</p>
        </CardContent>
      </Card>

      {/* Personal Information */}
      {personal && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {rv?.personalInfo ?? "Personal Information"}
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <ReviewField
              label={rv?.firstName ?? "First Name"}
              value={personal.firstName}
            />
            <ReviewField
              label={rv?.middleName ?? "Middle Name"}
              value={personal.middleName}
            />
            <ReviewField
              label={rv?.lastName ?? "Last Name"}
              value={personal.lastName}
            />
            <ReviewField
              label={rv?.dateOfBirth ?? "Date of Birth"}
              value={personal.dateOfBirth}
            />
            <ReviewField
              label={rv?.gender ?? "Gender"}
              value={personal.gender}
            />
            <ReviewField
              label={rv?.nationality ?? "Nationality"}
              value={personal.nationality}
            />
          </CardContent>
        </Card>
      )}

      {/* Contact Information */}
      {contact && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {rv?.contactInfo ?? "Contact Information"}
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <ReviewField label={rv?.email ?? "Email"} value={contact.email} />
            <ReviewField label={rv?.phone ?? "Phone"} value={contact.phone} />
            <ReviewField
              label={rv?.address ?? "Address"}
              value={contact.address}
            />
            <ReviewField label={rv?.city ?? "City"} value={contact.city} />
            <ReviewField label={rv?.state ?? "State"} value={contact.state} />
            <ReviewField
              label={rv?.country ?? "Country"}
              value={contact.country}
            />
          </CardContent>
        </Card>
      )}

      {/* Role-Specific Details */}
      {roleDetails && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {rv?.roleDetailsTitle ?? "Role Details"}
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            {state.role === "teacher" && (
              <TeacherReview data={roleDetails as TeacherDetailsData} rv={rv} />
            )}
            {state.role === "staff" && (
              <StaffReview data={roleDetails as StaffDetailsData} rv={rv} />
            )}
            {state.role === "admin" && (
              <AdminReview data={roleDetails as AdminDetailsData} rv={rv} />
            )}
            {state.role === "student" && (
              <StudentReview data={roleDetails as StudentDetailsData} rv={rv} />
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
          {rv?.termsLabel ??
            "I confirm that all information provided is true and accurate. I understand that my account will require admin approval before I can access the school platform."}
        </Label>
      </div>
    </div>
  )
}

// =============================================================================
// REVIEW SUB-COMPONENTS
// =============================================================================

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ReviewDict = any

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

function TeacherReview({
  data,
  rv,
}: {
  data: TeacherDetailsData
  rv?: ReviewDict
}) {
  return (
    <>
      <ReviewField
        label={rv?.subjects ?? "Subjects"}
        value={data.subjects?.join(", ")}
      />
      <ReviewField
        label={rv?.yearsOfExperience ?? "Years of Experience"}
        value={data.yearsOfExperience}
      />
      <ReviewField
        label={rv?.employmentType ?? "Employment Type"}
        value={data.employmentType}
      />
      <ReviewField
        label={rv?.qualification ?? "Qualification"}
        value={data.qualificationName}
      />
      <ReviewField
        label={rv?.institution ?? "Institution"}
        value={data.qualificationInstitution}
      />
    </>
  )
}

function StaffReview({
  data,
  rv,
}: {
  data: StaffDetailsData
  rv?: ReviewDict
}) {
  return (
    <>
      <ReviewField label={rv?.position ?? "Position"} value={data.position} />
      <ReviewField
        label={rv?.employmentType ?? "Employment Type"}
        value={data.employmentType}
      />
      <ReviewField
        label={rv?.qualification ?? "Qualification"}
        value={data.qualificationName}
      />
      <ReviewField
        label={rv?.institution ?? "Institution"}
        value={data.qualificationInstitution}
      />
    </>
  )
}

function AdminReview({
  data,
  rv,
}: {
  data: AdminDetailsData
  rv?: ReviewDict
}) {
  return (
    <>
      <ReviewField label={rv?.position ?? "Position"} value={data.position} />
      <ReviewField
        label={rv?.administrativeArea ?? "Administrative Area"}
        value={data.administrativeArea}
      />
    </>
  )
}

function StudentReview({
  data,
  rv,
}: {
  data: StudentDetailsData
  rv?: ReviewDict
}) {
  return (
    <>
      <ReviewField
        label={rv?.gradeLevel ?? "Grade Level"}
        value={data.gradeLevel}
      />
      <ReviewField
        label={rv?.studentType ?? "Student Type"}
        value={data.studentType}
      />
      <ReviewField
        label={rv?.previousSchool ?? "Previous School"}
        value={data.previousSchool}
      />
      <ReviewField
        label={rv?.previousGrade ?? "Previous Grade"}
        value={data.previousGrade}
      />
    </>
  )
}
