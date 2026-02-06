"use client"

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
    const campaignId = params.campaignId as string
    const { locale: lang } = useLocale()
    const isRTL = lang === "ar"
    const { session, campaign } = useApplySession()

    const dict = ((dictionary as Record<string, Record<string, string>> | null)
      ?.apply?.review ?? {}) as Record<string, string>

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

      if (!result.success) {
        throw new Error(result.error || "Failed to submit application")
      }

      onSuccess?.(result.data?.applicationNumber || "")
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
                {dict.applyingFor || (isRTL ? "التقديم لـ" : "Applying For")}
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
              {dict.personalInfo ||
                (isRTL ? "المعلومات الشخصية" : "Personal Information")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {renderField(
              isRTL ? "الاسم الكامل" : "Full Name",
              [personal?.firstName, personal?.middleName, personal?.lastName]
                .filter(Boolean)
                .join(" ")
            )}
            {renderField(
              isRTL ? "تاريخ الميلاد" : "Date of Birth",
              personal?.dateOfBirth
            )}
            {renderField(isRTL ? "الجنس" : "Gender", personal?.gender)}
            {renderField(
              isRTL ? "الجنسية" : "Nationality",
              personal?.nationality
            )}
            {personal?.religion &&
              renderField(isRTL ? "الديانة" : "Religion", personal.religion)}
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Phone className="text-primary h-5 w-5" />
              {dict.contactInfo ||
                (isRTL ? "معلومات الاتصال" : "Contact Information")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {renderField(isRTL ? "البريد الإلكتروني" : "Email", contact?.email)}
            {renderField(isRTL ? "الهاتف" : "Phone", contact?.phone)}
            {contact?.alternatePhone &&
              renderField(
                isRTL ? "هاتف بديل" : "Alternate Phone",
                contact.alternatePhone
              )}
            <Separator className="my-2" />
            {renderField(isRTL ? "العنوان" : "Address", contact?.address)}
            {renderField(isRTL ? "المدينة" : "City", contact?.city)}
            {renderField(isRTL ? "الولاية" : "State", contact?.state)}
            {renderField(isRTL ? "الدولة" : "Country", contact?.country)}
          </CardContent>
        </Card>

        {/* Guardian Information */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Users className="text-primary h-5 w-5" />
              {dict.guardianInfo ||
                (isRTL ? "معلومات ولي الأمر" : "Guardian Information")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-muted-foreground mb-2 text-sm font-medium">
                {isRTL ? "الأب" : "Father"}
              </p>
              {renderField(isRTL ? "الاسم" : "Name", guardian?.fatherName)}
              {guardian?.fatherOccupation &&
                renderField(
                  isRTL ? "المهنة" : "Occupation",
                  guardian.fatherOccupation
                )}
              {guardian?.fatherPhone &&
                renderField(isRTL ? "الهاتف" : "Phone", guardian.fatherPhone)}
            </div>
            <Separator />
            <div>
              <p className="text-muted-foreground mb-2 text-sm font-medium">
                {isRTL ? "الأم" : "Mother"}
              </p>
              {renderField(isRTL ? "الاسم" : "Name", guardian?.motherName)}
              {guardian?.motherOccupation &&
                renderField(
                  isRTL ? "المهنة" : "Occupation",
                  guardian.motherOccupation
                )}
              {guardian?.motherPhone &&
                renderField(isRTL ? "الهاتف" : "Phone", guardian.motherPhone)}
            </div>
          </CardContent>
        </Card>

        {/* Academic Information */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Icons.graduationCap className="text-primary h-5 w-5" />
              {dict.academicInfo ||
                (isRTL ? "المعلومات الأكاديمية" : "Academic Information")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {renderField(
              isRTL ? "الصف المتقدم إليه" : "Applying for Class",
              academic?.applyingForClass
            )}
            {academic?.previousSchool &&
              renderField(
                isRTL ? "المدرسة السابقة" : "Previous School",
                academic.previousSchool
              )}
            {academic?.previousClass &&
              renderField(
                isRTL ? "الصف السابق" : "Previous Class",
                academic.previousClass
              )}
            {academic?.preferredStream &&
              renderField(
                isRTL ? "المسار" : "Stream",
                academic.preferredStream
              )}
          </CardContent>
        </Card>

        {/* Documents */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Icons.fileText className="text-primary h-5 w-5" />
              {dict.documents || (isRTL ? "المستندات" : "Documents")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {documents?.photoUrl && (
                <Badge variant="secondary">
                  {isRTL ? "الصورة الشخصية" : "Photo"} ✓
                </Badge>
              )}
              {documents?.signatureUrl && (
                <Badge variant="secondary">
                  {isRTL ? "التوقيع" : "Signature"} ✓
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
                    {dict.noDocuments ||
                      (isRTL ? "لم يتم رفع مستندات" : "No documents uploaded")}
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
