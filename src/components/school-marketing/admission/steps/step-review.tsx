"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import {
  AlertCircle,
  CheckCircle2,
  FileText,
  GraduationCap,
  Phone,
  User,
  Users,
} from "lucide-react"
import { useFormContext } from "react-hook-form"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import type { Locale } from "@/components/internationalization/config"
import type { Dictionary } from "@/components/internationalization/dictionaries"

import type { ApplicationFormData, PublicCampaign } from "../types"

interface Props {
  dictionary: Dictionary
  lang: Locale
  campaign: PublicCampaign
}

interface ReviewSectionProps {
  title: string
  icon: React.ReactNode
  children: React.ReactNode
  isComplete?: boolean
}

function ReviewSection({
  title,
  icon,
  children,
  isComplete = true,
}: ReviewSectionProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-lg">
          <div className="flex items-center gap-2">
            {icon}
            {title}
          </div>
          {isComplete ? (
            <CheckCircle2 className="h-5 w-5 text-green-500" />
          ) : (
            <AlertCircle className="h-5 w-5 text-amber-500" />
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  )
}

interface ReviewFieldProps {
  label: string
  value?: string | null
  required?: boolean
}

function ReviewField({ label, value, required }: ReviewFieldProps) {
  const isEmpty = !value || value.trim() === ""

  return (
    <div className="flex flex-col">
      <span className="text-muted-foreground text-sm">{label}</span>
      <span className={isEmpty && required ? "text-amber-500" : ""}>
        {isEmpty ? (required ? "Required" : "-") : value}
      </span>
    </div>
  )
}

export default function StepReview({ dictionary, lang, campaign }: Props) {
  const { watch, formState } = useFormContext<ApplicationFormData>()
  const formData = watch()
  const isRTL = lang === "ar"
  const { errors } = formState

  const dict =
    (
      dictionary as unknown as {
        school?: { admission?: { formSteps?: Record<string, string> } }
      }
    )?.school?.admission?.formSteps ?? {}

  // Check section completeness
  const isPersonalComplete = !!(
    formData.firstName &&
    formData.lastName &&
    formData.dateOfBirth &&
    formData.gender &&
    formData.nationality
  )
  const isContactComplete = !!(
    formData.email &&
    formData.phone &&
    formData.address &&
    formData.city &&
    formData.state &&
    formData.postalCode
  )
  const isGuardianComplete = !!(formData.fatherName && formData.motherName)
  const isAcademicComplete = !!formData.applyingForClass
  const isDocumentsComplete = !!formData.photoUrl

  const hasErrors = Object.keys(errors).length > 0

  const formatGender = (gender?: string) => {
    if (!gender) return "-"
    if (isRTL) {
      return gender === "MALE" ? "ذكر" : "أنثى"
    }
    return gender === "MALE" ? "Male" : "Female"
  }

  return (
    <div className="space-y-6">
      {/* Summary Banner */}
      <div
        className={`rounded-lg border p-4 ${hasErrors ? "border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20" : "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20"}`}
      >
        <div className="flex items-center gap-2">
          {hasErrors ? (
            <>
              <AlertCircle className="h-5 w-5 text-amber-500" />
              <span className="font-medium text-amber-700 dark:text-amber-300">
                {dict.reviewBeforeSubmit ||
                  "Please review your information before submitting"}
              </span>
            </>
          ) : (
            <>
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <span className="font-medium text-green-700 dark:text-green-300">
                {dict.readyToSubmit || "Your application is ready to submit"}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Campaign Info */}
      <Card className="bg-muted/50">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold">{campaign.name}</h3>
              <p className="text-muted-foreground text-sm">
                {dict.academicYear || "Academic Year:"} {campaign.academicYear}
              </p>
            </div>
            {campaign.applicationFee && campaign.applicationFee > 0 && (
              <Badge variant="secondary">
                {dict.applicationFee || "Application Fee:"} $
                {campaign.applicationFee}
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Personal Information */}
      <ReviewSection
        title={dict.personalInformation || "Personal Information"}
        icon={<User className="h-5 w-5" />}
        isComplete={isPersonalComplete}
      >
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
          <ReviewField
            label={dict.firstName || "First Name"}
            value={formData.firstName}
            required
          />
          <ReviewField
            label={dict.middleName || "Middle Name"}
            value={formData.middleName}
          />
          <ReviewField
            label={dict.lastName || "Last Name"}
            value={formData.lastName}
            required
          />
          <ReviewField
            label={dict.dateOfBirth || "Date of Birth"}
            value={formData.dateOfBirth}
            required
          />
          <ReviewField
            label={dict.gender || "Gender"}
            value={formatGender(formData.gender)}
            required
          />
          <ReviewField
            label={dict.nationality || "Nationality"}
            value={formData.nationality}
            required
          />
          <ReviewField
            label={dict.religion || "Religion"}
            value={formData.religion}
          />
          <ReviewField
            label={dict.category || "Category"}
            value={formData.category}
          />
        </div>
      </ReviewSection>

      {/* Contact Information */}
      <ReviewSection
        title={dict.contactInformation || "Contact Information"}
        icon={<Phone className="h-5 w-5" />}
        isComplete={isContactComplete}
      >
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
          <ReviewField
            label={dict.emailAddress || "Email"}
            value={formData.email}
            required
          />
          <ReviewField
            label={dict.phone || "Phone"}
            value={formData.phone}
            required
          />
          <ReviewField
            label={dict.alternatePhone || "Alternate Phone"}
            value={formData.alternatePhone}
          />
        </div>
        <Separator className="my-4" />
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
          <div className="col-span-2 md:col-span-3">
            <ReviewField
              label={dict.address || "Address"}
              value={formData.address}
              required
            />
          </div>
          <ReviewField
            label={dict.city || "City"}
            value={formData.city}
            required
          />
          <ReviewField
            label={dict.stateProvince || "State/Province"}
            value={formData.state}
            required
          />
          <ReviewField
            label={dict.postalCode || "Postal Code"}
            value={formData.postalCode}
            required
          />
          <ReviewField
            label={dict.country || "Country"}
            value={formData.country}
            required
          />
        </div>
      </ReviewSection>

      {/* Guardian Information */}
      <ReviewSection
        title={dict.guardianInformation || "Guardian Information"}
        icon={<Users className="h-5 w-5" />}
        isComplete={isGuardianComplete}
      >
        <div className="space-y-4">
          <div>
            <h4 className="mb-2 font-medium">{dict.father || "Father"}</h4>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <ReviewField
                label={dict.name || "Name"}
                value={formData.fatherName}
                required
              />
              <ReviewField
                label={dict.occupation || "Occupation"}
                value={formData.fatherOccupation}
              />
              <ReviewField
                label={dict.phone || "Phone"}
                value={formData.fatherPhone}
              />
              <ReviewField
                label={dict.emailLabel || "Email"}
                value={formData.fatherEmail}
              />
            </div>
          </div>
          <Separator />
          <div>
            <h4 className="mb-2 font-medium">{dict.mother || "Mother"}</h4>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <ReviewField
                label={dict.name || "Name"}
                value={formData.motherName}
                required
              />
              <ReviewField
                label={dict.occupation || "Occupation"}
                value={formData.motherOccupation}
              />
              <ReviewField
                label={dict.phone || "Phone"}
                value={formData.motherPhone}
              />
              <ReviewField
                label={dict.emailLabel || "Email"}
                value={formData.motherEmail}
              />
            </div>
          </div>
          {(formData.guardianName || formData.guardianRelation) && (
            <>
              <Separator />
              <div>
                <h4 className="mb-2 font-medium">
                  {dict.additionalGuardian || "Additional Guardian"}
                </h4>
                <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                  <ReviewField
                    label={dict.name || "Name"}
                    value={formData.guardianName}
                  />
                  <ReviewField
                    label={dict.relationship || "Relationship"}
                    value={formData.guardianRelation}
                  />
                  <ReviewField
                    label={dict.phone || "Phone"}
                    value={formData.guardianPhone}
                  />
                  <ReviewField
                    label={dict.emailLabel || "Email"}
                    value={formData.guardianEmail}
                  />
                </div>
              </div>
            </>
          )}
        </div>
      </ReviewSection>

      {/* Academic Information */}
      <ReviewSection
        title={dict.academicInformation || "Academic Information"}
        icon={<GraduationCap className="h-5 w-5" />}
        isComplete={isAcademicComplete}
      >
        <div className="space-y-4">
          <div>
            <h4 className="mb-2 font-medium">
              {dict.previousEducation || "Previous Education"}
            </h4>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <ReviewField
                label={dict.school || "School"}
                value={formData.previousSchool}
              />
              <ReviewField
                label={dict.class || "Class"}
                value={formData.previousClass}
              />
              <ReviewField
                label={dict.marks || "Marks"}
                value={formData.previousMarks}
              />
              <ReviewField
                label={dict.achievements || "Achievements"}
                value={formData.achievements}
              />
            </div>
          </div>
          <Separator />
          <div>
            <h4 className="mb-2 font-medium">
              {dict.applyingFor || "Applying For"}
            </h4>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <ReviewField
                label={dict.grade || "Grade"}
                value={formData.applyingForClass}
                required
              />
              <ReviewField
                label={dict.stream || "Stream"}
                value={formData.preferredStream}
              />
              <ReviewField
                label={dict.secondLanguage || "Second Language"}
                value={formData.secondLanguage}
              />
              <ReviewField
                label={dict.thirdLanguage || "Third Language"}
                value={formData.thirdLanguage}
              />
            </div>
          </div>
        </div>
      </ReviewSection>

      {/* Documents */}
      <ReviewSection
        title={dict.documents || "Documents"}
        icon={<FileText className="h-5 w-5" />}
        isComplete={isDocumentsComplete}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
            <div className="flex flex-col">
              <span className="text-muted-foreground text-sm">
                {dict.passportPhoto || "Passport Photo"}
              </span>
              {formData.photoUrl ? (
                <div className="mt-1">
                  <img
                    src={formData.photoUrl}
                    alt="Photo"
                    className="h-20 w-20 rounded object-cover"
                  />
                </div>
              ) : (
                <span className="text-amber-500">
                  {dict.required || "Required"}
                </span>
              )}
            </div>
            <div className="flex flex-col">
              <span className="text-muted-foreground text-sm">
                {dict.signature || "Signature"}
              </span>
              {formData.signatureUrl ? (
                <div className="mt-1">
                  <img
                    src={formData.signatureUrl}
                    alt="Signature"
                    className="h-10 w-20 object-contain"
                  />
                </div>
              ) : (
                <span className="text-muted-foreground">-</span>
              )}
            </div>
            <div className="flex flex-col">
              <span className="text-muted-foreground text-sm">
                {dict.attachedDocuments || "Attached Documents"}
              </span>
              <span>
                {formData.documents?.length || 0} {dict.files || "file(s)"}
              </span>
            </div>
          </div>

          {formData.documents && formData.documents.length > 0 && (
            <div className="mt-4">
              <h4 className="mb-2 text-sm font-medium">
                {dict.documentList || "Document List:"}
              </h4>
              <ul className="space-y-1">
                {formData.documents.map((doc, index) => (
                  <li key={index} className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    {doc.name}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </ReviewSection>

      {/* Declaration */}
      <Card className="border-primary">
        <CardContent className="pt-6">
          <p className="text-muted-foreground text-sm">
            {dict.declaration ||
              'By clicking "Submit Application", I confirm that all information provided is true and accurate. I understand that submitting false information may result in rejection of the application or cancellation of admission.'}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
