// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * A notification batch's grade or section target, checked against the
 * school before the batch is stored.
 *
 * Plain server module, deliberately NOT "use server": it takes a schoolId,
 * and every export of a "use server" file is a public endpoint.
 */

import { ACTION_ERRORS } from "@/lib/action-errors"
import { db } from "@/lib/db"

export async function resolveBatchTarget(
  schoolId: string,
  input: { targetGradeId?: string | null; targetSectionId?: string | null }
): Promise<
  | { ok: true; targetGradeId: string | null; targetSectionId: string | null }
  | { ok: false; code: string }
> {
  if (input.targetSectionId) {
    const section = await db.section.findFirst({
      where: { id: input.targetSectionId, schoolId },
      select: { id: true, gradeId: true },
    })
    if (!section) return { ok: false, code: ACTION_ERRORS.INVALID_SECTION }
    return {
      ok: true,
      targetGradeId: section.gradeId,
      targetSectionId: section.id,
    }
  }
  if (input.targetGradeId) {
    const grade = await db.academicGrade.findFirst({
      where: { id: input.targetGradeId, schoolId },
      select: { id: true },
    })
    if (!grade) return { ok: false, code: ACTION_ERRORS.GRADE_NOT_FOUND }
    return { ok: true, targetGradeId: grade.id, targetSectionId: null }
  }
  return { ok: true, targetGradeId: null, targetSectionId: null }
}
