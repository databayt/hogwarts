"use client"

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
                {isRTL
                  ? "يرجى مراجعة المعلومات قبل التقديم"
                  : "Please review your information before submitting"}
              </span>
            </>
          ) : (
            <>
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <span className="font-medium text-green-700 dark:text-green-300">
                {isRTL
                  ? "طلبك جاهز للتقديم"
                  : "Your application is ready to submit"}
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
                {isRTL ? "العام الدراسي:" : "Academic Year:"}{" "}
                {campaign.academicYear}
              </p>
            </div>
            {campaign.applicationFee && campaign.applicationFee > 0 && (
              <Badge variant="secondary">
                {isRTL ? "رسوم التقديم:" : "Application Fee:"} $
                {campaign.applicationFee}
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Personal Information */}
      <ReviewSection
        title={isRTL ? "المعلومات الشخصية" : "Personal Information"}
        icon={<User className="h-5 w-5" />}
        isComplete={isPersonalComplete}
      >
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
          <ReviewField
            label={isRTL ? "الاسم الأول" : "First Name"}
            value={formData.firstName}
            required
          />
          <ReviewField
            label={isRTL ? "الاسم الأوسط" : "Middle Name"}
            value={formData.middleName}
          />
          <ReviewField
            label={isRTL ? "اسم العائلة" : "Last Name"}
            value={formData.lastName}
            required
          />
          <ReviewField
            label={isRTL ? "تاريخ الميلاد" : "Date of Birth"}
            value={formData.dateOfBirth}
            required
          />
          <ReviewField
            label={isRTL ? "الجنس" : "Gender"}
            value={formatGender(formData.gender)}
            required
          />
          <ReviewField
            label={isRTL ? "الجنسية" : "Nationality"}
            value={formData.nationality}
            required
          />
          <ReviewField
            label={isRTL ? "الديانة" : "Religion"}
            value={formData.religion}
          />
          <ReviewField
            label={isRTL ? "الفئة" : "Category"}
            value={formData.category}
          />
        </div>
      </ReviewSection>

      {/* Contact Information */}
      <ReviewSection
        title={isRTL ? "معلومات الاتصال" : "Contact Information"}
        icon={<Phone className="h-5 w-5" />}
        isComplete={isContactComplete}
      >
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
          <ReviewField
            label={isRTL ? "البريد الإلكتروني" : "Email"}
            value={formData.email}
            required
          />
          <ReviewField
            label={isRTL ? "رقم الهاتف" : "Phone"}
            value={formData.phone}
            required
          />
          <ReviewField
            label={isRTL ? "هاتف بديل" : "Alternate Phone"}
            value={formData.alternatePhone}
          />
        </div>
        <Separator className="my-4" />
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
          <div className="col-span-2 md:col-span-3">
            <ReviewField
              label={isRTL ? "العنوان" : "Address"}
              value={formData.address}
              required
            />
          </div>
          <ReviewField
            label={isRTL ? "المدينة" : "City"}
            value={formData.city}
            required
          />
          <ReviewField
            label={isRTL ? "الولاية" : "State/Province"}
            value={formData.state}
            required
          />
          <ReviewField
            label={isRTL ? "الرمز البريدي" : "Postal Code"}
            value={formData.postalCode}
            required
          />
          <ReviewField
            label={isRTL ? "الدولة" : "Country"}
            value={formData.country}
            required
          />
        </div>
      </ReviewSection>

      {/* Guardian Information */}
      <ReviewSection
        title={isRTL ? "معلومات ولي الأمر" : "Guardian Information"}
        icon={<Users className="h-5 w-5" />}
        isComplete={isGuardianComplete}
      >
        <div className="space-y-4">
          <div>
            <h4 className="mb-2 font-medium">{isRTL ? "الأب" : "Father"}</h4>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <ReviewField
                label={isRTL ? "الاسم" : "Name"}
                value={formData.fatherName}
                required
              />
              <ReviewField
                label={isRTL ? "المهنة" : "Occupation"}
                value={formData.fatherOccupation}
              />
              <ReviewField
                label={isRTL ? "الهاتف" : "Phone"}
                value={formData.fatherPhone}
              />
              <ReviewField
                label={isRTL ? "البريد" : "Email"}
                value={formData.fatherEmail}
              />
            </div>
          </div>
          <Separator />
          <div>
            <h4 className="mb-2 font-medium">{isRTL ? "الأم" : "Mother"}</h4>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <ReviewField
                label={isRTL ? "الاسم" : "Name"}
                value={formData.motherName}
                required
              />
              <ReviewField
                label={isRTL ? "المهنة" : "Occupation"}
                value={formData.motherOccupation}
              />
              <ReviewField
                label={isRTL ? "الهاتف" : "Phone"}
                value={formData.motherPhone}
              />
              <ReviewField
                label={isRTL ? "البريد" : "Email"}
                value={formData.motherEmail}
              />
            </div>
          </div>
          {(formData.guardianName || formData.guardianRelation) && (
            <>
              <Separator />
              <div>
                <h4 className="mb-2 font-medium">
                  {isRTL ? "ولي الأمر الإضافي" : "Additional Guardian"}
                </h4>
                <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                  <ReviewField
                    label={isRTL ? "الاسم" : "Name"}
                    value={formData.guardianName}
                  />
                  <ReviewField
                    label={isRTL ? "صلة القرابة" : "Relationship"}
                    value={formData.guardianRelation}
                  />
                  <ReviewField
                    label={isRTL ? "الهاتف" : "Phone"}
                    value={formData.guardianPhone}
                  />
                  <ReviewField
                    label={isRTL ? "البريد" : "Email"}
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
        title={isRTL ? "المعلومات الأكاديمية" : "Academic Information"}
        icon={<GraduationCap className="h-5 w-5" />}
        isComplete={isAcademicComplete}
      >
        <div className="space-y-4">
          <div>
            <h4 className="mb-2 font-medium">
              {isRTL ? "التعليم السابق" : "Previous Education"}
            </h4>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <ReviewField
                label={isRTL ? "المدرسة" : "School"}
                value={formData.previousSchool}
              />
              <ReviewField
                label={isRTL ? "الصف" : "Class"}
                value={formData.previousClass}
              />
              <ReviewField
                label={isRTL ? "الدرجات" : "Marks"}
                value={formData.previousMarks}
              />
              <ReviewField
                label={isRTL ? "الإنجازات" : "Achievements"}
                value={formData.achievements}
              />
            </div>
          </div>
          <Separator />
          <div>
            <h4 className="mb-2 font-medium">
              {isRTL ? "التقديم لـ" : "Applying For"}
            </h4>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <ReviewField
                label={isRTL ? "الصف" : "Grade"}
                value={formData.applyingForClass}
                required
              />
              <ReviewField
                label={isRTL ? "التخصص" : "Stream"}
                value={formData.preferredStream}
              />
              <ReviewField
                label={isRTL ? "اللغة الثانية" : "Second Language"}
                value={formData.secondLanguage}
              />
              <ReviewField
                label={isRTL ? "اللغة الثالثة" : "Third Language"}
                value={formData.thirdLanguage}
              />
            </div>
          </div>
        </div>
      </ReviewSection>

      {/* Documents */}
      <ReviewSection
        title={isRTL ? "المستندات" : "Documents"}
        icon={<FileText className="h-5 w-5" />}
        isComplete={isDocumentsComplete}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
            <div className="flex flex-col">
              <span className="text-muted-foreground text-sm">
                {isRTL ? "صورة شخصية" : "Passport Photo"}
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
                  {isRTL ? "مطلوب" : "Required"}
                </span>
              )}
            </div>
            <div className="flex flex-col">
              <span className="text-muted-foreground text-sm">
                {isRTL ? "التوقيع" : "Signature"}
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
                {isRTL ? "المستندات المرفقة" : "Attached Documents"}
              </span>
              <span>
                {formData.documents?.length || 0} {isRTL ? "ملف" : "file(s)"}
              </span>
            </div>
          </div>

          {formData.documents && formData.documents.length > 0 && (
            <div className="mt-4">
              <h4 className="mb-2 text-sm font-medium">
                {isRTL ? "قائمة المستندات:" : "Document List:"}
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
            {isRTL
              ? 'بالنقر على "تقديم الطلب"، أؤكد أن جميع المعلومات المقدمة صحيحة ودقيقة. أفهم أن تقديم معلومات كاذبة قد يؤدي إلى رفض الطلب أو إلغاء القبول.'
              : 'By clicking "Submit Application", I confirm that all information provided is true and accurate. I understand that submitting false information may result in rejection of the application or cancellation of admission.'}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
