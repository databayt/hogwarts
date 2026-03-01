// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import Link from "next/link"
import { auth } from "@/auth"
import { addDays, differenceInDays, format } from "date-fns"
import {
  Award,
  BookOpen,
  Calendar,
  ChevronRight,
  Clock,
  FileBarChart,
  GraduationCap,
  Sparkles,
} from "lucide-react"

import { getDisplayText } from "@/lib/content-display"
import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import type { Locale } from "@/components/internationalization/config"
import type { Dictionary } from "@/components/internationalization/dictionaries"
import type { SupportedLanguage } from "@/components/translation/types"

interface Props {
  dictionary: Dictionary
  lang: Locale
}

export default async function StudentExamsContent({ dictionary, lang }: Props) {
  const session = await auth()
  const { schoolId } = await getTenantContext()
  const userId = session?.user?.id

  if (!schoolId || !userId) return null

  // Get student record and enrolled classes
  const student = await db.student.findFirst({
    where: { userId, schoolId },
    select: { id: true },
  })

  if (!student) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <GraduationCap className="text-muted-foreground mb-4 h-12 w-12" />
          <h3 className="mb-2 text-lg font-semibold">
            {lang === "ar"
              ? "لم يتم العثور على سجل طالب"
              : "No student record found"}
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

  // Get enrolled class IDs and subject IDs
  const enrolledClasses = await db.studentClass.findMany({
    where: { studentId: student.id, schoolId },
    include: {
      class: {
        select: {
          id: true,
          subjectId: true,
          subject: { select: { subjectName: true, lang: true } },
          name: true,
          lang: true,
        },
      },
    },
  })

  const classIds = enrolledClasses.map((sc) => sc.classId)

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Fetch upcoming exams + recent results in parallel
  const [upcomingExams, recentResults] = await Promise.all([
    db.exam.findMany({
      where: {
        schoolId,
        classId: { in: classIds },
        status: { in: ["PLANNED", "IN_PROGRESS"] },
        examDate: { gte: today },
      },
      include: {
        class: { select: { name: true, lang: true } },
        subject: { select: { subjectName: true, lang: true } },
      },
      orderBy: { examDate: "asc" },
      take: 10,
    }),
    db.examResult.findMany({
      where: {
        schoolId,
        studentId: student.id,
      },
      include: {
        exam: {
          select: {
            title: true,
            examDate: true,
            totalMarks: true,
            subject: { select: { subjectName: true, lang: true } },
            class: { select: { name: true, lang: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
  ])

  const d = dictionary?.school?.exams

  return (
    <div className="space-y-8">
      {/* Quick Links */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card className="group transition-shadow hover:shadow-md">
          <CardContent className="p-4">
            <Link
              href={`/${lang}/exams/upcoming`}
              className="flex items-center gap-3"
            >
              <div className="rounded-lg bg-blue-500/10 p-2">
                <Calendar className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="font-medium">
                  {d?.dashboard?.stats?.upcoming || "Upcoming"}
                </p>
                <p className="text-muted-foreground text-2xl font-bold">
                  {upcomingExams.length}
                </p>
              </div>
            </Link>
          </CardContent>
        </Card>

        <Card className="group transition-shadow hover:shadow-md">
          <CardContent className="p-4">
            <Link
              href={`/${lang}/exams/result`}
              className="flex items-center gap-3"
            >
              <div className="rounded-lg bg-emerald-500/10 p-2">
                <FileBarChart className="h-5 w-5 text-emerald-500" />
              </div>
              <div>
                <p className="font-medium">
                  {d?.dashboard?.blocks?.results?.title || "Results"}
                </p>
                <p className="text-muted-foreground text-2xl font-bold">
                  {recentResults.length}
                </p>
              </div>
            </Link>
          </CardContent>
        </Card>

        <Card className="group transition-shadow hover:shadow-md">
          <CardContent className="p-4">
            <Link
              href={`/${lang}/exams/qbank`}
              className="flex items-center gap-3"
            >
              <div className="rounded-lg bg-purple-500/10 p-2">
                <BookOpen className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <p className="font-medium">
                  {d?.dashboard?.blocks?.qbank?.title || "Practice"}
                </p>
                <p className="text-muted-foreground text-sm">
                  {d?.dashboard?.blocks?.qbank?.browse || "Browse"}
                </p>
              </div>
            </Link>
          </CardContent>
        </Card>

        <Card className="group transition-shadow hover:shadow-md">
          <CardContent className="p-4">
            <Link
              href={`/${lang}/exams/quiz`}
              className="flex items-center gap-3"
            >
              <div className="rounded-lg bg-orange-500/10 p-2">
                <Sparkles className="h-5 w-5 text-orange-500" />
              </div>
              <div>
                <p className="font-medium">{d?.nav?.quiz || "Quiz"}</p>
                <p className="text-muted-foreground text-sm">
                  {lang === "ar" ? "تدريب سريع" : "Quick practice"}
                </p>
              </div>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Exams */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">
            {lang === "ar" ? "امتحاناتي القادمة" : "My Upcoming Exams"}
          </h2>
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/${lang}/exams/upcoming`}>
              {lang === "ar" ? "عرض الكل" : "View All"}
              <ChevronRight className="ms-1 h-4 w-4 rtl:rotate-180" />
            </Link>
          </Button>
        </div>

        {upcomingExams.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-8">
              <Calendar className="text-muted-foreground mb-3 h-10 w-10" />
              <p className="text-muted-foreground text-sm">
                {lang === "ar"
                  ? "لا توجد امتحانات قادمة"
                  : "No upcoming exams scheduled"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {await Promise.all(
              upcomingExams.map(async (exam) => {
                const daysUntil = differenceInDays(exam.examDate, today)
                const subjectName = exam.subject?.subjectName
                  ? await getDisplayText(
                      exam.subject.subjectName,
                      (exam.subject.lang || "ar") as SupportedLanguage,
                      lang,
                      schoolId!
                    )
                  : ""
                const className = exam.class?.name
                  ? await getDisplayText(
                      exam.class.name,
                      (exam.class.lang || "ar") as SupportedLanguage,
                      lang,
                      schoolId!
                    )
                  : ""

                return (
                  <Card
                    key={exam.id}
                    className="transition-shadow hover:shadow-md"
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-base">
                          {exam.title}
                        </CardTitle>
                        <Badge
                          variant={
                            daysUntil === 0
                              ? "destructive"
                              : daysUntil === 1
                                ? "secondary"
                                : "outline"
                          }
                        >
                          {daysUntil === 0
                            ? lang === "ar"
                              ? "اليوم"
                              : "Today"
                            : daysUntil === 1
                              ? lang === "ar"
                                ? "غداً"
                                : "Tomorrow"
                              : `${daysUntil} ${lang === "ar" ? "أيام" : "days"}`}
                        </Badge>
                      </div>
                      <CardDescription>
                        {subjectName} - {className}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-4 text-sm">
                        <div className="text-muted-foreground flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          {format(exam.examDate, "MMM d")}
                        </div>
                        <div className="text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          {exam.startTime} ({exam.duration} min)
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })
            )}
          </div>
        )}
      </div>

      {/* Recent Results */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">
            {lang === "ar" ? "نتائجي الأخيرة" : "My Recent Results"}
          </h2>
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/${lang}/exams/result`}>
              {lang === "ar" ? "عرض الكل" : "View All"}
              <ChevronRight className="ms-1 h-4 w-4 rtl:rotate-180" />
            </Link>
          </Button>
        </div>

        {recentResults.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-8">
              <FileBarChart className="text-muted-foreground mb-3 h-10 w-10" />
              <p className="text-muted-foreground text-sm">
                {lang === "ar" ? "لا توجد نتائج بعد" : "No results yet"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3">
            {await Promise.all(
              recentResults.map(async (result) => {
                const subjectName = result.exam.subject?.subjectName
                  ? await getDisplayText(
                      result.exam.subject.subjectName,
                      (result.exam.subject.lang || "ar") as SupportedLanguage,
                      lang,
                      schoolId!
                    )
                  : ""

                return (
                  <Card key={result.id}>
                    <CardContent className="flex items-center justify-between p-4">
                      <div>
                        <p className="font-medium">{result.exam.title}</p>
                        <p className="text-muted-foreground text-sm">
                          {subjectName} -{" "}
                          {format(result.exam.examDate, "MMM d, yyyy")}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-end">
                          <p className="text-2xl font-bold">
                            {result.percentage.toFixed(0)}%
                          </p>
                          <p className="text-muted-foreground text-xs">
                            {result.marksObtained}/{result.exam.totalMarks}
                          </p>
                        </div>
                        {result.grade && (
                          <Badge
                            variant={
                              result.percentage >= 80
                                ? "default"
                                : result.percentage >= 50
                                  ? "secondary"
                                  : "destructive"
                            }
                          >
                            {result.grade}
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )
              })
            )}
          </div>
        )}
      </div>
    </div>
  )
}
