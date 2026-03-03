// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { auth } from "@/auth"
import { BookOpen, Clock, FileText, GraduationCap } from "lucide-react"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

import { getEnrolledCatalogSubjectIds } from "../lib/scope"
import { getStudentAttempts } from "../shared/attempt-actions"
import { AttemptHistory } from "../shared/attempt-history"
import {
  getCatalogSubjectsForMockFilter,
  getMockExams,
  getSchoolMockExams,
} from "./actions"
import { MockExamList } from "./list"

export async function MockContent() {
  const { schoolId } = await getTenantContext()
  const session = await auth()
  const role = session?.user?.role

  // For students/guardians, scope to enrolled catalog subjects
  const enrolledCatalogSubjectIds =
    schoolId && ["STUDENT", "GUARDIAN"].includes(role || "")
      ? await getEnrolledCatalogSubjectIds(role, session?.user?.id, schoolId)
      : null

  // For school mocks, get enrolled school subject IDs (for student/guardian)
  let enrolledSchoolSubjectIds: string[] | undefined
  if (schoolId && ["STUDENT", "GUARDIAN"].includes(role || "")) {
    let studentIds: string[] = []
    if (role === "STUDENT") {
      const student = await db.student.findFirst({
        where: { userId: session?.user?.id, schoolId },
        select: { id: true },
      })
      if (student) studentIds = [student.id]
    } else if (role === "GUARDIAN") {
      const guardian = await db.guardian.findFirst({
        where: { userId: session?.user?.id, schoolId },
        select: { id: true },
      })
      if (guardian) {
        const sgs = await db.studentGuardian.findMany({
          where: { guardianId: guardian.id, schoolId },
          select: { studentId: true },
        })
        studentIds = sgs.map((sg) => sg.studentId)
      }
    }
    if (studentIds.length > 0) {
      const classes = await db.studentClass.findMany({
        where: { studentId: { in: studentIds }, schoolId },
        select: { class: { select: { subjectId: true } } },
      })
      enrolledSchoolSubjectIds = [
        ...new Set(
          classes.map((c) => c.class.subjectId).filter(Boolean) as string[]
        ),
      ]
    }
  }

  const isStudentOrGuardian = ["STUDENT", "GUARDIAN"].includes(role || "")

  const [exams, subjects, schoolMocks, attempts] = await Promise.all([
    getMockExams({
      enrolledCatalogSubjectIds: enrolledCatalogSubjectIds ?? undefined,
    }),
    getCatalogSubjectsForMockFilter(enrolledCatalogSubjectIds ?? undefined),
    schoolId
      ? getSchoolMockExams(schoolId, enrolledSchoolSubjectIds)
      : Promise.resolve([]),
    isStudentOrGuardian ? getStudentAttempts() : Promise.resolve([]),
  ])

  const avgDuration =
    exams.length > 0
      ? Math.round(
          exams.reduce((sum, e) => sum + (e.durationMinutes ?? 0), 0) /
            exams.filter((e) => e.durationMinutes).length || 0
        )
      : 0

  const totalQuestions = exams.reduce(
    (sum, e) => sum + (e.totalQuestions ?? 0),
    0
  )

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Mock Exams</h2>
        <p className="text-muted-foreground">
          Browse practice exams from the catalog by subject and chapter
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Exams</CardTitle>
            <FileText className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{exams.length}</div>
            <p className="text-muted-foreground text-xs">
              Available mock exams
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Subjects</CardTitle>
            <GraduationCap className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{subjects.length}</div>
            <p className="text-muted-foreground text-xs">Across subjects</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Duration</CardTitle>
            <Clock className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgDuration}m</div>
            <p className="text-muted-foreground text-xs">
              Average exam duration
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Questions</CardTitle>
            <BookOpen className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalQuestions}</div>
            <p className="text-muted-foreground text-xs">
              Total questions across exams
            </p>
          </CardContent>
        </Card>
      </div>

      <MockExamList
        exams={exams}
        subjects={subjects}
        schoolMocks={schoolMocks}
      />

      {isStudentOrGuardian && attempts.length > 0 && (
        <AttemptHistory attempts={attempts} title="My Mock Exam Attempts" />
      )}
    </div>
  )
}

export default MockContent
