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
 * query and pass the row in.
 */

import type { Prisma } from "@prisma/client"

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
  return exam.section?.name ?? exam.grade?.name ?? exam.class?.name ?? ""
}

/** The audience as an id + name pair, the shape paper headers print. */
export function examAudienceRef(exam: ExamAudience): {
  id: string
  name: string
} {
  return {
    id: exam.sectionId ?? exam.gradeId ?? exam.classId ?? "",
    name: examAudienceLabel(exam),
  }
}

/**
 * Students who sit the exam. Legacy: enrolled in its class. Section exam:
 * placed in that section. Whole-grade exam: placed in any section of the
 * grade, or placed in the grade with no section yet. An exam with no
 * audience at all matches nobody.
 */
export function examRosterWhere(
  schoolId: string,
  exam: Pick<ExamAudience, "classId" | "gradeId" | "sectionId">
): Prisma.StudentWhereInput {
  if (exam.sectionId) return { schoolId, sectionId: exam.sectionId }
  if (exam.gradeId) {
    return {
      schoolId,
      OR: [
        { section: { gradeId: exam.gradeId } },
        { sectionId: null, academicGradeId: exam.gradeId },
      ],
    }
  }
  if (exam.classId) {
    return {
      schoolId,
      studentClasses: { some: { schoolId, classId: exam.classId } },
    }
  }
  return { schoolId, id: { in: [] } }
}

/** Where a student sits — see `getStudentScopes` in `@/lib/teaching-scope`. */
export interface StudentAudienceScope {
  sectionId: string | null
  gradeId: string | null
  /** Legacy class enrollments. */
  classIds: readonly string[]
}

/**
 * Exams the given students sit (one student, or a guardian's children):
 * their legacy classes, their sections, or their whole grades.
 */
export function studentExamsWhere(
  scopes: StudentAudienceScope | readonly StudentAudienceScope[]
): Prisma.SchoolExamWhereInput {
  const list = Array.isArray(scopes) ? scopes : [scopes as StudentAudienceScope]
  const classIds = new Set<string>()
  const sectionIds = new Set<string>()
  const gradeIds = new Set<string>()
  for (const s of list) {
    for (const id of s.classIds) classIds.add(id)
    if (s.sectionId) sectionIds.add(s.sectionId)
    if (s.gradeId) gradeIds.add(s.gradeId)
  }
  const or: Prisma.SchoolExamWhereInput[] = []
  if (classIds.size > 0) or.push({ classId: { in: [...classIds] } })
  if (sectionIds.size > 0) or.push({ sectionId: { in: [...sectionIds] } })
  if (gradeIds.size > 0) {
    or.push({ sectionId: null, gradeId: { in: [...gradeIds] } })
  }
  return or.length > 0 ? { OR: or } : { id: { in: [] } }
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
  const sectionsBySubject = new Map<string, Set<string>>()
  const gradesBySubject = new Map<string, Set<string>>()
  for (const p of pairs) {
    const sections = sectionsBySubject.get(p.subjectId) ?? new Set<string>()
    sections.add(p.sectionId)
    sectionsBySubject.set(p.subjectId, sections)
    const grades = gradesBySubject.get(p.subjectId) ?? new Set<string>()
    grades.add(p.gradeId)
    gradesBySubject.set(p.subjectId, grades)
  }
  const or: Prisma.SchoolExamWhereInput[] = []
  for (const [subjectId, ids] of sectionsBySubject) {
    or.push({ subjectId, sectionId: { in: [...ids] } })
  }
  for (const [subjectId, ids] of gradesBySubject) {
    or.push({ subjectId, sectionId: null, gradeId: { in: [...ids] } })
  }
  return or
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
      ...pairExamsWhere(teacher.pairs),
    ],
  }
}
