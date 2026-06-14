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
 */
export async function upsertGradebookResult(params: {
  schoolId: string
  studentId: string
  classId: string
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

  if (existing) {
    return db.result.update({ where: { id: existing.id }, data: common })
  }

  return db.result.create({
    data: {
      schoolId: params.schoolId,
      studentId: params.studentId,
      classId: params.classId,
      subjectId: params.subjectId ?? undefined,
      examId: params.examId ?? undefined,
      assignmentId: params.assignmentId ?? undefined,
      yearLevelId: params.yearLevelId ?? undefined,
      ...common,
    },
  })
}

/**
 * Best-effort resolution of a class the student belongs to for a given subject,
 * used by quiz/LMS surfaces that aren't already class-scoped. Returns null when
 * the student can't be tied to a class (caller should skip the gradebook write).
 */
export async function resolveStudentClassForSubject(
  schoolId: string,
  studentId: string,
  subjectId?: string | null
): Promise<string | null> {
  if (subjectId) {
    const bySubject = await db.class.findFirst({
      where: { schoolId, subjectId, studentClasses: { some: { studentId } } },
      select: { id: true },
    })
    if (bySubject) return bySubject.id
  }
  const anyClass = await db.studentClass.findFirst({
    where: { schoolId, studentId },
    select: { classId: true },
  })
  return anyClass?.classId ?? null
}
