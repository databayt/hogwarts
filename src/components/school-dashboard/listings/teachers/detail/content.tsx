/**
 * Teacher Detail Content - Profile & Analytics View
 *
 * Comprehensive single-teacher profile with:
 * - Hero section: photo, name, employment status badge, edit button
 * - Six tabbed sections: Overview, Qualifications, Experience, Classes, Schedule, Metadata
 * - Overview: personal info (contact, dates), employment info, workload metrics
 * - Workload widget: visual indicators for teaching load (UNDERUTILIZED/NORMAL/OVERLOAD)
 * - Department/subject/class assignments displayed with badges
 * - Bilingual support: names, dates formatted based on lang parameter
 *
 * Client component because:
 * - Uses Modal context for edit form dialogs (requires hooks)
 * - Tabs and active state management are client-side
 * - Client passes data server-rendered from parent page component
 *
 * Date handling:
 * - formatDate() uses Intl.DateTimeFormat for locale-aware formatting
 * - Handles null/undefined gracefully with '-' fallback
 * - Accepts both Date objects and ISO strings from database
 *
 * Workload calculation (server-provided):
 * - totalPeriods: sum of all periods assigned to this teacher
 * - workloadStatus: computed server-side based on workloadConfig ranges
 * - classCount: number of unique classes taught
 */
"use client"

import { useState } from "react"
import {
  Award,
  BookOpen,
  Briefcase,
  Building,
  Calendar,
  Clock,
  Edit,
  GraduationCap,
  Mail,
  MoreHorizontal,
  Phone,
  Star,
  User,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useModal } from "@/components/atom/modal/context"
import Modal from "@/components/atom/modal/modal"
import type { Locale } from "@/components/internationalization/config"
import type { Dictionary } from "@/components/internationalization/dictionaries"

import { TeacherCreateForm } from "../form"

// ============================================================================
// Types
// ============================================================================

interface TeacherDetailData {
  id: string
  givenName: string
  surname: string
  gender?: string
  emailAddress: string
  birthDate?: Date | string | null
  employeeId?: string | null
  joiningDate?: Date | string | null
  employmentStatus?: string
  employmentType?: string
  contractStartDate?: Date | string | null
  contractEndDate?: Date | string | null
  profilePhotoUrl?: string | null
  createdAt: Date | string
  updatedAt: Date | string
  userId?: string | null
  user?: {
    id: string
    email: string
    image?: string | null
  } | null
  phoneNumbers?: Array<{
    id: string
    phoneNumber: string
    phoneType: string
    isPrimary: boolean
  }>
  qualifications?: Array<{
    id: string
    qualificationType: string
    name: string
    institution?: string | null
    major?: string | null
    dateObtained: Date | string
    expiryDate?: Date | string | null
    licenseNumber?: string | null
  }>
  experiences?: Array<{
    id: string
    institution: string
    position: string
    startDate: Date | string
    endDate?: Date | string | null
    isCurrent: boolean
    description?: string | null
  }>
  subjectExpertise?: Array<{
    id: string
    expertiseLevel: string
    subject?: {
      id: string
      subjectName: string
      lang?: string
    } | null
  }>
  teacherDepartments?: Array<{
    id: string
    isPrimary: boolean
    department: {
      id: string
      departmentName: string
      lang?: string
    }
  }>
  classes?: Array<{
    id: string
    className: string
    lang?: string
  }>
}

interface Props {
  teacher: TeacherDetailData
  dictionary?: Dictionary["school"]
  lang: Locale
  workload?: {
    totalPeriods: number
    classCount: number
    subjectCount: number
    workloadStatus: "UNDERUTILIZED" | "NORMAL" | "OVERLOAD"
  }
  isOwner?: boolean
}

// ============================================================================
// Helper Functions
// ============================================================================

function formatDate(
  date: Date | string | null | undefined,
  lang: Locale
): string {
  if (!date) return "-"
  return new Date(date).toLocaleDateString(lang === "ar" ? "ar-SA" : "en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

function getInitials(givenName: string, surname: string): string {
  return `${givenName.charAt(0)}${surname.charAt(0)}`.toUpperCase()
}

function getStatusColor(status?: string): string {
  switch (status) {
    case "ACTIVE":
      return "bg-green-100 text-green-800 border-green-200"
    case "ON_LEAVE":
      return "bg-yellow-100 text-yellow-800 border-yellow-200"
    case "TERMINATED":
      return "bg-red-100 text-red-800 border-red-200"
    case "RETIRED":
      return "bg-gray-100 text-gray-800 border-gray-200"
    default:
      return "bg-blue-100 text-blue-800 border-blue-200"
  }
}

function getWorkloadColor(status: string): string {
  switch (status) {
    case "UNDERUTILIZED":
      return "text-yellow-600"
    case "OVERLOAD":
      return "text-red-600"
    default:
      return "text-green-600"
  }
}

// Aggregate all teaching experience records and calculate total duration
// Handles both current positions (endDate is null -> use today) and past positions
// Returns human-readable string with years and months breakdown
function calculateExperience(
  experiences?: Array<{
    startDate: Date | string
    endDate?: Date | string | null
    isCurrent: boolean
  }>
): string {
  if (!experiences || experiences.length === 0) return "0 years"

  let totalMonths = 0
  experiences.forEach((exp) => {
    const start = new Date(exp.startDate)
    // For current positions, use today's date; for past positions, use endDate
    const end = exp.endDate ? new Date(exp.endDate) : new Date()
    totalMonths +=
      (end.getFullYear() - start.getFullYear()) * 12 +
      (end.getMonth() - start.getMonth())
  })

  const years = Math.floor(totalMonths / 12)
  const months = totalMonths % 12

  // Format with granular precision for display (years only, or years + months)
  if (years > 0 && months > 0) return `${years} years, ${months} months`
  if (years > 0) return `${years} years`
  return `${months} months`
}

// ============================================================================
// Component
// ============================================================================

export function TeacherDetailContent({
  teacher,
  dictionary,
  lang,
  workload,
  isOwner = false,
}: Props) {
  const [activeTab, setActiveTab] = useState("overview")
  const { openModal } = useModal()

  const t = {
    overview: lang === "ar" ? "نظرة عامة" : "Overview",
    qualifications: lang === "ar" ? "المؤهلات" : "Qualifications",
    experience: lang === "ar" ? "الخبرة" : "Experience",
    classes: lang === "ar" ? "الفصول" : "Classes",
    schedule: lang === "ar" ? "الجدول" : "Schedule",
    edit: lang === "ar" ? "تعديل" : "Edit",
    personalInfo: lang === "ar" ? "المعلومات الشخصية" : "Personal Information",
    contactInfo: lang === "ar" ? "معلومات الاتصال" : "Contact Information",
    employmentInfo:
      lang === "ar" ? "معلومات التوظيف" : "Employment Information",
    workload: lang === "ar" ? "عبء العمل" : "Workload",
    totalExperience: lang === "ar" ? "إجمالي الخبرة" : "Total Experience",
    primary: lang === "ar" ? "أساسي" : "Primary",
    secondary: lang === "ar" ? "ثانوي" : "Secondary",
    certified: lang === "ar" ? "معتمد" : "Certified",
    current: lang === "ar" ? "حالي" : "Current",
    noData: lang === "ar" ? "لا توجد بيانات" : "No data available",
    periodsPerWeek: lang === "ar" ? "حصص في الأسبوع" : "periods/week",
    subjects: lang === "ar" ? "المواد" : "Subjects",
    departments: lang === "ar" ? "الأقسام" : "Departments",
  }

  const fullName = `${teacher.givenName} ${teacher.surname}`

  return (
    <>
      <div className="space-y-6">
        {/* Header Section */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col gap-6 md:flex-row">
              {/* Avatar */}
              <Avatar className="h-24 w-24 md:h-32 md:w-32">
                <AvatarImage
                  src={
                    teacher.profilePhotoUrl || teacher.user?.image || undefined
                  }
                  alt={fullName}
                />
                <AvatarFallback className="bg-primary/10 text-2xl md:text-3xl">
                  {getInitials(teacher.givenName, teacher.surname)}
                </AvatarFallback>
              </Avatar>

              {/* Info */}
              <div className="flex-1 space-y-3">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <h1 className="text-2xl font-bold md:text-3xl">
                      {fullName}
                    </h1>
                    <p className="text-muted-foreground">
                      {teacher.emailAddress}
                    </p>
                    {teacher.employeeId && (
                      <p className="text-muted-foreground text-sm">
                        ID: {teacher.employeeId}
                      </p>
                    )}
                  </div>
                  {isOwner && (
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openModal(teacher.id)}
                      >
                        <Edit className="me-2 h-4 w-4" />
                        {t.edit}
                      </Button>
                    </div>
                  )}
                </div>

                {/* Status badges */}
                <div className="flex flex-wrap gap-2">
                  <Badge className={getStatusColor(teacher.employmentStatus)}>
                    {teacher.employmentStatus || "ACTIVE"}
                  </Badge>
                  <Badge variant="outline">
                    {teacher.employmentType?.replace("_", " ") || "FULL TIME"}
                  </Badge>
                  {teacher.userId && (
                    <Badge variant="secondary">
                      <User className="me-1 h-3 w-3" />
                      {lang === "ar" ? "حساب نشط" : "Has Account"}
                    </Badge>
                  )}
                </div>

                {/* Quick stats */}
                <div className="flex flex-wrap gap-4 text-sm">
                  {teacher.teacherDepartments &&
                    teacher.teacherDepartments.length > 0 && (
                      <div className="text-muted-foreground flex items-center gap-1">
                        <Building className="h-4 w-4" />
                        <span>
                          {teacher.teacherDepartments
                            .map((d) => d.department.departmentName)
                            .join(", ")}
                        </span>
                      </div>
                    )}
                  {workload && (
                    <div
                      className={cn(
                        "flex items-center gap-1",
                        getWorkloadColor(workload.workloadStatus)
                      )}
                    >
                      <Clock className="h-4 w-4" />
                      <span>
                        {workload.totalPeriods} {t.periodsPerWeek}
                      </span>
                    </div>
                  )}
                  {teacher.experiences && teacher.experiences.length > 0 && (
                    <div className="text-muted-foreground flex items-center gap-1">
                      <Briefcase className="h-4 w-4" />
                      <span>
                        {calculateExperience(teacher.experiences)}{" "}
                        {t.totalExperience}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">{t.overview}</TabsTrigger>
            <TabsTrigger value="qualifications">{t.qualifications}</TabsTrigger>
            <TabsTrigger value="experience">{t.experience}</TabsTrigger>
            <TabsTrigger value="classes">{t.classes}</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {/* Personal Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <User className="h-5 w-5" />
                    {t.personalInfo}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">
                        {lang === "ar" ? "الجنس" : "Gender"}
                      </p>
                      <p className="font-medium">{teacher.gender || "-"}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">
                        {lang === "ar" ? "تاريخ الميلاد" : "Birth Date"}
                      </p>
                      <p className="font-medium">
                        {formatDate(teacher.birthDate, lang)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Contact Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Phone className="h-5 w-5" />
                    {t.contactInfo}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="text-muted-foreground h-4 w-4" />
                    <span>{teacher.emailAddress}</span>
                  </div>
                  {teacher.phoneNumbers && teacher.phoneNumbers.length > 0 ? (
                    teacher.phoneNumbers.map((phone) => (
                      <div
                        key={phone.id}
                        className="flex items-center gap-2 text-sm"
                      >
                        <Phone className="text-muted-foreground h-4 w-4" />
                        <span>{phone.phoneNumber}</span>
                        <Badge variant="outline" className="text-xs">
                          {phone.phoneType}
                        </Badge>
                        {phone.isPrimary && (
                          <Badge variant="secondary" className="text-xs">
                            {t.primary}
                          </Badge>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="text-muted-foreground text-sm">{t.noData}</p>
                  )}
                </CardContent>
              </Card>

              {/* Employment Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Briefcase className="h-5 w-5" />
                    {t.employmentInfo}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">
                        {lang === "ar" ? "تاريخ الانضمام" : "Joining Date"}
                      </p>
                      <p className="font-medium">
                        {formatDate(teacher.joiningDate, lang)}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">
                        {lang === "ar" ? "نوع التوظيف" : "Employment Type"}
                      </p>
                      <p className="font-medium">
                        {teacher.employmentType?.replace("_", " ") || "-"}
                      </p>
                    </div>
                    {teacher.contractStartDate && (
                      <>
                        <div>
                          <p className="text-muted-foreground">
                            {lang === "ar" ? "بداية العقد" : "Contract Start"}
                          </p>
                          <p className="font-medium">
                            {formatDate(teacher.contractStartDate, lang)}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">
                            {lang === "ar" ? "نهاية العقد" : "Contract End"}
                          </p>
                          <p className="font-medium">
                            {formatDate(teacher.contractEndDate, lang)}
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Workload */}
              {workload && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Clock className="h-5 w-5" />
                      {t.workload}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <p className="text-2xl font-bold">
                          {workload.totalPeriods}
                        </p>
                        <p className="text-muted-foreground text-xs">
                          {t.periodsPerWeek}
                        </p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold">
                          {workload.classCount}
                        </p>
                        <p className="text-muted-foreground text-xs">
                          {t.classes}
                        </p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold">
                          {workload.subjectCount}
                        </p>
                        <p className="text-muted-foreground text-xs">
                          {t.subjects}
                        </p>
                      </div>
                    </div>
                    <Badge
                      className={cn(
                        "w-full justify-center",
                        getWorkloadColor(workload.workloadStatus)
                      )}
                    >
                      {workload.workloadStatus}
                    </Badge>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Subject Expertise */}
            {teacher.subjectExpertise &&
              teacher.subjectExpertise.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <BookOpen className="h-5 w-5" />
                      {t.subjects}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {teacher.subjectExpertise.map((expertise) => (
                        <Badge
                          key={expertise.id}
                          variant={
                            expertise.expertiseLevel === "PRIMARY"
                              ? "default"
                              : "outline"
                          }
                          className="gap-1"
                        >
                          {expertise.expertiseLevel === "PRIMARY" && (
                            <Star className="h-3 w-3" />
                          )}
                          {expertise.expertiseLevel === "CERTIFIED" && (
                            <Award className="h-3 w-3" />
                          )}
                          {expertise.subject?.subjectName}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
          </TabsContent>

          {/* Qualifications Tab */}
          <TabsContent value="qualifications" className="space-y-4">
            {teacher.qualifications && teacher.qualifications.length > 0 ? (
              teacher.qualifications.map((qual) => (
                <Card key={qual.id}>
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        {qual.qualificationType === "DEGREE" && (
                          <GraduationCap className="text-primary h-5 w-5" />
                        )}
                        {qual.qualificationType === "CERTIFICATION" && (
                          <Award className="h-5 w-5 text-blue-500" />
                        )}
                        {qual.qualificationType === "LICENSE" && (
                          <Briefcase className="h-5 w-5 text-green-500" />
                        )}
                        <div>
                          <CardTitle className="text-base">
                            {qual.name}
                          </CardTitle>
                          {qual.institution && (
                            <CardDescription>
                              {qual.institution}
                            </CardDescription>
                          )}
                        </div>
                      </div>
                      <Badge variant="outline">{qual.qualificationType}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    {qual.major && (
                      <p>
                        <span className="text-muted-foreground">
                          {lang === "ar" ? "التخصص:" : "Major:"}
                        </span>{" "}
                        {qual.major}
                      </p>
                    )}
                    <p>
                      <span className="text-muted-foreground">
                        {lang === "ar" ? "تاريخ الحصول:" : "Obtained:"}
                      </span>{" "}
                      {formatDate(qual.dateObtained, lang)}
                    </p>
                    {qual.expiryDate && (
                      <p
                        className={
                          new Date(qual.expiryDate) < new Date()
                            ? "text-destructive"
                            : ""
                        }
                      >
                        <span className="text-muted-foreground">
                          {lang === "ar" ? "ينتهي:" : "Expires:"}
                        </span>{" "}
                        {formatDate(qual.expiryDate, lang)}
                      </p>
                    )}
                    {qual.licenseNumber && (
                      <p>
                        <span className="text-muted-foreground">
                          {lang === "ar" ? "رقم الرخصة:" : "License #:"}
                        </span>{" "}
                        {qual.licenseNumber}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="text-muted-foreground py-8 text-center">
                  <GraduationCap className="mx-auto mb-2 h-12 w-12 opacity-50" />
                  <p>{t.noData}</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Experience Tab */}
          <TabsContent value="experience" className="space-y-4">
            {teacher.experiences && teacher.experiences.length > 0 ? (
              teacher.experiences.map((exp, index) => (
                <Card key={exp.id}>
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className="bg-primary/10 mt-0.5 rounded-full p-2">
                          <Briefcase className="text-primary h-4 w-4" />
                        </div>
                        <div>
                          <CardTitle className="text-base">
                            {exp.position}
                          </CardTitle>
                          <CardDescription className="flex items-center gap-1">
                            <Building className="h-3 w-3" />
                            {exp.institution}
                          </CardDescription>
                        </div>
                      </div>
                      {exp.isCurrent && (
                        <Badge variant="default">{t.current}</Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2 ps-14 text-sm">
                    <p className="text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDate(exp.startDate, lang)} -{" "}
                      {exp.isCurrent
                        ? lang === "ar"
                          ? "حتى الآن"
                          : "Present"
                        : formatDate(exp.endDate, lang)}
                    </p>
                    {exp.description && (
                      <p className="text-sm">{exp.description}</p>
                    )}
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="text-muted-foreground py-8 text-center">
                  <Briefcase className="mx-auto mb-2 h-12 w-12 opacity-50" />
                  <p>{t.noData}</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Classes Tab */}
          <TabsContent value="classes" className="space-y-4">
            {teacher.classes && teacher.classes.length > 0 ? (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {teacher.classes.map((cls) => (
                  <Card
                    key={cls.id}
                    className="hover:border-primary/50 transition-colors"
                  >
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-base">
                        <BookOpen className="h-4 w-4" />
                        {cls.className}
                      </CardTitle>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="text-muted-foreground py-8 text-center">
                  <BookOpen className="mx-auto mb-2 h-12 w-12 opacity-50" />
                  <p>{t.noData}</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Edit Modal */}
      <Modal content={<TeacherCreateForm />} />
    </>
  )
}

export default TeacherDetailContent
