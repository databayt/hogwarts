// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

// Default scope of the quiz catalog per role. Plain server module (NOT
// "use server"): it is called from the page, never from the client.

import { db } from "@/lib/db"
import { getTeacherSubjectIds } from "@/lib/teaching-scope"

import { getEnrolledSubjectIds } from "../lib/scope"

export interface QuizScope {
  /** Catalog subject ids the viewer sees by default; undefined = unscoped. */
  subjectIds: string[] | undefined
  /** Staff may widen to the whole catalog (still paginated). */
  canBrowseCatalog: boolean
}

/** The catalog subjects the school adopted (SubjectSelection), any grade. */
export async function getSchoolSubjectIds(schoolId: string): Promise<string[]> {
  const rows = await db.subjectSelection.findMany({
    where: { schoolId, isActive: true },
    distinct: ["catalogSubjectId"],
    select: { catalogSubjectId: true },
  })
  return rows.map((r) => r.catalogSubjectId)
}

/**
 * STUDENT / GUARDIAN: their grade's subjects.
 * TEACHER: subjects they teach (falls back to the school's selections when
 * they have no assignment yet). Everyone else with a school (ADMIN, ...): the
 * school's selected catalog subjects. No school: unscoped.
 */
export async function resolveQuizScope(
  role: string | undefined,
  userId: string | undefined,
  schoolId: string | null | undefined
): Promise<QuizScope> {
  if (!schoolId) return { subjectIds: undefined, canBrowseCatalog: true }

  if (role === "STUDENT" || role === "GUARDIAN") {
    const ids = await getEnrolledSubjectIds(role, userId, schoolId)
    return { subjectIds: ids ?? [], canBrowseCatalog: false }
  }

  if (role === "TEACHER" && userId) {
    const teacher = await db.teacher.findFirst({
      where: { userId, schoolId },
      select: { id: true },
    })
    if (teacher) {
      const taught = await getTeacherSubjectIds(schoolId, teacher.id)
      if (taught.length > 0)
        return { subjectIds: taught, canBrowseCatalog: true }
    }
  }

  return {
    subjectIds: await getSchoolSubjectIds(schoolId),
    canBrowseCatalog: true,
  }
}
