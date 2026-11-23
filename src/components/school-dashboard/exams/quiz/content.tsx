// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { auth } from "@/auth"
import { BookOpen, GraduationCap, HelpCircle, Zap } from "lucide-react"

import { getTenantContext } from "@/lib/tenant-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"

import { getStudentAttempts } from "../shared/attempt-actions"
import { AttemptHistory } from "../shared/attempt-history"
import {
  getQuizQuestionStats,
  getQuizSummary,
  getQuizzes,
  getSubjectsForQuizFilter,
} from "./actions"
import { QuizList } from "./list"
import { clampPage } from "./query"
import { resolveQuizScope } from "./scope"

export interface QuizSearchParams {
  page?: string
  subject?: string
  type?: string
  scope?: string
}

export async function QuizContent({
  lang,
  searchParams,
}: { lang?: Locale; searchParams?: QuizSearchParams } = {}) {
  const dictionary = await getDictionary((lang ?? "ar") as Locale)
  const d = dictionary?.school?.exams?.quizUi
  const { schoolId } = await getTenantContext()
  const session = await auth()
  const role = session?.user?.role

  const scope = await resolveQuizScope(role, session?.user?.id, schoolId)
  const isStudentOrGuardian = ["STUDENT", "GUARDIAN"].includes(role || "")

  // Staff may widen to the whole catalog; it is still paginated.
  const catalogMode =
    scope.canBrowseCatalog && searchParams?.scope === "catalog"
  const baseScope = catalogMode ? undefined : scope.subjectIds

  const subjects = await getSubjectsForQuizFilter(baseScope)
  // A subject outside the viewer's scope is ignored, never honoured
  const subjectId = subjects.some((s) => s.id === searchParams?.subject)
    ? searchParams?.subject
    : undefined

  const filters = {
    catalogSubjectId: subjectId,
    examType: searchParams?.type,
    enrolledSubjectIds: baseScope,
  }

  const [quizPage, summary, questionStats, attempts] = await Promise.all([
    getQuizzes({ ...filters, page: clampPage(searchParams?.page) }),
    getQuizSummary(filters),
    getQuizQuestionStats(subjectId, baseScope),
    isStudentOrGuardian ? getStudentAttempts() : Promise.resolve([]),
  ])

  const totalQuestionPool = questionStats.reduce(
    (sum, s) => sum + s.totalQuestions,
    0
  )
  const avgQuestions = summary.avgQuestions

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">{d?.title}</h2>
        <p className="text-muted-foreground">{d?.description}</p>
      </div>

      <div className="max-md:bg-border grid gap-4 max-md:grid-cols-2 max-md:gap-px max-md:overflow-hidden max-md:rounded-xl md:grid-cols-4 max-md:[&>*:last-child:nth-child(odd)]:col-span-2">
        <Card className="max-md:bg-muted max-md:h-full max-md:rounded-none max-md:border-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 max-md:px-4 max-md:pt-4 max-md:pb-1">
            <CardTitle className="text-sm font-medium max-md:line-clamp-1 max-md:text-xs max-md:font-normal">
              {d?.totalQuizzes}
            </CardTitle>
            <Zap className="text-muted-foreground h-4 w-4 max-md:hidden" />
          </CardHeader>
          <CardContent className="max-md:px-4 max-md:pb-4">
            <div className="text-2xl font-bold max-md:text-lg max-md:leading-7 max-md:tabular-nums">
              {summary.totalQuizzes}
            </div>
            <p className="text-muted-foreground text-xs max-md:hidden">
              {d?.availableQuizzes}
            </p>
          </CardContent>
        </Card>

        <Card className="max-md:bg-muted max-md:h-full max-md:rounded-none max-md:border-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 max-md:px-4 max-md:pt-4 max-md:pb-1">
            <CardTitle className="text-sm font-medium max-md:line-clamp-1 max-md:text-xs max-md:font-normal">
              {d?.questionPoolStat}
            </CardTitle>
            <HelpCircle className="text-muted-foreground h-4 w-4 max-md:hidden" />
          </CardHeader>
          <CardContent className="max-md:px-4 max-md:pb-4">
            <div className="text-2xl font-bold max-md:text-lg max-md:leading-7 max-md:tabular-nums">
              {totalQuestionPool}
            </div>
            <p className="text-muted-foreground text-xs max-md:hidden">
              {d?.catalogQuestions}
            </p>
          </CardContent>
        </Card>

        <Card className="max-md:bg-muted max-md:h-full max-md:rounded-none max-md:border-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 max-md:px-4 max-md:pt-4 max-md:pb-1">
            <CardTitle className="text-sm font-medium max-md:line-clamp-1 max-md:text-xs max-md:font-normal">
              {d?.subjects}
            </CardTitle>
            <GraduationCap className="text-muted-foreground h-4 w-4 max-md:hidden" />
          </CardHeader>
          <CardContent className="max-md:px-4 max-md:pb-4">
            <div className="text-2xl font-bold max-md:text-lg max-md:leading-7 max-md:tabular-nums">
              {subjects.length}
            </div>
            <p className="text-muted-foreground text-xs max-md:hidden">
              {d?.acrossSubjects}
            </p>
          </CardContent>
        </Card>

        <Card className="max-md:bg-muted max-md:h-full max-md:rounded-none max-md:border-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 max-md:px-4 max-md:pt-4 max-md:pb-1">
            <CardTitle className="text-sm font-medium max-md:line-clamp-1 max-md:text-xs max-md:font-normal">
              {d?.avgQuestions}
            </CardTitle>
            <BookOpen className="text-muted-foreground h-4 w-4 max-md:hidden" />
          </CardHeader>
          <CardContent className="max-md:px-4 max-md:pb-4">
            <div className="text-2xl font-bold max-md:text-lg max-md:leading-7 max-md:tabular-nums">
              {avgQuestions}
            </div>
            <p className="text-muted-foreground text-xs max-md:hidden">
              {d?.perQuiz}
            </p>
          </CardContent>
        </Card>
      </div>

      <QuizList
        quizzes={quizPage.items}
        subjects={subjects}
        questionStats={questionStats.slice(0, 12)}
        page={quizPage.page}
        pageCount={quizPage.pageCount}
        total={quizPage.total}
        pageSize={quizPage.pageSize}
        subjectId={subjectId ?? ""}
        type={searchParams?.type ?? ""}
        catalogMode={catalogMode}
        canBrowseCatalog={scope.canBrowseCatalog}
      />

      {isStudentOrGuardian && attempts.length > 0 && (
        <AttemptHistory attempts={attempts} title={d?.myAttempts} />
      )}
    </div>
  )
}

export default QuizContent
