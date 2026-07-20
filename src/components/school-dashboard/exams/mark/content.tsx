// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

// Main Marking Dashboard Content (Server Component)

import Link from "next/link"
import { auth } from "@/auth"
import type { Prisma } from "@prisma/client"
import { CircleAlert, CircleCheck, Clock, FileText, Plus } from "lucide-react"

import { db } from "@/lib/db"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { Locale } from "@/components/internationalization/config"
import type { Dictionary } from "@/components/internationalization/dictionaries"

import { BulkAutoGradeDialog } from "./bulk-auto-grade-dialog"
import { CSVImportDialog } from "./csv-import-dialog"
import { FinalizeResultsButton } from "./finalize-button"
import { MarkingTable } from "./table"

export async function MarkingContent({
  examId,
  dictionary,
  locale,
}: {
  examId?: string
  dictionary: Dictionary
  locale: Locale
}) {
  const session = await auth()
  const schoolId = session?.user?.schoolId
  const role = session?.user?.role

  if (!schoolId) {
    return <div>{dictionary.common?.unauthorized || "Unauthorized"}</div>
  }

  // TEACHER scoping: only see submissions for their classes
  let teacherClassIds: string[] | null = null
  if (role === "TEACHER") {
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

  // Build scoped query
  const where: Prisma.StudentAnswerWhereInput = {
    schoolId,
    ...(examId ? { examId } : {}),
    // Teacher sees only their classes' exam submissions
    ...(teacherClassIds ? { exam: { classId: { in: teacherClassIds } } } : {}),
  }

  // Fetch submissions scoped by role. The marking queue is intentionally
  // capped at 100 — it's a working set for the grader, not a full archive —
  // but `submissions.length` used to double as the "Total Submissions" KPI
  // and the table's "Showing X of Y" denominator, silently lying once a
  // school passed 100 ungraded answers (a search box over that fixed 100-row
  // array can never reach row 101+ either). `total` below is now the TRUE
  // schoolId-scoped count so the KPI and the table are honest about how many
  // submissions exist; the per-status breakdown counts intentionally stay
  // scoped to the loaded 100-row queue (that's what the tabs/table operate on).
  const [submissions, total] = await Promise.all([
    db.studentAnswer.findMany({
      where,
      include: {
        student: true,
        question: true,
        markingResult: true,
      },
      orderBy: {
        submittedAt: "desc",
      },
      take: 100,
    }),
    db.studentAnswer.count({ where }),
  ])

  // Calculate statistics (scoped to the loaded 100-row queue, not `total`)
  const notStarted = submissions.filter((s) => !s.markingResult).length
  const inProgress = submissions.filter(
    (s) => s.markingResult && s.markingResult.status === "IN_PROGRESS"
  ).length
  const needsReview = submissions.filter(
    (s) => s.markingResult && s.markingResult.needsReview
  ).length
  const completed = submissions.filter(
    (s) => s.markingResult && s.markingResult.status === "COMPLETED"
  ).length

  // Count auto-gradable pending submissions (MCQ/TF/FIB without completed result)
  const AUTO_GRADABLE_TYPES = new Set([
    "MULTIPLE_CHOICE",
    "TRUE_FALSE",
    "FILL_BLANK",
  ])
  const pendingAutoGradable = submissions.filter(
    (s) =>
      AUTO_GRADABLE_TYPES.has(s.question.questionType) &&
      (!s.markingResult || s.markingResult.status !== "COMPLETED")
  ).length

  const dict = dictionary.marking
  const canManage = ["DEVELOPER", "ADMIN", "TEACHER"].includes(
    session?.user?.role || ""
  )

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {canManage && (
            <BulkAutoGradeDialog
              pendingAutoGradable={pendingAutoGradable}
              totalPending={notStarted + inProgress}
            />
          )}
          {canManage && examId && <CSVImportDialog examId={examId} />}
          {canManage && examId && (
            <FinalizeResultsButton
              examId={examId}
              label={
                (dict.buttons as unknown as Record<string, string>)
                  .publishResults ?? "Auto-mark & publish"
              }
              publishingLabel={
                (dict.buttons as unknown as Record<string, string>)
                  .publishing ?? "Publishing…"
              }
              successTemplate={
                (dict.messages as unknown as Record<string, string>)
                  .resultsPublished ??
                "Graded {count} students • results published"
              }
              errorLabel={
                (dict.messages as unknown as Record<string, string>)
                  .publishFailed ?? "Failed to publish results"
              }
            />
          )}
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href={`/${locale}/exams/mark/questions`}>
              <FileText className="me-2 h-4 w-4" />
              {dict.navigation.questionBank}
            </Link>
          </Button>
          <Button asChild>
            <Link href={`/${locale}/exams/mark/questions/create`}>
              <Plus className="me-2 h-4 w-4" />
              {dict.buttons.newQuestion}
            </Link>
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <FileText className="text-muted-foreground h-5 w-5" />
            <div>
              <p className="text-muted-foreground text-sm">
                {dict.statistics.totalSubmissions}
              </p>
              <h3 className="text-2xl font-bold">{total}</h3>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-yellow-600" />
            <div>
              <p className="text-muted-foreground text-sm">
                {dict.statistics.notStarted}
              </p>
              <h3 className="text-2xl font-bold">{notStarted}</h3>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2">
            <CircleAlert className="h-5 w-5 text-orange-600" />
            <div>
              <p className="text-muted-foreground text-sm">
                {dict.statistics.needsReview}
              </p>
              <h3 className="text-2xl font-bold">{needsReview}</h3>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2">
            <CircleCheck className="h-5 w-5 text-green-600" />
            <div>
              <p className="text-muted-foreground text-sm">
                {dict.statistics.completed}
              </p>
              <h3 className="text-2xl font-bold">{completed}</h3>
            </div>
          </div>
        </Card>
      </div>

      {/* Tabs for filtering */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">
            {dict.tabs.all} ({total})
          </TabsTrigger>
          <TabsTrigger value="pending">
            {dict.tabs.pending} ({notStarted})
          </TabsTrigger>
          <TabsTrigger value="review">
            {dict.tabs.review} ({needsReview})
          </TabsTrigger>
          <TabsTrigger value="completed">
            {dict.tabs.completed} ({completed})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <MarkingTable
            data={submissions}
            dictionary={dictionary}
            totalCount={total}
          />
        </TabsContent>

        <TabsContent value="pending">
          <MarkingTable
            data={submissions.filter((s) => !s.markingResult)}
            dictionary={dictionary}
          />
        </TabsContent>

        <TabsContent value="review">
          <MarkingTable
            data={submissions.filter(
              (s) => s.markingResult && s.markingResult.needsReview
            )}
            dictionary={dictionary}
          />
        </TabsContent>

        <TabsContent value="completed">
          <MarkingTable
            data={submissions.filter(
              (s) => s.markingResult && s.markingResult.status === "COMPLETED"
            )}
            dictionary={dictionary}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
