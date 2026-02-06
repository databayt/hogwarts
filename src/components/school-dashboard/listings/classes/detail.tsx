"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  BookOpen,
  Building,
  Calendar,
  CircleAlert,
  Clock,
  GraduationCap,
  School,
  User,
  UserCog,
  Users,
} from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
    back: dictionary?.school?.classes?.detail?.back || "Back",
    classDetails:
      dictionary?.school?.classes?.detail?.classDetails || "Class Details",
    overview: dictionary?.school?.classes?.detail?.overview || "Overview",
    students: dictionary?.school?.classes?.detail?.students || "Students",
    information:
      dictionary?.school?.classes?.detail?.information || "Information",
    enrolledStudents:
      dictionary?.school?.classes?.enrolledStudents || "Enrolled Students",
    noStudents:
      dictionary?.school?.classes?.detail?.noStudents || "No students enrolled",
    subject: dictionary?.school?.classes?.subject || "Subject",
    teacher: dictionary?.school?.classes?.teacher || "Teacher",
    term: dictionary?.school?.classes?.term || "Term",
    classroom: dictionary?.school?.classes?.detail?.classroom || "Classroom",
    courseCode: dictionary?.school?.classes?.courseCode || "Course Code",
    credits: dictionary?.school?.classes?.credits || "Credits",
    capacity: dictionary?.school?.classes?.detail?.capacity || "Capacity",
    evaluationType:
      dictionary?.school?.classes?.detail?.evaluationType || "Evaluation Type",
    createdAt: dictionary?.school?.classes?.detail?.createdAt || "Created",
    viewProfile:
      dictionary?.school?.classes?.detail?.viewProfile || "View Profile",
    viewGrades:
      dictionary?.school?.classes?.detail?.viewGrades || "View Grades",
    viewAttendance:
      dictionary?.school?.classes?.detail?.viewAttendance || "View Attendance",
    unknown: dictionary?.school?.classes?.detail?.unknown || "Unknown",
    errorTitle: dictionary?.school?.classes?.detail?.errorTitle || "Error",
    errorLoading:
      dictionary?.school?.classes?.detail?.errorLoading ||
      "Failed to load class data",
    notFound:
      dictionary?.school?.classes?.detail?.notFound || "Class not found",
    enrolledAt: dictionary?.school?.classes?.detail?.enrolledAt || "Enrolled",
    subjectTeachers:
      dictionary?.school?.classes?.detail?.subjectTeachers ||
      "Subject Teachers",
  }

  // Error state
  if (error || !classData) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="me-2 h-4 w-4" />
          {t.back}
        </Button>
        <Alert variant="destructive">
          <CircleAlert className="h-4 w-4" />
          <AlertTitle>{t.errorTitle}</AlertTitle>
          <AlertDescription>{error || t.notFound}</AlertDescription>
        </Alert>
      </div>
    )
  }

  const teacherName = classData.teacher
    ? `${classData.teacher.givenName} ${classData.teacher.surname}`
    : t.unknown

  const subjectName = classData.subject?.subjectName || t.unknown

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-semibold">{classData.name}</h1>
            {classData.courseCode && (
              <p className="text-muted-foreground text-sm">
                {classData.courseCode}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline">
            <Users className="me-1 h-3 w-3" />
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
            <UserCog className="me-1 h-4 w-4" />
            {t.subjectTeachers}
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {/* Subject Card */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  {t.subject}
                </CardTitle>
                <BookOpen className="text-muted-foreground h-4 w-4" />
              </CardHeader>
              <CardContent>
                <div className="text-lg font-semibold">{subjectName}</div>
              </CardContent>
            </Card>

            {/* Teacher Card */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  {t.teacher}
                </CardTitle>
                <User className="text-muted-foreground h-4 w-4" />
              </CardHeader>
              <CardContent>
                <div className="text-lg font-semibold">{teacherName}</div>
                {classData.teacher?.userId && (
                  <Link
                    href={`/${lang}/profile/${classData.teacher.userId}`}
                    className="text-muted-foreground text-xs hover:underline"
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
                <Calendar className="text-muted-foreground h-4 w-4" />
              </CardHeader>
              <CardContent>
                <div className="text-lg font-semibold">
                  {classData.term?.termName ||
                    `Term ${classData.term?.termNumber}` ||
                    t.unknown}
                </div>
              </CardContent>
            </Card>

            {/* Classroom Card */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  {t.classroom}
                </CardTitle>
                <Building className="text-muted-foreground h-4 w-4" />
              </CardHeader>
              <CardContent>
                <div className="text-lg font-semibold">
                  {classData.classroom?.roomName || t.unknown}
                </div>
                {classData.classroom?.capacity && (
                  <p className="text-muted-foreground text-xs">
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
                  <p className="text-muted-foreground text-sm font-medium">
                    {t.credits}
                  </p>
                  <p className="text-lg">{classData.credits}</p>
                </div>
              )}
              <div>
                <p className="text-muted-foreground text-sm font-medium">
                  {t.capacity}
                </p>
                <p className="text-lg">
                  {classData.minCapacity || 0} - {classData.maxCapacity || 50}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground text-sm font-medium">
                  {t.evaluationType}
                </p>
                <p className="text-lg">{classData.evaluationType}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-sm font-medium">
                  {t.createdAt}
                </p>
                <p className="text-lg">
                  {new Date(classData.createdAt).toLocaleDateString(
                    isRTL ? "ar-SA" : "en-US"
                  )}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <div className="grid gap-4 md:grid-cols-3">
            <Link href={`/${lang}/students?classId=${classData.id}`}>
              <Card className="hover:bg-accent/50 h-full cursor-pointer transition-colors">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">
                    {t.enrolledStudents}
                  </CardTitle>
                  <School className="text-muted-foreground h-4 w-4" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {classData._count.studentClasses}
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href={`/${lang}/grades?classId=${classData.id}`}>
              <Card className="hover:bg-accent/50 h-full cursor-pointer transition-colors">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">
                    {t.viewGrades}
                  </CardTitle>
                  <GraduationCap className="text-muted-foreground h-4 w-4" />
                </CardHeader>
                <CardContent>
                  <div className="text-muted-foreground text-sm">
                    {dictionary?.school?.classes?.detail?.clickViewGrades ||
                      "Click to view grades"}
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href={`/${lang}/attendance?classId=${classData.id}`}>
              <Card className="hover:bg-accent/50 h-full cursor-pointer transition-colors">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">
                    {t.viewAttendance}
                  </CardTitle>
                  <Clock className="text-muted-foreground h-4 w-4" />
                </CardHeader>
                <CardContent>
                  <div className="text-muted-foreground text-sm">
                    {dictionary?.school?.classes?.detail?.clickViewAttendance ||
                      "Click to view attendance"}
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
                {classData._count.studentClasses} /{" "}
                {classData.maxCapacity || 50} {t.students.toLowerCase()}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {classData.enrolledStudents.length === 0 ? (
                <p className="text-muted-foreground text-sm">{t.noStudents}</p>
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
                            {enrollment.student.givenName}{" "}
                            {enrollment.student.surname}
                          </p>
                          <p className="text-muted-foreground text-xs">
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
                            <Link
                              href={`/${lang}/profile/${enrollment.student.userId}`}
                            >
                              <User className="me-1 h-3 w-3" />
                              {t.viewProfile}
                            </Link>
                          </Button>
                        )}
                        <Button variant="ghost" size="sm" asChild>
                          <Link
                            href={`/${lang}/grades?studentId=${enrollment.student.id}`}
                          >
                            <GraduationCap className="me-1 h-3 w-3" />
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
