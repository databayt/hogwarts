// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Shared gradebook write path.
 *
 * Every automated scoring surface — auto-marked exams, quick assessments,
 * LMS/stream lesson quizzes — funnels through these helpers so that a single,
 * consistent letter-grade + percentage computation and a single idempotent
 * upsert rule govern the whole system.
 *
 * IMPORTANT (no double counting): `Result` is the *unified* gradebook the
 * grades UI lists and report cards read. `ExamResult` is the exam-module store
 * (needed for ExamCertificate + exam analytics + the exam results screen).
 * `finalizeExamResults` writes BOTH; `generateReportCards` dedupes by examId.
 *
 * NOT a "use server" module — these are plain helpers imported by server
 * actions. Marking it "use server" would expose each as an HTTP endpoint.
 */
import { db } from "@/lib/db"
import { resolveActiveTerm } from "@/lib/term-resolver"
import {
  calculateGrade,
  getSchoolGradingScheme,
} from "@/components/school-dashboard/listings/grades/queries"

export type GradeBoundaries = Awaited<ReturnType<typeof getSchoolGradingScheme>>

/** Fetch the school's grade boundaries once, to pass into batch loops. */
export async function getGradeBoundaries(
  schoolId: string
): Promise<GradeBoundaries> {
  return getSchoolGradingScheme(schoolId)
}

/** Pure: percentage → letter grade using pre-fetched boundaries. */
export function letterGradeFor(
  percentage: number,
  boundaries: GradeBoundaries
): string {
  return calculateGrade(percentage, boundaries as never)
}

/**
 * Resolve a letter grade. Pass `boundaries` when grading many students in a
 * loop to avoid one DB round-trip per student.
 */
export async function resolveLetterGrade(
  schoolId: string,
  percentage: number,
  boundaries?: GradeBoundaries
): Promise<string> {
  const b = boundaries ?? (await getSchoolGradingScheme(schoolId))
  return calculateGrade(percentage, b as never)
}

export function toPercentage(score: number, maxScore: number): number {
  if (!maxScore || maxScore <= 0) return 0
  return Math.round((score / maxScore) * 10000) / 100
}

// ============================================================================
// EXAM RESULT (exam-module store; @@unique([examId, studentId]))
// ============================================================================

export async function upsertExamResult(params: {
  schoolId: string
  examId: string
  studentId: string
  marksObtained: number
  totalMarks: number
  grade?: string
  remarks?: string
  isAbsent?: boolean
  boundaries?: GradeBoundaries
}) {
  const percentage = toPercentage(params.marksObtained, params.totalMarks)
  const grade =
    params.grade ??
    (await resolveLetterGrade(params.schoolId, percentage, params.boundaries))

  return db.examResult.upsert({
    where: {
      examId_studentId: { examId: params.examId, studentId: params.studentId },
    },
    create: {
      schoolId: params.schoolId,
      examId: params.examId,
      studentId: params.studentId,
      marksObtained: Math.round(params.marksObtained),
      totalMarks: Math.round(params.totalMarks),
      percentage,
      grade,
      remarks: params.remarks,
      isAbsent: params.isAbsent ?? false,
    },
    update: {
      marksObtained: Math.round(params.marksObtained),
      totalMarks: Math.round(params.totalMarks),
      percentage,
      grade,
      remarks: params.remarks,
      isAbsent: params.isAbsent ?? false,
    },
  })
}

// ============================================================================
// UNIFIED GRADEBOOK RESULT (Result table — what the grades UI lists)
// ============================================================================

export type GradebookSource = "exam" | "assignment" | "quiz" | "lms"

/**
 * Idempotent upsert into the unified `Result` gradebook. `Result` has no
 * natural unique constraint, so we match on the most specific FK available
 * (examId → assignmentId → subject+title) to avoid duplicate rows on re-runs.
 *
 * `onlyIfAbsent` turns the upsert into an insert-if-missing and returns `null`
 * when a row already exists. Surfaces a student can re-run at will (the Lumos
 * lesson quiz) use it so only the first attempt reaches report cards —
 * last-write-wins on an unlimited retake converges on 100% for everyone.
 */
export async function upsertGradebookResult(params: {
  schoolId: string
  studentId: string
  /** The student's section and grade, and the term the score was earned in. */
  sectionId?: string | null
  academicGradeId?: string | null
  termId?: string | null
  score: number
  maxScore: number
  subjectId?: string | null
  examId?: string | null
  assignmentId?: string | null
  yearLevelId?: string | null
  grade?: string
  title?: string | null
  description?: string | null
  feedback?: string | null
  gradedBy?: string | null
  submittedAt?: Date | null
  boundaries?: GradeBoundaries
  /** Insert only when no matching row exists; returns null when one does. */
  onlyIfAbsent?: boolean
}) {
  const percentage = toPercentage(params.score, params.maxScore)
  const grade =
    params.grade ??
    (await resolveLetterGrade(params.schoolId, percentage, params.boundaries))

  const matcher = params.examId
    ? { examId: params.examId }
    : params.assignmentId
      ? { assignmentId: params.assignmentId }
      : {
          examId: null,
          assignmentId: null,
          subjectId: params.subjectId ?? null,
          title: params.title ?? null,
        }

  const existing = await db.result.findFirst({
    where: {
      schoolId: params.schoolId,
      studentId: params.studentId,
      ...matcher,
    },
    select: { id: true },
  })

  const common = {
    score: params.score,
    maxScore: params.maxScore,
    percentage,
    grade,
    title: params.title ?? undefined,
    description: params.description ?? undefined,
    feedback: params.feedback ?? undefined,
    gradedBy: params.gradedBy ?? undefined,
    gradedAt: new Date(),
    submittedAt: params.submittedAt ?? undefined,
  }

  // Only the scope fields the caller named — a re-run that knows the term
  // fills it in, one that doesn't leaves the row alone.
  const scope = {
    ...(params.sectionId !== undefined ? { sectionId: params.sectionId } : {}),
    ...(params.academicGradeId !== undefined
      ? { academicGradeId: params.academicGradeId }
      : {}),
    ...(params.termId !== undefined ? { termId: params.termId } : {}),
  }

  if (existing) {
    if (params.onlyIfAbsent) return null
    return db.result.update({
      where: { id: existing.id },
      data: { ...common, ...scope },
    })
  }

  return db.result.create({
    data: {
      schoolId: params.schoolId,
      studentId: params.studentId,
      ...scope,
      subjectId: params.subjectId ?? undefined,
      examId: params.examId ?? undefined,
      assignmentId: params.assignmentId ?? undefined,
      yearLevelId: params.yearLevelId ?? undefined,
      ...common,
    },
  })
}

export interface StudentSubjectContext {
  sectionId: string | null
  academicGradeId: string | null
  /** The active term, when the school has one. */
  termId: string | null
}

/**
 * Where a student studies a subject, for quiz/LMS surfaces that aren't
 * already scoped: their section, grade and the active term. Returns null when
 * the subject is not taught in the student's grade (an active
 * SubjectSelection) — the caller must then skip the gradebook write.
 *
 * **The match is subject-strict, and that is load-bearing.** Until 2026-08-29
 * the class lookup fell back to `studentClass.findFirst({ schoolId, studentId })`
 * — ANY class the student was in, with no `orderBy` — whenever no
 * subject-matched class existed. That looked like a graceful degradation and
 * was in fact silent data corruption: report cards bucketed `Result` rows by
 * class and labelled each bucket with the class's subject, so a Mathematics
 * lesson quiz was added to whichever class `findFirst` returned — the
 * student's Arabic grade, say — non-deterministically between calls.
 *
 * Recording nothing is the correct failure: the lumos quiz already surfaces
 * `recorded: false` to the student, and a missing score is recoverable in a way
 * that a score silently folded into an unrelated subject is not.
 */
export async function resolveStudentSubjectContext(
  schoolId: string,
  studentId: string,
  subjectId?: string | null
): Promise<StudentSubjectContext | null> {
  if (!subjectId) return null

  const [student, { term }] = await Promise.all([
    db.student.findFirst({
      where: { id: studentId, schoolId },
      select: {
        sectionId: true,
        academicGradeId: true,
        section: { select: { gradeId: true } },
      },
    }),
    resolveActiveTerm(schoolId),
  ])
  if (!student) return null

  const academicGradeId = student.section?.gradeId ?? student.academicGradeId
  const taught = academicGradeId
    ? await db.subjectSelection.findFirst({
        where: {
          schoolId,
          gradeId: academicGradeId,
          catalogSubjectId: subjectId,
          isActive: true,
        },
        select: { id: true },
      })
    : null
  if (!taught) return null

  return {
    sectionId: student.sectionId,
    academicGradeId,
    termId: term?.id ?? null,
  }
}
