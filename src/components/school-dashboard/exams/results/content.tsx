// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type React from "react"
import Link from "next/link"
import { auth } from "@/auth"
import { format } from "date-fns"
import { Award, Download, FileBarChart, TrendingUp } from "lucide-react"
import { type SearchParams } from "nuqs/server"

import { getDisplayText } from "@/lib/content-display"
import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { Locale } from "@/components/internationalization/config"
import type { Dictionary } from "@/components/internationalization/dictionaries"
import type { SupportedLanguage } from "@/components/translation/types"

import { BatchIssueDialog } from "../certificates/batch-issue-dialog"
import { StudentProgress } from "../shared/student-progress"

interface Props {
  dictionary: Dictionary
  lang: Locale
  searchParams: Promise<SearchParams>
}

// Helper to get student IDs for the current user (student or guardian)
async function getStudentScope(
  role: string | undefined,
  userId: string | undefined,
  schoolId: string
): Promise<{ studentIds: string[]; classIds: string[] } | null> {
  if (!userId) return null

  if (role === "STUDENT") {
    const student = await db.student.findFirst({
      where: { userId, schoolId },
      select: { id: true },
    })
    if (!student) return null
    const classes = await db.studentClass.findMany({
      where: { studentId: student.id, schoolId },
      select: { classId: true },
    })
    return {
      studentIds: [student.id],
      classIds: classes.map((c) => c.classId),
    }
  }

  if (role === "GUARDIAN") {
    const guardian = await db.guardian.findFirst({
      where: { userId, schoolId },
      select: { id: true },
    })
    if (!guardian) return null
    const studentGuardians = await db.studentGuardian.findMany({
      where: { guardianId: guardian.id, schoolId },
      select: { studentId: true },
    })
    const childIds = studentGuardians.map((sg) => sg.studentId)
    const classes = await db.studentClass.findMany({
      where: { studentId: { in: childIds }, schoolId },
      select: { classId: true },
    })
    return {
      studentIds: childIds,
      classIds: [...new Set(classes.map((c) => c.classId))],
    }
  }

  return null
}

export default async function ResultsContent({ dictionary, lang }: Props) {
  const { schoolId } = await getTenantContext()
  const session = await auth()
  const role = session?.user?.role
  const isStudentOrGuardian = ["STUDENT", "GUARDIAN"].includes(role || "")

  // For students/guardians, show their own results directly
  if (isStudentOrGuardian && schoolId) {
    const scope = await getStudentScope(role, session?.user?.id, schoolId)
    if (!scope) return null

    // For guardians, fetch children names for grouping
    let children: { id: string; name: string }[] = []
    if (role === "GUARDIAN" && scope.studentIds.length > 1) {
      const students = await db.student.findMany({
        where: { id: { in: scope.studentIds }, schoolId },
        select: { id: true, givenName: true, surname: true },
      })
      children = students.map((s) => ({
        id: s.id,
        name: `${s.givenName || ""} ${s.surname || ""}`.trim(),
      }))
    }

    const results = await db.examResult.findMany({
      where: {
        schoolId,
        studentId: { in: scope.studentIds },
      },
      include: {
        student: { select: { id: true, givenName: true, surname: true } },
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
      take: 50,
    })

    const dict = dictionary?.results
    const noResultsMsg =
      dict?.messages?.noResults ||
      (lang === "ar" ? "لا توجد نتائج بعد" : "No results yet")

    // Pre-render all result cards (await must be at top level, not inside JSX .map)
    const allResultCards = await Promise.all(
      results.map(async (result) => {
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
                  {role === "GUARDIAN" &&
                    `${result.student.givenName} ${result.student.surname} - `}
                  {subjectName} - {format(result.exam.examDate, "MMM d, yyyy")}
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
    )

    // Build a map of studentId -> rendered cards for guardian child tabs
    const cardsByStudent = new Map<string, React.ReactNode[]>()
    results.forEach((result, i) => {
      const sid = result.student.id
      if (!cardsByStudent.has(sid)) cardsByStudent.set(sid, [])
      cardsByStudent.get(sid)!.push(allResultCards[i])
    })

    // Guardian with multiple children: show tabs per child
    if (role === "GUARDIAN" && children.length > 1) {
      return (
        <div className="space-y-6">
          <StudentProgress isGuardian />

          <Tabs defaultValue="all" className="space-y-4">
            <TabsList>
              <TabsTrigger value="all">
                {lang === "ar" ? "الكل" : "All"} ({results.length})
              </TabsTrigger>
              {children.map((child) => {
                const count = cardsByStudent.get(child.id)?.length || 0
                return (
                  <TabsTrigger key={child.id} value={child.id}>
                    {child.name} ({count})
                  </TabsTrigger>
                )
              })}
            </TabsList>

            <TabsContent value="all">
              <div className="grid gap-3">
                {allResultCards.length === 0 ? (
                  <p className="text-muted-foreground py-8 text-center text-sm">
                    {noResultsMsg}
                  </p>
                ) : (
                  allResultCards
                )}
              </div>
            </TabsContent>

            {children.map((child) => (
              <TabsContent key={child.id} value={child.id}>
                <div className="grid gap-3">
                  {cardsByStudent.get(child.id) || (
                    <p className="text-muted-foreground py-8 text-center text-sm">
                      {noResultsMsg}
                    </p>
                  )}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </div>
      )
    }

    return (
      <div className="space-y-6">
        <StudentProgress isGuardian={role === "GUARDIAN"} />

        {allResultCards.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileBarChart className="text-muted-foreground mb-4 h-12 w-12" />
              <h3 className="mb-2 text-lg font-semibold">{noResultsMsg}</h3>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3">{allResultCards}</div>
        )}
      </div>
    )
  }

  // Admin/Teacher view
  // Teacher sees only their classes; Admin sees all
  let teacherClassIds: string[] | null = null
  if (schoolId && role === "TEACHER") {
    const teacher = await db.teacher.findFirst({
      where: { userId: session?.user?.id, schoolId },
      select: { id: true },
    })
    if (teacher) {
      const classes = await db.class.findMany({
        where: { teacherId: teacher.id, schoolId },
        select: { id: true },
      })
      teacherClassIds = classes.map((c) => c.id)
    }
  }

  let examsWithResults: Array<{
    id: string
    title: string
    examDate: Date
    className: string
    subjectName: string
    totalStudents: number
    resultsGenerated: number
    averagePercentage: number | null
  }> = []

  if (schoolId) {
    const completedExams = await db.exam.findMany({
      where: {
        schoolId,
        status: "COMPLETED",
        // Teacher scoping
        ...(teacherClassIds ? { classId: { in: teacherClassIds } } : {}),
      },
      include: {
        class: { select: { name: true, lang: true } },
        subject: { select: { subjectName: true, lang: true } },
        examResults: {
          select: {
            id: true,
            percentage: true,
            isAbsent: true,
          },
        },
      },
      orderBy: { examDate: "desc" },
      take: 20,
    })

    examsWithResults = await Promise.all(
      completedExams.map(async (exam) => {
        const totalStudents = exam.examResults.length
        const presentResults = exam.examResults.filter((r) => !r.isAbsent)
        const averagePercentage =
          presentResults.length > 0
            ? presentResults.reduce((sum, r) => sum + r.percentage, 0) /
              presentResults.length
            : null

        return {
          id: exam.id,
          title: exam.title,
          examDate: exam.examDate,
          className: await getDisplayText(
            exam.class.name,
            (exam.class.lang || "ar") as SupportedLanguage,
            lang,
            schoolId!
          ),
          subjectName: await getDisplayText(
            exam.subject.subjectName,
            (exam.subject.lang || "ar") as SupportedLanguage,
            lang,
            schoolId!
          ),
          totalStudents,
          resultsGenerated: totalStudents,
          averagePercentage,
        }
      })
    )
  }

  const r = dictionary?.results

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div></div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href={`/${lang}/exams/certificates`}>
              <Award className="me-2 h-4 w-4" />
              {lang === "ar" ? "إدارة الشهادات" : "Manage Certificates"}
            </Link>
          </Button>
          <Button asChild>
            <Link href={`/${lang}/exams/result/analytics`}>
              <TrendingUp className="me-2 h-4 w-4" />
              {r?.actions?.viewAnalytics}
            </Link>
          </Button>
        </div>
      </div>

      {examsWithResults.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileBarChart className="text-muted-foreground mb-4 h-12 w-12" />
            <h3 className="mb-2 text-lg font-semibold">
              {r?.messages?.noResults}
            </h3>
            <p className="text-muted-foreground mb-4 text-sm">
              {r?.messages?.noResultsDescription}
            </p>
            <Button asChild>
              <Link href={`/${lang}/exams`}>{r?.actions?.goToExams}</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {examsWithResults.map((exam) => (
            <Card key={exam.id}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <div>
                  <CardTitle>{exam.title}</CardTitle>
                  <p className="text-muted-foreground mt-1 text-sm">
                    {exam.className} • {exam.subjectName} •{" "}
                    {new Date(exam.examDate).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/${lang}/exams/result/${exam.id}`}>
                      <FileBarChart className="me-2 h-4 w-4" />
                      {r?.actions?.viewResults}
                    </Link>
                  </Button>
                  <BatchIssueDialog
                    examId={exam.id}
                    examTitle={exam.title}
                    eligibleCount={exam.totalStudents}
                  />
                  <Button asChild variant="outline" size="sm">
                    <Link
                      href={`/${lang}/exams/certificates?examId=${exam.id}`}
                    >
                      <Award className="me-2 h-4 w-4" />
                      {lang === "ar" ? "الشهادات" : "Certificates"}
                    </Link>
                  </Button>
                  <Button variant="outline" size="sm">
                    <Download className="me-2 h-4 w-4" />
                    {r?.actions?.exportCSV}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-muted-foreground text-sm">
                      {r?.statistics?.totalStudents}
                    </p>
                    <p className="text-2xl font-bold">{exam.totalStudents}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-sm">
                      {r?.statistics?.resultsGenerated}
                    </p>
                    <p className="text-2xl font-bold">
                      {exam.resultsGenerated}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-sm">
                      {r?.statistics?.averageScore}
                    </p>
                    <p className="text-2xl font-bold">
                      {exam.averagePercentage !== null
                        ? `${exam.averagePercentage.toFixed(1)}%`
                        : r?.labels?.notAvailable || "N/A"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
