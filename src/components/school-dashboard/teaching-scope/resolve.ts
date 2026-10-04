// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Server-side check of a teaching scope sent from the browser.
 *
 * Plain server module, deliberately NOT "use server": it takes a schoolId,
 * and every export of a "use server" file is a public endpoint.
 */

import { ACTION_ERRORS, type ActionErrorCode } from "@/lib/action-errors"
import { db } from "@/lib/db"
import { resolveActiveTerm } from "@/lib/term-resolver"

export interface ResolvedTeachingScope {
  gradeId: string
  /** null = the whole grade. */
  sectionId: string | null
  subjectId: string
  /** The active term, when the school has one. */
  termId: string | null
}

export type TeachingScopeResult =
  | { ok: true; scope: ResolvedTeachingScope }
  | { ok: false; code: ActionErrorCode }

/**
 * The grade must be the school's, the section must be in that grade, and the
 * subject must be taught in that grade (an active SubjectSelection). Returns
 * the scope with the active term attached.
 */
export async function resolveTeachingScope(
  schoolId: string,
  input: { gradeId: string; sectionId?: string | null; subjectId: string }
): Promise<TeachingScopeResult> {
  const sectionId = input.sectionId || null
  const [grade, section, selection, { term }] = await Promise.all([
    db.academicGrade.findFirst({
      where: { id: input.gradeId, schoolId },
      select: { id: true },
    }),
    sectionId
      ? db.section.findFirst({
          where: { id: sectionId, schoolId, gradeId: input.gradeId },
          select: { id: true },
        })
      : null,
    db.subjectSelection.findFirst({
      where: {
        schoolId,
        gradeId: input.gradeId,
        catalogSubjectId: input.subjectId,
        isActive: true,
      },
      select: { id: true },
    }),
    resolveActiveTerm(schoolId),
  ])

  if (!grade) return { ok: false, code: ACTION_ERRORS.GRADE_NOT_FOUND }
  if (sectionId && !section) {
    return { ok: false, code: ACTION_ERRORS.INVALID_SECTION }
  }
  if (!selection) return { ok: false, code: ACTION_ERRORS.SUBJECT_NOT_IN_GRADE }

  return {
    ok: true,
    scope: {
      gradeId: input.gradeId,
      sectionId,
      subjectId: input.subjectId,
      termId: term?.id ?? null,
    },
  }
}
