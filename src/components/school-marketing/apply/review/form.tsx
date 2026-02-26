"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import React, { forwardRef, useImperativeHandle } from "react"
import { useParams } from "next/navigation"
import { Phone, User, Users } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Icons } from "@/components/icons"
import { useLocale } from "@/components/internationalization/use-locale"

import { useApplySession } from "../application-context"
import { submitApplicationAction } from "./actions"
import type { ReviewFormProps, ReviewFormRef } from "./types"

export const ReviewForm = forwardRef<ReviewFormRef, ReviewFormProps>(
  ({ onSuccess, dictionary }, ref) => {
    const params = useParams()
    const subdomain = params.subdomain as string
    const campaignId = params.id as string
    const { locale: lang } = useLocale()
    const isRTL = lang === "ar"
    const { session, campaign } = useApplySession()

    const dict = ((dictionary as Record<string, Record<string, string>> | null)
      ?.apply?.review ?? {}) as Record<string, string>

    const formDict =
      (
        dictionary as unknown as {
          school?: { admission?: { formSteps?: Record<string, string> } }
        }
      )?.school?.admission?.formSteps ?? {}

    const { personal, contact, guardian, academic, documents } =
      session.formData

    const submitApplication = async () => {
      if (!session.sessionToken) {
        throw new Error("No session token")
      }

      // Build complete form data
      const formData = {
        campaignId,
        ...personal,
        ...contact,
        ...guardian,
        ...academic,
        ...documents,
      }

      const result = await submitApplicationAction(
        subdomain,
        session.sessionToken,
        formData
      )

      if (!result.success || !result.data) {
        throw new Error(result.error || "Failed to submit application")
      }

      onSuccess?.(result.data)
    }

    useImperativeHandle(ref, () => ({ submitApplication }))

    const renderField = (label: string, value?: string) => {
      if (!value) return null
      return (
        <div className="flex justify-between py-2">
          <span className="text-muted-foreground">{label}</span>
          <span className="font-medium">{value}</span>
        </div>
      )
    }

    return (
      <div className="space-y-6">
        {/* Campaign Info */}
        {campaign && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Icons.checkCircle className="text-primary h-5 w-5" />
                {dict.applyingFor || "Applying For"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{campaign.name}</p>
                  <p className="text-muted-foreground text-sm">
                    {campaign.academicYear}
                  </p>
                </div>
                <Badge variant="secondary">
                  {academic?.applyingForClass || "N/A"}
                </Badge>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Personal Information */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <User className="text-primary h-5 w-5" />
              {dict.personalInfo || "Personal Information"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {renderField(
              formDict.name || "Full Name",
              [personal?.firstName, personal?.middleName, personal?.lastName]
                .filter(Boolean)
                .join(" ")
            )}
            {renderField(
              formDict.dateOfBirth || "Date of Birth",
              personal?.dateOfBirth
            )}
            {renderField(formDict.gender || "Gender", personal?.gender)}
            {renderField(
              formDict.nationality || "Nationality",
              personal?.nationality
            )}
            {personal?.religion &&
              renderField(formDict.religion || "Religion", personal.religion)}
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Phone className="text-primary h-5 w-5" />
              {dict.contactInfo || "Contact Information"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {renderField(formDict.emailAddress || "Email", contact?.email)}
            {renderField(formDict.phone || "Phone", contact?.phone)}
            {contact?.alternatePhone &&
              renderField(
                formDict.alternatePhone || "Alternate Phone",
                contact.alternatePhone
              )}
            <Separator className="my-2" />
            {renderField(formDict.address || "Address", contact?.address)}
            {renderField(formDict.city || "City", contact?.city)}
            {renderField(formDict.stateProvince || "State", contact?.state)}
            {renderField(formDict.country || "Country", contact?.country)}
          </CardContent>
        </Card>

        {/* Guardian Information */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Users className="text-primary h-5 w-5" />
              {dict.guardianInfo || "Guardian Information"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-muted-foreground mb-2 text-sm font-medium">
                {formDict.father || "Father"}
              </p>
              {renderField(formDict.name || "Name", guardian?.fatherName)}
              {guardian?.fatherOccupation &&
                renderField(
                  formDict.occupation || "Occupation",
                  guardian.fatherOccupation
                )}
              {guardian?.fatherPhone &&
                renderField(formDict.phone || "Phone", guardian.fatherPhone)}
            </div>
            <Separator />
            <div>
              <p className="text-muted-foreground mb-2 text-sm font-medium">
                {formDict.mother || "Mother"}
              </p>
              {renderField(formDict.name || "Name", guardian?.motherName)}
              {guardian?.motherOccupation &&
                renderField(
                  formDict.occupation || "Occupation",
                  guardian.motherOccupation
                )}
              {guardian?.motherPhone &&
                renderField(formDict.phone || "Phone", guardian.motherPhone)}
            </div>
          </CardContent>
        </Card>

        {/* Academic Information */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Icons.graduationCap className="text-primary h-5 w-5" />
              {dict.academicInfo || "Academic Information"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {renderField(
              formDict.gradeApplyingFor || "Applying for Class",
              academic?.applyingForClass
            )}
            {academic?.previousSchool &&
              renderField(
                formDict.previousSchool || "Previous School",
                academic.previousSchool
              )}
            {academic?.previousClass &&
              renderField(
                formDict.previousClass || "Previous Class",
                academic.previousClass
              )}
            {academic?.preferredStream &&
              renderField(
                formDict.stream || "Stream",
                academic.preferredStream
              )}
          </CardContent>
        </Card>

        {/* Documents */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Icons.fileText className="text-primary h-5 w-5" />
              {dict.documents || "Documents"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {documents?.photoUrl && (
                <Badge variant="secondary">
                  {formDict.passportPhoto || "Photo"} ✓
                </Badge>
              )}
              {documents?.signatureUrl && (
                <Badge variant="secondary">
                  {formDict.signature || "Signature"} ✓
                </Badge>
              )}
              {documents?.documents?.map((doc, i) => (
                <Badge key={i} variant="secondary">
                  {doc.name} ✓
                </Badge>
              ))}
              {!documents?.photoUrl &&
                !documents?.signatureUrl &&
                (!documents?.documents || documents.documents.length === 0) && (
                  <span className="text-muted-foreground text-sm">
                    {dict.noDocuments || "No documents uploaded"}
                  </span>
                )}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }
)

ReviewForm.displayName = "ReviewForm"
