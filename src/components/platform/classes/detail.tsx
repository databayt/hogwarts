"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import {
  CircleAlert,
  ArrowLeft,
  Users,
  GraduationCap,
  BookOpen,
  Building,
  Calendar,
  Clock,
  User,
  School,
  UserCog,
} from "lucide-react"
import type { Locale } from "@/components/internationalization/config"
import type { Dictionary } from "@/components/internationalization/dictionaries"
import type { ClassDetailResult, ClassTeacherRow } from "./actions"
import { SubjectTeachers } from "./subject-teachers"

interface ClassDetailContentProps {
  classData: ClassDetailResult | null
  error?: string | null
  dictionary: Dictionary
  lang: Locale
  initialSubjectTeachers?: ClassTeacherRow[]
}

export function ClassDetailContent({
  classData,
  error,
  dictionary,
  lang,
  initialSubjectTeachers = [],
}: ClassDetailContentProps) {
  const router = useRouter()
  const isRTL = lang === "ar"

  const t = {
    back: isRTL ? "رجوع" : "Back",
    classDetails: isRTL ? "تفاصيل الفصل" : "Class Details",
    overview: isRTL ? "نظرة عامة" : "Overview",
    students: isRTL ? "الطلاب" : "Students",
    information: isRTL ? "المعلومات" : "Information",
    enrolledStudents: isRTL ? "الطلاب المسجلين" : "Enrolled Students",
    noStudents: isRTL ? "لا يوجد طلاب مسجلين" : "No students enrolled",
    subject: isRTL ? "المادة" : "Subject",
    teacher: isRTL ? "المعلم" : "Teacher",
    term: isRTL ? "الفصل الدراسي" : "Term",
    classroom: isRTL ? "الفصل" : "Classroom",
    courseCode: isRTL ? "رمز المقرر" : "Course Code",
    credits: isRTL ? "الساعات المعتمدة" : "Credits",
    capacity: isRTL ? "السعة" : "Capacity",
    evaluationType: isRTL ? "نوع التقييم" : "Evaluation Type",
    createdAt: isRTL ? "تاريخ الإنشاء" : "Created",
    viewProfile: isRTL ? "عرض الملف الشخصي" : "View Profile",
    viewGrades: isRTL ? "عرض الدرجات" : "View Grades",
    viewAttendance: isRTL ? "عرض الحضور" : "View Attendance",
    unknown: isRTL ? "غير محدد" : "Unknown",
    errorTitle: isRTL ? "خطأ" : "Error",
    errorLoading: isRTL ? "فشل تحميل بيانات الفصل" : "Failed to load class data",
    notFound: isRTL ? "الفصل غير موجود" : "Class not found",
    enrolledAt: isRTL ? "تاريخ التسجيل" : "Enrolled",
    subjectTeachers: isRTL ? "معلمو المادة" : "Subject Teachers",
  }

  // Error state
  if (error || !classData) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t.back}
        </Button>
        <Alert variant="destructive">
          <CircleAlert className="h-4 w-4" />
          <AlertTitle>{t.errorTitle}</AlertTitle>
          <AlertDescription>
            {error || t.notFound}
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  const teacherName = classData.teacher
    ? `${classData.teacher.givenName} ${classData.teacher.surname}`
    : t.unknown

  const subjectName = isRTL
    ? classData.subject?.subjectNameAr || classData.subject?.subjectName || t.unknown
    : classData.subject?.subjectName || t.unknown

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-semibold">
              {isRTL && classData.nameAr ? classData.nameAr : classData.name}
            </h1>
            {classData.courseCode && (
              <p className="text-sm text-muted-foreground">{classData.courseCode}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline">
            <Users className="mr-1 h-3 w-3" />
            {classData._count.studentClasses}/{classData.maxCapacity || 50}
          </Badge>
          <Badge variant="secondary">{classData.evaluationType}</Badge>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">{t.overview}</TabsTrigger>
          <TabsTrigger value="students">
            {t.students} ({classData._count.studentClasses})
          </TabsTrigger>
          <TabsTrigger value="subject-teachers">
            <UserCog className="mr-1 h-4 w-4" />
            {t.subjectTeachers}
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {/* Subject Card */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">{t.subject}</CardTitle>
                <BookOpen className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-lg font-semibold">{subjectName}</div>
              </CardContent>
            </Card>

            {/* Teacher Card */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">{t.teacher}</CardTitle>
                <User className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-lg font-semibold">{teacherName}</div>
                {classData.teacher?.userId && (
                  <Link
                    href={`/${lang}/profile/${classData.teacher.userId}`}
                    className="text-xs text-muted-foreground hover:underline"
                  >
                    {t.viewProfile}
                  </Link>
                )}
              </CardContent>
            </Card>

            {/* Term Card */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">{t.term}</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-lg font-semibold">
                  {classData.term?.termName || `Term ${classData.term?.termNumber}` || t.unknown}
                </div>
              </CardContent>
            </Card>

            {/* Classroom Card */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">{t.classroom}</CardTitle>
                <Building className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-lg font-semibold">
                  {classData.classroom?.roomName || t.unknown}
                </div>
                {classData.classroom?.capacity && (
                  <p className="text-xs text-muted-foreground">
                    {t.capacity}: {classData.classroom.capacity}
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Details Card */}
          <Card>
            <CardHeader>
              <CardTitle>{t.information}</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {classData.credits && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{t.credits}</p>
                  <p className="text-lg">{classData.credits}</p>
                </div>
              )}
              <div>
                <p className="text-sm font-medium text-muted-foreground">{t.capacity}</p>
                <p className="text-lg">
                  {classData.minCapacity || 0} - {classData.maxCapacity || 50}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">{t.evaluationType}</p>
                <p className="text-lg">{classData.evaluationType}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">{t.createdAt}</p>
                <p className="text-lg">
                  {new Date(classData.createdAt).toLocaleDateString(isRTL ? "ar-SA" : "en-US")}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <div className="grid gap-4 md:grid-cols-3">
            <Link href={`/${lang}/students?classId=${classData.id}`}>
              <Card className="cursor-pointer hover:bg-accent/50 transition-colors h-full">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">{t.enrolledStudents}</CardTitle>
                  <School className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{classData._count.studentClasses}</div>
                </CardContent>
              </Card>
            </Link>

            <Link href={`/${lang}/grades?classId=${classData.id}`}>
              <Card className="cursor-pointer hover:bg-accent/50 transition-colors h-full">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">{t.viewGrades}</CardTitle>
                  <GraduationCap className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-muted-foreground">
                    {isRTL ? "اضغط لعرض الدرجات" : "Click to view grades"}
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href={`/${lang}/attendance?classId=${classData.id}`}>
              <Card className="cursor-pointer hover:bg-accent/50 transition-colors h-full">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">{t.viewAttendance}</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-muted-foreground">
                    {isRTL ? "اضغط لعرض الحضور" : "Click to view attendance"}
                  </div>
                </CardContent>
              </Card>
            </Link>
          </div>
        </TabsContent>

        {/* Students Tab */}
        <TabsContent value="students" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t.enrolledStudents}</CardTitle>
              <CardDescription>
                {classData._count.studentClasses} / {classData.maxCapacity || 50} {t.students.toLowerCase()}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {classData.enrolledStudents.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t.noStudents}</p>
              ) : (
                <div className="space-y-4">
                  {classData.enrolledStudents.map((enrollment) => (
                    <div
                      key={enrollment.id}
                      className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarFallback>
                            {enrollment.student.givenName[0]}
                            {enrollment.student.surname[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">
                            {enrollment.student.givenName} {enrollment.student.surname}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {t.enrolledAt}:{" "}
                            {new Date(enrollment.enrolledAt).toLocaleDateString(
                              isRTL ? "ar-SA" : "en-US"
                            )}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {enrollment.student.userId && (
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={`/${lang}/profile/${enrollment.student.userId}`}>
                              <User className="mr-1 h-3 w-3" />
                              {t.viewProfile}
                            </Link>
                          </Button>
                        )}
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/${lang}/grades?studentId=${enrollment.student.id}`}>
                            <GraduationCap className="mr-1 h-3 w-3" />
                            {t.viewGrades}
                          </Link>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Subject Teachers Tab */}
        <TabsContent value="subject-teachers" className="space-y-4">
          <SubjectTeachers
            classId={classData.id}
            lang={lang}
            initialTeachers={initialSubjectTeachers}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}

export function ClassDetailLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Skeleton className="h-10 w-10 rounded" />
        <div className="space-y-2">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-24" />
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
      <Skeleton className="h-64" />
    </div>
  )
}
