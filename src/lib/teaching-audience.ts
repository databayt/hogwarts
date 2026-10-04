// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Who a piece of work is set for — an exam, an assignment: a grade, one of its
 * sections or the whole grade (`sectionId` null), or — for work made before
 * classes were retired — a class. Every feature that sets work for students
 * answers "who gets it" here, so the answer is the same everywhere.
 *
 * Pure (no database), and the conditions are plain objects that fit any model
 * carrying `classId` / `gradeId` / `sectionId` / `subjectId`.
 */

import type { Prisma } from "@prisma/client"

export interface Audience {
  classId: string | null
  gradeId: string | null
  sectionId: string | null
}

/**
 * Students the work is for. A section's students; a whole grade's students,
 * including those placed in the grade with no section yet; a legacy class's
 * enrollees. Work with no audience reaches nobody.
 */
export function audienceRosterWhere(
  schoolId: string,
  audience: Audience
): Prisma.StudentWhereInput {
  if (audience.sectionId) return { schoolId, sectionId: audience.sectionId }
  if (audience.gradeId) {
    return {
      schoolId,
      OR: [
        { section: { gradeId: audience.gradeId } },
        { sectionId: null, academicGradeId: audience.gradeId },
      ],
    }
  }
  if (audience.classId) {
    return {
      schoolId,
      studentClasses: { some: { schoolId, classId: audience.classId } },
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

type AudienceCondition =
  | { classId: { in: string[] } }
  | { sectionId: { in: string[] } }
  | { sectionId: null; gradeId: { in: string[] } }

/**
 * Work set for these students — one student, or a guardian's children: their
 * legacy classes, their sections, or their whole grades.
 */
export function studentAudienceWhere(
  scopes: StudentAudienceScope | readonly StudentAudienceScope[]
): { OR: AudienceCondition[] } | { id: { in: string[] } } {
  const list = Array.isArray(scopes) ? scopes : [scopes as StudentAudienceScope]
  const classIds = new Set<string>()
  const sectionIds = new Set<string>()
  const gradeIds = new Set<string>()
  for (const s of list) {
    for (const id of s.classIds) classIds.add(id)
    if (s.sectionId) sectionIds.add(s.sectionId)
    if (s.gradeId) gradeIds.add(s.gradeId)
  }
  const or: AudienceCondition[] = []
  if (classIds.size > 0) or.push({ classId: { in: [...classIds] } })
  if (sectionIds.size > 0) or.push({ sectionId: { in: [...sectionIds] } })
  if (gradeIds.size > 0) {
    or.push({ sectionId: null, gradeId: { in: [...gradeIds] } })
  }
  return or.length > 0 ? { OR: or } : { id: { in: [] } }
}

type PairCondition =
  | { subjectId: string; sectionId: { in: string[] } }
  | { subjectId: string; sectionId: null; gradeId: { in: string[] } }

/**
 * Work set for a section — or a whole grade — where these (section, subject)
 * pairs teach the work's subject. Conditions to OR together.
 */
export function pairAudienceWhere(
  pairs: ReadonlyArray<{
    sectionId: string
    subjectId: string
    gradeId: string
  }>
): PairCondition[] {
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
  const or: PairCondition[] = []
  for (const [subjectId, ids] of sectionsBySubject) {
    or.push({ subjectId, sectionId: { in: [...ids] } })
  }
  for (const [subjectId, ids] of gradesBySubject) {
    or.push({ subjectId, sectionId: null, gradeId: { in: [...ids] } })
  }
  return or
}

/**
 * The audience as people say it: the section ("الصف السابع - أ"), the whole
 * grade ("الصف السابع"), or a legacy class's name. Empty when unknown.
 */
export function audienceLabel(work: {
  class?: { name: string } | null
  section?: { name: string } | null
  grade?: { name: string } | null
}): string {
  return work.section?.name ?? work.grade?.name ?? work.class?.name ?? ""
}
