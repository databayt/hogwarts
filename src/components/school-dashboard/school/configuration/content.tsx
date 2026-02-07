import {
  AlertCircle,
  Building,
  Calendar,
  CheckCircle2,
  Crown,
  DollarSign,
  MapPin,
  School,
  Settings,
  Users,
} from "lucide-react"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import type { Locale } from "@/components/internationalization/config"
import type { Dictionary } from "@/components/internationalization/dictionaries"

import { AcademicSection } from "./academic-section"
import { CapacitySection } from "./capacity-section"
import { PlanLimitsSection } from "./plan-limits-section"
import { SchoolIdentityForm } from "./school-identity-form"
import { SchoolLocationForm } from "./school-location-form"
import { SchoolPricingForm } from "./school-pricing-form"

interface Props {
  dictionary: Dictionary
  lang: Locale
}

export default async function ConfigurationContent({
  dictionary,
  lang,
}: Props) {
  const { schoolId } = await getTenantContext()

  // Get comprehensive configuration data
  let schoolInfo: {
    id: string
    name: string
    domain: string
    logoUrl: string | null
    address: string | null
    phoneNumber: string | null
    email: string | null
    website: string | null
    timezone: string
    description: string | null
    schoolType: string | null
    schoolLevel: string | null
    city: string | null
    state: string | null
    country: string | null
    planType: string
    maxStudents: number
    maxTeachers: number
    maxClasses: number
    isActive: boolean
    tuitionFee: unknown
    registrationFee: unknown
    applicationFee: unknown
    currency: string
    paymentSchedule: string
  } | null = null

  let academicYearsCount = 0
  let termsCount = 0
  let yearLevelsCount = 0
  let departmentsCount = 0
  let classroomsCount = 0
  let teachersCount = 0
  let studentsCount = 0
  let scoreRangesCount = 0
  let currentAcademicYear: {
    id: string
    yearName: string
    startDate: Date
    endDate: Date
    terms: Array<{
      id: string
      termNumber: number
      startDate: Date
      endDate: Date
    }>
  } | null = null

  if (schoolId) {
    try {
      ;[
        schoolInfo,
        academicYearsCount,
        termsCount,
        yearLevelsCount,
        departmentsCount,
        classroomsCount,
        teachersCount,
        studentsCount,
        scoreRangesCount,
        currentAcademicYear,
      ] = await Promise.all([
        db.school
          .findUnique({
            where: { id: schoolId },
            select: {
              id: true,
              name: true,
              domain: true,
              logoUrl: true,
              address: true,
              phoneNumber: true,
              email: true,
              website: true,
              timezone: true,
              description: true,
              schoolType: true,
              schoolLevel: true,
              city: true,
              state: true,
              country: true,
              planType: true,
              maxStudents: true,
              maxTeachers: true,
              maxClasses: true,
              isActive: true,
              tuitionFee: true,
              registrationFee: true,
              applicationFee: true,
              currency: true,
              paymentSchedule: true,
            },
          })
          .catch(() => null),
        db.schoolYear.count({ where: { schoolId } }).catch(() => 0),
        db.term.count({ where: { schoolId } }).catch(() => 0),
        db.yearLevel.count({ where: { schoolId } }).catch(() => 0),
        db.department.count({ where: { schoolId } }).catch(() => 0),
        db.classroom.count({ where: { schoolId } }).catch(() => 0),
        db.teacher.count({ where: { schoolId } }).catch(() => 0),
        db.student.count({ where: { schoolId } }).catch(() => 0),
        db.scoreRange.count({ where: { schoolId } }).catch(() => 0),
        db.schoolYear
          .findFirst({
            where: { schoolId },
            orderBy: { startDate: "desc" },
            include: { terms: true },
          })
          .catch(() => null),
      ])
    } catch (error) {
      console.error("Error fetching configuration data:", error)
    }
  }

  // Calculate setup completion
  const setupSteps = [
    { name: "School Profile", completed: !!schoolInfo?.name },
    { name: "Location", completed: !!schoolInfo?.address },
    { name: "Plan Setup", completed: !!schoolInfo?.planType },
    { name: "Academic Year", completed: academicYearsCount > 0 },
    { name: "Year Levels", completed: yearLevelsCount > 0 },
    { name: "Departments", completed: departmentsCount > 0 },
    { name: "Grading System", completed: scoreRangesCount > 0 },
  ]
  const completedSteps = setupSteps.filter((s) => s.completed).length
  const setupProgress = Math.round((completedSteps / setupSteps.length) * 100)

  const isArabic = lang === "ar"

  return (
    <div className="space-y-6">
      {/* Quick Stats Row */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {isArabic ? "ملف المدرسة" : "School Profile"}
            </CardTitle>
            <School className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {schoolInfo?.name
                ? isArabic
                  ? "مكتمل"
                  : "Configured"
                : isArabic
                  ? "غير محدد"
                  : "Not Set"}
            </div>
            <p className="text-muted-foreground text-xs">
              {schoolInfo?.name ||
                (isArabic
                  ? "قم بتكوين تفاصيل المدرسة"
                  : "Configure school details")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {isArabic ? "السنوات الأكاديمية" : "Academic Years"}
            </CardTitle>
            <Calendar className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{academicYearsCount}</div>
            <p className="text-muted-foreground text-xs">
              {termsCount} {isArabic ? "فصول مكونة" : "terms configured"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {isArabic ? "الأقسام" : "Departments"}
            </CardTitle>
            <Building className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{departmentsCount}</div>
            <p className="text-muted-foreground text-xs">
              {isArabic ? "أقسام أكاديمية" : "Academic departments"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {isArabic ? "الفصول" : "Classrooms"}
            </CardTitle>
            <Users className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{classroomsCount}</div>
            <p className="text-muted-foreground text-xs">
              {yearLevelsCount} {isArabic ? "مستويات سنوية" : "year levels"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Setup Progress */}
      {setupProgress < 100 && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-sm font-medium">
                <AlertCircle className="text-primary h-4 w-4" />
                {isArabic ? "أكمل إعداد مدرستك" : "Complete Your School Setup"}
              </CardTitle>
              <Badge variant="secondary">
                {completedSteps}/{setupSteps.length}{" "}
                {isArabic ? "خطوات" : "Steps"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <Progress value={setupProgress} className="h-2" />
            <div className="flex flex-wrap gap-2">
              {setupSteps.map((step, index) => (
                <Badge
                  key={index}
                  variant={step.completed ? "default" : "outline"}
                  className="gap-1"
                >
                  {step.completed ? (
                    <CheckCircle2 className="h-3 w-3" />
                  ) : (
                    <AlertCircle className="h-3 w-3" />
                  )}
                  {step.name}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* School Identity Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <School className="text-primary h-5 w-5" />
              <div>
                <CardTitle>
                  {isArabic ? "هوية المدرسة" : "School Identity"}
                </CardTitle>
                <CardDescription>
                  {isArabic
                    ? "المعلومات الأساسية عن مدرستك"
                    : "Basic information about your school"}
                </CardDescription>
              </div>
            </div>
            {schoolInfo?.name && (
              <Badge variant="outline" className="gap-1">
                <CheckCircle2 className="h-3 w-3 text-green-500" />
                {isArabic ? "مكتمل" : "Configured"}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <SchoolIdentityForm
            schoolId={schoolId || ""}
            initialData={{
              name: schoolInfo?.name || "",
              domain: schoolInfo?.domain || "",
              email: schoolInfo?.email || "",
              phoneNumber: schoolInfo?.phoneNumber || "",
              address: schoolInfo?.address || "",
              website: schoolInfo?.website || "",
              timezone: schoolInfo?.timezone || "Africa/Khartoum",
              description: schoolInfo?.description || "",
              schoolType: schoolInfo?.schoolType || "",
              schoolLevel: schoolInfo?.schoolLevel || "",
            }}
            lang={lang}
          />
        </CardContent>
      </Card>

      {/* Location Details Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-red-500" />
              <div>
                <CardTitle>
                  {isArabic ? "تفاصيل الموقع" : "Location Details"}
                </CardTitle>
                <CardDescription>
                  {isArabic
                    ? "المدينة والولاية والدولة"
                    : "City, state, and country"}
                </CardDescription>
              </div>
            </div>
            {schoolInfo?.city && (
              <Badge variant="outline" className="gap-1">
                <CheckCircle2 className="h-3 w-3 text-green-500" />
                {isArabic ? "مكتمل" : "Configured"}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <SchoolLocationForm
            schoolId={schoolId || ""}
            initialData={{
              city: schoolInfo?.city || "",
              state: schoolInfo?.state || "",
              country: schoolInfo?.country || "",
            }}
            lang={lang}
          />
        </CardContent>
      </Card>

      {/* Plan & Limits Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-yellow-500" />
              <div>
                <CardTitle>
                  {isArabic ? "الخطة والحدود" : "Plan & Limits"}
                </CardTitle>
                <CardDescription>
                  {isArabic
                    ? "خطة الاشتراك وحدود السعة"
                    : "Subscription plan and capacity limits"}
                </CardDescription>
              </div>
            </div>
            {schoolInfo?.isActive && (
              <Badge variant="default" className="gap-1">
                <CheckCircle2 className="h-3 w-3" />
                {isArabic ? "نشط" : "Active"}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <PlanLimitsSection
            schoolId={schoolId || ""}
            initialData={{
              planType:
                (schoolInfo?.planType as "basic" | "premium" | "enterprise") ||
                "basic",
              maxStudents: schoolInfo?.maxStudents || 100,
              maxTeachers: schoolInfo?.maxTeachers || 10,
              maxClasses: schoolInfo?.maxClasses || 20,
              isActive: schoolInfo?.isActive ?? true,
            }}
            currentUsage={{
              students: studentsCount,
              teachers: teachersCount,
            }}
            lang={lang}
          />
        </CardContent>
      </Card>

      {/* School Capacity Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-500" />
              <div>
                <CardTitle>
                  {isArabic ? "سعة المدرسة" : "School Capacity"}
                </CardTitle>
                <CardDescription>
                  {isArabic
                    ? "نظرة عامة على الطلاب والمعلمين والمرافق"
                    : "Students, teachers, and facilities overview"}
                </CardDescription>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <CapacitySection
            schoolId={schoolId || ""}
            initialData={{
              studentCount: studentsCount,
              teacherCount: teachersCount,
              classroomCount: classroomsCount,
              departmentCount: departmentsCount,
            }}
            limits={{
              maxStudents: schoolInfo?.maxStudents || 100,
              maxTeachers: schoolInfo?.maxTeachers || 10,
            }}
            lang={lang}
          />
        </CardContent>
      </Card>

      {/* Fees & Pricing Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-emerald-500" />
              <div>
                <CardTitle>
                  {isArabic ? "الرسوم والتسعير" : "Fees & Pricing"}
                </CardTitle>
                <CardDescription>
                  {isArabic
                    ? "رسوم التعليم والتسجيل وجدول الدفع"
                    : "Tuition, registration fees, and payment schedule"}
                </CardDescription>
              </div>
            </div>
            {schoolInfo?.tuitionFee != null && (
              <Badge variant="outline" className="gap-1">
                <CheckCircle2 className="h-3 w-3 text-green-500" />
                {isArabic ? "مكتمل" : "Configured"}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <SchoolPricingForm
            schoolId={schoolId || ""}
            initialData={{
              tuitionFee: schoolInfo?.tuitionFee
                ? Number(schoolInfo.tuitionFee)
                : null,
              registrationFee: schoolInfo?.registrationFee
                ? Number(schoolInfo.registrationFee)
                : null,
              applicationFee: schoolInfo?.applicationFee
                ? Number(schoolInfo.applicationFee)
                : null,
              currency: schoolInfo?.currency || "USD",
              paymentSchedule:
                (schoolInfo?.paymentSchedule as
                  | "monthly"
                  | "quarterly"
                  | "semester"
                  | "annual") || "annual",
            }}
            lang={lang}
          />
        </CardContent>
      </Card>

      {/* Academic Structure Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-green-500" />
              <div>
                <CardTitle>
                  {isArabic ? "الهيكل الأكاديمي" : "Academic Structure"}
                </CardTitle>
                <CardDescription>
                  {isArabic
                    ? "السنوات والفصول والدرجات والجدول"
                    : "Years, terms, grading, and schedule"}
                </CardDescription>
              </div>
            </div>
            {currentAcademicYear && (
              <Badge variant="outline" className="gap-1">
                <CheckCircle2 className="h-3 w-3 text-green-500" />
                {currentAcademicYear.yearName}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <AcademicSection
            schoolId={schoolId || ""}
            currentAcademicYear={currentAcademicYear}
            stats={{
              academicYears: academicYearsCount,
              terms: termsCount,
              yearLevels: yearLevelsCount,
              scoreRanges: scoreRangesCount,
            }}
            lang={lang}
          />
        </CardContent>
      </Card>

      {/* Quick Settings Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Settings className="text-muted-foreground h-5 w-5" />
            <div>
              <CardTitle>
                {isArabic ? "الإعدادات السريعة" : "Quick Settings"}
              </CardTitle>
              <CardDescription>
                {isArabic
                  ? "إعدادات النظام والتفضيلات"
                  : "System settings and preferences"}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="rounded-lg border p-4">
              <h4 className="text-sm font-medium">
                {isArabic ? "المنطقة الزمنية" : "Timezone"}
              </h4>
              <p className="text-muted-foreground mt-1 text-sm">
                {schoolInfo?.timezone || "Africa/Khartoum"}
              </p>
            </div>
            <div className="rounded-lg border p-4">
              <h4 className="text-sm font-medium">
                {isArabic ? "نوع الخطة" : "Plan Type"}
              </h4>
              <p className="text-muted-foreground mt-1 text-sm capitalize">
                {schoolInfo?.planType || "basic"}
              </p>
            </div>
            <div className="rounded-lg border p-4">
              <h4 className="text-sm font-medium">
                {isArabic ? "حالة المدرسة" : "School Status"}
              </h4>
              <p className="text-muted-foreground mt-1 text-sm">
                {schoolInfo?.isActive
                  ? isArabic
                    ? "نشط"
                    : "Active"
                  : isArabic
                    ? "غير نشط"
                    : "Inactive"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
