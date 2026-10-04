// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Who an announcement reaches — checked server-side before any write.
 *
 * Plain server module, deliberately NOT "use server": it takes a schoolId,
 * and every export of a "use server" file is a public endpoint.
 */

import { ACTION_ERRORS } from "@/lib/action-errors"
import { db } from "@/lib/db"
import { getTeacherSectionIds } from "@/lib/teaching-scope"

import type { AuthContext } from "./authorization"

/**
 * Who an announcement reaches, checked against the school: a grade of it, a
 * section of it (a teacher's own), or neither for school/role scope. A new
 * scope always clears a legacy class.
 */
export async function resolveAnnouncementAudience(
  schoolId: string,
  authContext: AuthContext,
  input: {
    scope: string
    gradeId?: string | null
    sectionId?: string | null
  }
): Promise<
  | { ok: true; gradeId: string | null; sectionId: string | null }
  | { ok: false; code: string }
> {
  if (input.scope === "section") {
    const section = input.sectionId
      ? await db.section.findFirst({
          where: { id: input.sectionId, schoolId },
          select: { id: true, gradeId: true },
        })
      : null
    if (!section) return { ok: false, code: ACTION_ERRORS.INVALID_SECTION }
    if (authContext.role === "TEACHER") {
      const own = await getTeacherSectionIds(schoolId, authContext.userId)
      if (!own.includes(section.id)) {
        return { ok: false, code: ACTION_ERRORS.UNAUTHORIZED }
      }
    }
    return { ok: true, gradeId: section.gradeId, sectionId: section.id }
  }
  if (input.scope === "grade") {
    const grade = input.gradeId
      ? await db.academicGrade.findFirst({
          where: { id: input.gradeId, schoolId },
          select: { id: true },
        })
      : null
    if (!grade) return { ok: false, code: ACTION_ERRORS.GRADE_NOT_FOUND }
    return { ok: true, gradeId: grade.id, sectionId: null }
  }
  return { ok: true, gradeId: null, sectionId: null }
}
