// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Who sits an exam, and how to name them.
 *
 * Exams used to belong to a Class. Classes are being retired: a new exam is
 * set for a grade — one section of it, or the whole grade (sectionId null) —
 * plus a subject. Legacy exams still carry a classId; every helper here
 * answers for both, so callers never branch on which kind they hold.
 *
 * Pure (no database). Callers include `examAudienceSelect` in their exam
 * query and pass the row in. The rules live in `@/lib/teaching-audience`,
 * shared with assignments; these are the exam-typed names.
 */

import type { Prisma } from "@prisma/client"

import {
  audienceLabel,
  audienceRosterWhere,
  pairAudienceWhere,
  studentAudienceWhere,
  type StudentAudienceScope,
} from "@/lib/teaching-audience"

/** The relations `examAudienceLabel` reads; spread into an `include`. */
export const examAudienceInclude = {
  class: { select: { name: true } },
  section: { select: { name: true } },
  grade: { select: { name: true } },
} satisfies Prisma.SchoolExamInclude

/** Fields every audience helper reads; spread into a `select`. */
export const examAudienceSelect = {
  classId: true,
  gradeId: true,
  sectionId: true,
  ...examAudienceInclude,
} satisfies Prisma.SchoolExamSelect

export interface ExamAudience {
  classId: string | null
  gradeId: string | null
  sectionId: string | null
  class?: { name: string } | null
  section?: { name: string } | null
  grade?: { name: string } | null
}

/**
 * The audience as people say it: the section ("الصف السابع - أ"), the whole
 * grade ("الصف السابع"), or a legacy class's name. Empty when unknown.
 */
export function examAudienceLabel(exam: ExamAudience): string {
  return audienceLabel(exam)
}

/** The audience as an id + name pair, the shape paper headers print. */
export function examAudienceRef(exam: ExamAudience): {
  id: string
  name: string
} {
  return {
    id: exam.sectionId ?? exam.gradeId ?? exam.classId ?? "",
    name: audienceLabel(exam),
  }
}

/** Students who sit the exam — see `audienceRosterWhere`. */
export function examRosterWhere(
  schoolId: string,
  exam: Pick<ExamAudience, "classId" | "gradeId" | "sectionId">
): Prisma.StudentWhereInput {
  return audienceRosterWhere(schoolId, exam)
}

export type { StudentAudienceScope }

/**
 * Exams the given students sit (one student, or a guardian's children):
 * their legacy classes, their sections, or their whole grades.
 */
export function studentExamsWhere(
  scopes: StudentAudienceScope | readonly StudentAudienceScope[]
): Prisma.SchoolExamWhereInput {
  return studentAudienceWhere(scopes)
}

/**
 * Exams set for a section — or a whole grade — where these (section,
 * subject) pairs teach the exam's subject. Conditions to OR together.
 */
export function pairExamsWhere(
  pairs: ReadonlyArray<{
    sectionId: string
    subjectId: string
    gradeId: string
  }>
): Prisma.SchoolExamWhereInput[] {
  return pairAudienceWhere(pairs)
}

/**
 * Exams a teacher may open and manage: legacy exams of a class they teach,
 * exams they created, and exams set for a section — or a whole grade — where
 * they teach the exam's subject. `pairs` come from `getTeacherPairs`.
 */
export function teacherExamsWhere(teacher: {
  teacherId: string
  userId: string
  pairs: ReadonlyArray<{
    sectionId: string
    subjectId: string
    gradeId: string
  }>
}): Prisma.SchoolExamWhereInput {
  return {
    OR: [
      { class: { teacherId: teacher.teacherId } },
      { createdById: teacher.userId },
      ...pairAudienceWhere(teacher.pairs),
    ],
  }
}
