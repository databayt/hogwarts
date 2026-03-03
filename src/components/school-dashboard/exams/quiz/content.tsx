// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { auth } from "@/auth"
import { BookOpen, GraduationCap, HelpCircle, Zap } from "lucide-react"

import { getTenantContext } from "@/lib/tenant-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

import { getEnrolledCatalogSubjectIds } from "../lib/scope"
import { getStudentAttempts } from "../shared/attempt-actions"
import { AttemptHistory } from "../shared/attempt-history"
import {
  getCatalogSubjectsForQuizFilter,
  getQuizQuestionStats,
  getQuizzes,
} from "./actions"
import { QuizList } from "./list"

export async function QuizContent() {
  const { schoolId } = await getTenantContext()
  const session = await auth()
  const role = session?.user?.role

  // For students/guardians, scope to enrolled catalog subjects
  const enrolledCatalogSubjectIds =
    schoolId && ["STUDENT", "GUARDIAN"].includes(role || "")
      ? await getEnrolledCatalogSubjectIds(role, session?.user?.id, schoolId)
      : null

  const isStudentOrGuardian = ["STUDENT", "GUARDIAN"].includes(role || "")

  const [quizzes, questionStats, subjects, attempts] = await Promise.all([
    getQuizzes({
      enrolledCatalogSubjectIds: enrolledCatalogSubjectIds ?? undefined,
    }),
    getQuizQuestionStats(undefined, enrolledCatalogSubjectIds ?? undefined),
    getCatalogSubjectsForQuizFilter(enrolledCatalogSubjectIds ?? undefined),
    isStudentOrGuardian ? getStudentAttempts() : Promise.resolve([]),
  ])

  const totalQuestionPool = questionStats.reduce(
    (sum, s) => sum + s.totalQuestions,
    0
  )

  const avgQuestions =
    quizzes.length > 0
      ? Math.round(
          quizzes.reduce((sum, q) => sum + (q.totalQuestions ?? 0), 0) /
            quizzes.length
        )
      : 0

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Quizzes</h2>
        <p className="text-muted-foreground">
          Browse quizzes and diagnostics from the catalog by chapter and lesson
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Quizzes</CardTitle>
            <Zap className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{quizzes.length}</div>
            <p className="text-muted-foreground text-xs">Available quizzes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Question Pool</CardTitle>
            <HelpCircle className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalQuestionPool}</div>
            <p className="text-muted-foreground text-xs">Catalog questions</p>
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
            <CardTitle className="text-sm font-medium">Avg Questions</CardTitle>
            <BookOpen className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgQuestions}</div>
            <p className="text-muted-foreground text-xs">Per quiz</p>
          </CardContent>
        </Card>
      </div>

      <QuizList
        quizzes={quizzes}
        subjects={subjects}
        questionStats={questionStats}
      />

      {isStudentOrGuardian && attempts.length > 0 && (
        <AttemptHistory attempts={attempts} title="My Quiz Attempts" />
      )}
    </div>
  )
}

export default QuizContent
