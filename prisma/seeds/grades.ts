// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Grades Seed
 * Grade boundaries → unified gradebook (`Result`) → report cards.
 *
 * Phase 10: Exams, QBank & Grades
 *
 * The gradebook is DERIVED, not invented. By the time this phase runs the demo
 * already holds ~14k GRADED `AssignmentSubmission` rows and ~30k `ExamResult`
 * rows — real scores with real feedback — and none of them used to reach the
 * `Result` table the grades UI lists or the `ReportCard` the school prints.
 * So: project graded submissions into `Result`, then run the PRODUCTION
 * aggregation (`generateReportCardsCore`) to build the report cards from that
 * same data. One source of truth; the gradebook, the assignment module and the
 * printed report card can no longer disagree.
 *
 * (The previous version rolled a random score per student and wrote it straight
 * onto the report card, so a student with all-F exams could print an A+, and no
 * `ReportCardGrade` row existed at all — the `.docx` subject loop rendered
 * empty for every school.)
 */

import type { PrismaClient } from "@prisma/client"

import {
  getGradeBoundaries,
  letterGradeFor,
  toPercentage,
} from "@/components/school-dashboard/grades/lib/gradebook"
import { generateReportCardsCore } from "@/components/school-dashboard/grades/lib/report-cards-core"

import { GRADE_SCALE } from "./constants"
import type { StudentRef, TermRef, YearLevelRef } from "./types"
import { logSuccess, logWarning } from "./utils"

/** Insert bound — keeps one statement well inside Postgres' parameter cap. */
const INSERT_CHUNK = 2_000

function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = []
  for (let i = 0; i < items.length; i += size)
    out.push(items.slice(i, i + size))
  return out
}

// ============================================================================
// GRADE BOUNDARIES SEEDING
// ============================================================================

/**
 * Seed grade boundaries (grading scale)
 * Note: Model is GradeBoundary with @@unique([schoolId, grade])
 */
export async function seedGradeBoundaries(
  prisma: PrismaClient,
  schoolId: string
): Promise<void> {
  for (const gradeInfo of GRADE_SCALE) {
    try {
      await prisma.gradeBoundary.upsert({
        where: {
          schoolId_grade: {
            schoolId,
            grade: gradeInfo.grade,
          },
        },
        update: {
          minScore: gradeInfo.minScore,
          maxScore: gradeInfo.maxScore,
          gpaValue: gradeInfo.gpa,
        },
        create: {
          schoolId,
          grade: gradeInfo.grade,
          minScore: gradeInfo.minScore,
          maxScore: gradeInfo.maxScore,
          gpaValue: gradeInfo.gpa,
        },
      })
    } catch {
      // Skip if grade boundary already exists
    }
  }

  logSuccess("Grade Boundaries", GRADE_SCALE.length, "A+ to F")
}

// ============================================================================
// UNIFIED GRADEBOOK (Result) SEEDING
// ============================================================================

/**
 * Project every GRADED `AssignmentSubmission` into the unified `Result`
 * gradebook — the table `/grades` lists and `generateReportCardsCore` reads.
 *
 * Consistency with the gradebook spine (`grades/lib/gradebook.ts`) is kept two
 * ways, deliberately, without calling `upsertGradebookResult` per row (14k rows
 * × 2 queries each is minutes of round-trips for a seed):
 *
 *  - the SCORING is the spine's own pure helpers, `toPercentage` +
 *    `letterGradeFor`, against the school's real `GradeBoundary` rows, so a
 *    seeded row is byte-identical to one a teacher would produce; and
 *  - the IDEMPOTENCY uses the spine's documented match key for this source —
 *    `assignmentId` (+ student) — so a re-run inserts nothing and never
 *    duplicates. `Result` has no unique constraint, so `skipDuplicates` alone
 *    would not protect it.
 *
 * Exam scores are NOT projected here: `finalizeExamResults` owns that path, and
 * the report-card core already reads `ExamResult` directly and de-dupes by
 * `examId`. Writing them twice is exactly the double-count the spine warns of.
 */
export async function seedGradebookResults(
  prisma: PrismaClient,
  schoolId: string
): Promise<number> {
  const submissions = await prisma.assignmentSubmission.findMany({
    where: { schoolId, status: "GRADED", score: { not: null } },
    select: {
      studentId: true,
      assignmentId: true,
      score: true,
      feedback: true,
      submittedAt: true,
      gradedAt: true,
      gradedBy: true,
      assignment: {
        select: {
          title: true,
          totalPoints: true,
          classId: true,
          class: { select: { subjectId: true } },
        },
      },
      student: { select: { academicGradeId: true } },
    },
  })

  if (submissions.length === 0) {
    logWarning("No graded submissions — gradebook left empty")
    return 0
  }

  // Same match rule as `upsertGradebookResult`'s assignment branch.
  const existing = await prisma.result.findMany({
    where: { schoolId, assignmentId: { not: null } },
    select: { studentId: true, assignmentId: true },
  })
  const seen = new Set(existing.map((r) => `${r.assignmentId}:${r.studentId}`))

  const boundaries = await getGradeBoundaries(schoolId)

  // `Student` carries an `academicGradeId`; `Result.yearLevelId` is the level
  // above it. Twelve rows, resolved once.
  const academicGrades = await prisma.academicGrade.findMany({
    where: { schoolId },
    select: { id: true, yearLevelId: true },
  })
  const yearLevelByGrade = new Map(
    academicGrades.map((g) => [g.id, g.yearLevelId ?? null])
  )

  const rows = submissions
    .filter((s) => !seen.has(`${s.assignmentId}:${s.studentId}`))
    .map((s) => {
      const score = Number(s.score)
      const maxScore = Number(s.assignment.totalPoints) || 100
      const percentage = toPercentage(score, maxScore)
      return {
        schoolId,
        studentId: s.studentId,
        classId: s.assignment.classId,
        subjectId: s.assignment.class?.subjectId ?? null,
        assignmentId: s.assignmentId,
        yearLevelId: s.student?.academicGradeId
          ? (yearLevelByGrade.get(s.student.academicGradeId) ?? null)
          : null,
        score,
        maxScore,
        percentage,
        grade: letterGradeFor(percentage, boundaries),
        title: s.assignment.title,
        feedback: s.feedback,
        submittedAt: s.submittedAt,
        gradedAt: s.gradedAt ?? new Date(),
        gradedBy: s.gradedBy,
      }
    })

  if (rows.length === 0) {
    logSuccess("Gradebook Results", 0, "already seeded")
    return 0
  }

  for (const batch of chunk(rows, INSERT_CHUNK)) {
    await prisma.result.createMany({ data: batch })
  }

  logSuccess("Gradebook Results", rows.length, "from graded submissions")
  return rows.length
}

// ============================================================================
// REPORT CARDS SEEDING
// ============================================================================

/**
 * Build report cards by running the PRODUCTION aggregation, so the demo
 * exercises the same code path an admin hits on `/grades/reports` — real
 * per-subject `ReportCardGrade` rows, real credit-weighted GPA, real rank, real
 * attendance days.
 *
 * Idempotent: the core upserts on `schoolId_studentId_termId` and rewrites each
 * card's grade rows, so a second run converges on the same values instead of
 * duplicating.
 */
export async function seedReportCards(
  prisma: PrismaClient,
  schoolId: string,
  students: StudentRef[],
  yearLevels: YearLevelRef[],
  term: TermRef
): Promise<number> {
  void students
  void yearLevels

  const res = await generateReportCardsCore(schoolId, { termId: term.id })

  if (!res.success) {
    logWarning(`Report cards not generated: ${res.error}`)
    return 0
  }

  const { created, updated, skipped } = res.data ?? {
    created: 0,
    updated: 0,
    skipped: 0,
  }
  const total = created + updated

  // The core generates DRAFTS — an admin reviews then publishes. A seeded demo
  // has no admin to click, and an unpublished card is invisible to the student
  // and guardian portals, so publish here. Written straight to the column rather
  // than through `publishReportCards` so seeding never fans out a notification
  // to every student and guardian in the school.
  await prisma.reportCard.updateMany({
    where: { schoolId, termId: term.id, isPublished: false },
    data: { isPublished: true, publishedAt: new Date() },
  })

  const gradeRows = await prisma.reportCardGrade.count({ where: { schoolId } })
  logSuccess(
    "Report Cards",
    total,
    `${gradeRows} subject grades · ${skipped} students without scores`
  )

  return total
}

// ============================================================================
// COMBINED GRADES SEEDING
// ============================================================================

/**
 * Seed all grading data
 */
export async function seedGrades(
  prisma: PrismaClient,
  schoolId: string,
  students: StudentRef[],
  yearLevels: YearLevelRef[],
  term: TermRef
): Promise<number> {
  await seedGradeBoundaries(prisma, schoolId)
  await seedGradebookResults(prisma, schoolId)
  return await seedReportCards(prisma, schoolId, students, yearLevels, term)
}
