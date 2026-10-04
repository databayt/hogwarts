"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { auth } from "@/auth"

import { ACTION_ERRORS, actionError } from "@/lib/action-errors"
import type { ActionResponse } from "@/lib/action-response"
import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"
import { getDisplayLang } from "@/components/translation/locale"
import { getLabels } from "@/components/translation/person"

export interface TeachingScopeGrade {
  id: string
  name: string
  sections: Array<{ id: string; name: string }>
  subjects: Array<{ id: string; name: string }>
}

const STAFF_ROLES = new Set(["DEVELOPER", "ADMIN", "TEACHER", "STAFF"])

/**
 * Grades in order, each with its sections and the subjects it teaches, in
 * the display language — the choices behind `TeachingScopePicker`.
 */
export async function getTeachingScopeOptions(): Promise<
  ActionResponse<{ grades: TeachingScopeGrade[] }>
> {
  try {
    const session = await auth()
    if (!session?.user?.id) return actionError(ACTION_ERRORS.NOT_AUTHENTICATED)
    if (!STAFF_ROLES.has(session.user.role ?? "")) {
      return actionError(ACTION_ERRORS.UNAUTHORIZED)
    }
    const { schoolId } = await getTenantContext()
    if (!schoolId) return actionError(ACTION_ERRORS.MISSING_SCHOOL)

    const [grades, selections, lang] = await Promise.all([
      db.academicGrade.findMany({
        where: { schoolId },
        orderBy: { gradeNumber: "asc" },
        select: {
          id: true,
          name: true,
          sections: {
            orderBy: [{ letter: "asc" }, { name: "asc" }],
            select: { id: true, name: true },
          },
        },
      }),
      db.subjectSelection.findMany({
        where: { schoolId, isActive: true },
        select: {
          gradeId: true,
          catalogSubjectId: true,
          customName: true,
          subject: { select: { name: true } },
        },
      }),
      getDisplayLang(),
    ])

    // Stream-specific selections can list a subject twice for one grade.
    const subjectsByGrade = new Map<string, Map<string, string>>()
    for (const sel of selections) {
      const bySubject = subjectsByGrade.get(sel.gradeId) ?? new Map()
      if (!bySubject.has(sel.catalogSubjectId)) {
        bySubject.set(
          sel.catalogSubjectId,
          sel.customName || sel.subject?.name || ""
        )
      }
      subjectsByGrade.set(sel.gradeId, bySubject)
    }

    const labels = await getLabels(
      [
        ...grades.map((g) => g.name),
        ...grades.flatMap((g) => g.sections.map((s) => s.name)),
        ...[...subjectsByGrade.values()].flatMap((m) => [...m.values()]),
      ],
      lang,
      schoolId
    )
    const label = (v: string) => labels.get(v) ?? v

    return {
      success: true,
      data: {
        grades: grades.map((g) => ({
          id: g.id,
          name: label(g.name),
          sections: g.sections.map((s) => ({ id: s.id, name: label(s.name) })),
          subjects: [...(subjectsByGrade.get(g.id) ?? new Map()).entries()]
            .map(([id, name]) => ({ id, name: label(name) }))
            .sort((a, b) => a.name.localeCompare(b.name)),
        })),
      },
    }
  } catch (error) {
    console.error("[getTeachingScopeOptions]", error)
    return actionError(ACTION_ERRORS.LOAD_FAILED)
  }
}
