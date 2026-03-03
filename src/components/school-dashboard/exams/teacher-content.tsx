// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import Link from "next/link"
import { auth } from "@/auth"
import {
  ArrowRight,
  BookOpen,
  Calendar,
  ClipboardCheck,
  Clock,
  FileBarChart,
  GraduationCap,
  Sparkles,
  Target,
  Users,
} from "lucide-react"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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

interface Props {
  dictionary: Dictionary
  lang: Locale
}

export default async function TeacherExamsContent({ dictionary, lang }: Props) {
  const session = await auth()
  const { schoolId } = await getTenantContext()
  const userId = session?.user?.id

  if (!schoolId || !userId) return null

  // Find the teacher record to scope all queries
  const teacher = await db.teacher.findFirst({
    where: { userId, schoolId },
    select: { id: true },
  })

  if (!teacher) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <GraduationCap className="text-muted-foreground mb-4 h-12 w-12" />
          <h3 className="mb-2 text-lg font-semibold">
            {lang === "ar"
              ? "لم يتم العثور على سجل معلم"
              : "No teacher record found"}
          </h3>
          <p className="text-muted-foreground text-sm">
            {lang === "ar"
              ? "يرجى التواصل مع إدارة المدرسة"
              : "Please contact school administration"}
          </p>
        </CardContent>
      </Card>
    )
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Get teacher's class IDs first
  const teacherClasses = await db.class.findMany({
    where: { schoolId, teacherId: teacher.id },
    select: { id: true, name: true },
  })

  const classIds = teacherClasses.map((c) => c.id)

  // Fetch teacher-scoped stats in parallel
  const [
    myExamsCount,
    myQuestionsCount,
    myTemplatesCount,
    pendingMarkingCount,
    upcomingExamsCount,
    completedExamsCount,
    myStudentsCount,
    resultsCount,
  ] = await Promise.all([
    db.exam.count({
      where: { schoolId, classId: { in: classIds } },
    }),
    db.questionBank.count({
      where: { schoolId, createdBy: userId },
    }),
    db.examTemplate.count({
      where: { schoolId, createdBy: userId },
    }),
    db.exam.count({
      where: {
        schoolId,
        classId: { in: classIds },
        status: "IN_PROGRESS",
        examDate: { lt: today },
      },
    }),
    db.exam.count({
      where: {
        schoolId,
        classId: { in: classIds },
        status: { in: ["PLANNED", "IN_PROGRESS"] },
        examDate: { gte: today },
      },
    }),
    db.exam.count({
      where: {
        schoolId,
        classId: { in: classIds },
        status: "COMPLETED",
      },
    }),
    db.studentClass.count({
      where: { classId: { in: classIds } },
    }),
    db.examResult.count({
      where: {
        schoolId,
        exam: { classId: { in: classIds } },
      },
    }),
  ])

  const d = dictionary?.school?.exams

  const completionRate =
    myExamsCount > 0
      ? Math.round((completedExamsCount / myExamsCount) * 100)
      : 0

  return (
    <div className="space-y-8">
      {/* Teacher Summary */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card>
          <CardContent className="p-5">
            <div className="text-muted-foreground flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span className="text-sm font-medium">
                {d?.dashboard?.stats?.totalExams || "My Exams"}
              </span>
            </div>
            <p className="mt-2 text-3xl font-bold">{myExamsCount}</p>
            <p className="text-muted-foreground mt-1 text-xs">
              {lang === "ar" ? "في فصولي" : "In my classes"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="text-muted-foreground flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span className="text-sm font-medium">
                {d?.dashboard?.stats?.upcoming || "Upcoming"}
              </span>
            </div>
            <p className="mt-2 text-3xl font-bold">{upcomingExamsCount}</p>
            <p className="text-muted-foreground mt-1 text-xs">
              {lang === "ar" ? "اختبارات قادمة" : "Scheduled ahead"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="text-muted-foreground flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              <span className="text-sm font-medium">
                {d?.dashboard?.stats?.questionBank || "My Questions"}
              </span>
            </div>
            <p className="mt-2 text-3xl font-bold">{myQuestionsCount}</p>
            <p className="text-muted-foreground mt-1 text-xs">
              {lang === "ar" ? "أسئلتي في البنك" : "In question bank"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="text-muted-foreground flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span className="text-sm font-medium">
                {d?.dashboard?.stats?.students || "Students"}
              </span>
            </div>
            <p className="mt-2 text-3xl font-bold">{myStudentsCount}</p>
            <p className="text-muted-foreground mt-1 text-xs">
              {lang === "ar"
                ? `في ${teacherClasses.length} فصول`
                : `Across ${teacherClasses.length} classes`}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Progress Row */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        <Card className="py-4">
          <CardContent>
            <div className="flex items-center justify-between">
              <p className="text-muted-foreground text-sm">
                {d?.dashboard?.stats?.completed || "Completed"}
              </p>
              <Badge
                variant={completionRate >= 80 ? "default" : "secondary"}
                className="text-xs"
              >
                {completionRate}%
              </Badge>
            </div>
            <p className="text-foreground mt-1 text-2xl font-semibold">
              {completedExamsCount}
            </p>
            <Progress value={completionRate} className="mt-4 h-2" />
          </CardContent>
        </Card>

        <Card className="py-4">
          <CardContent>
            <div className="flex items-center justify-between">
              <p className="text-muted-foreground text-sm">
                {d?.dashboard?.stats?.pendingMarking || "Pending Marking"}
              </p>
              {pendingMarkingCount > 0 && (
                <Badge variant="destructive" className="text-xs">
                  {pendingMarkingCount}
                </Badge>
              )}
            </div>
            <p className="text-foreground mt-1 text-2xl font-semibold">
              {pendingMarkingCount}
            </p>
            <p className="text-muted-foreground mt-4 text-sm">
              {lang === "ar" ? "بانتظار التصحيح" : "Awaiting grading"}
            </p>
          </CardContent>
        </Card>

        <Card className="py-4">
          <CardContent>
            <div className="flex items-center justify-between">
              <p className="text-muted-foreground text-sm">
                {d?.dashboard?.stats?.templates || "Templates"}
              </p>
              <Target className="h-4 w-4 text-purple-500" />
            </div>
            <p className="text-foreground mt-1 text-2xl font-semibold">
              {myTemplatesCount}
            </p>
            <p className="text-muted-foreground mt-4 text-sm">
              {lang === "ar" ? "قوالب اختبارات" : "Exam templates"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="bg-muted ring-border/50 rounded-lg p-2 ring-1">
              <GraduationCap className="h-5 w-5" />
            </div>
            <div>
              <CardTitle>
                {d?.dashboard?.quickActions?.title || "Quick Actions"}
              </CardTitle>
              <CardDescription>
                {lang === "ar"
                  ? "إجراءات سريعة لفصولك"
                  : "Common tasks for your classes"}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="grid gap-2 sm:grid-cols-2">
          <Button variant="ghost" className="h-11 justify-start" asChild>
            <Link href={`/${lang}/exams/qbank/new`}>
              <BookOpen className="me-3 h-4 w-4 text-blue-500" />
              {d?.qbank?.addQuestion || "Add Question"}
            </Link>
          </Button>
          <Button variant="ghost" className="h-11 justify-start" asChild>
            <Link href={`/${lang}/exams/generate`}>
              <Sparkles className="me-3 h-4 w-4 text-purple-500" />
              {d?.dashboard?.blocks?.generate?.title || "Generate Exam"}
            </Link>
          </Button>
          <Button variant="ghost" className="h-11 justify-start" asChild>
            <Link href={`/${lang}/exams/mark`}>
              <ClipboardCheck className="me-3 h-4 w-4 text-orange-500" />
              {d?.dashboard?.blocks?.mark?.title || "Mark Exams"}
              {pendingMarkingCount > 0 && (
                <Badge variant="destructive" className="ms-auto text-xs">
                  {pendingMarkingCount}
                </Badge>
              )}
            </Link>
          </Button>
          <Button variant="ghost" className="h-11 justify-start" asChild>
            <Link href={`/${lang}/exams/result`}>
              <FileBarChart className="me-3 h-4 w-4 text-emerald-500" />
              {d?.dashboard?.blocks?.results?.title || "View Results"}
              <Badge variant="secondary" className="ms-auto text-xs">
                {resultsCount}
              </Badge>
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
