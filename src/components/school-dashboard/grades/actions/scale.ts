"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { revalidatePath } from "next/cache"
import { auth } from "@/auth"

import { ACTION_ERRORS, actionError } from "@/lib/action-errors"
import type { ActionResponse } from "@/lib/action-response"
import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"

import { gradesPath } from "../lib/paths"
import { validateScale, type ScaleBand } from "../lib/scale"

// The scale decides every student's letter and GPA — the school's admins
// set it; teachers grade against it.
const SCALE_EDITORS = new Set(["ADMIN", "DEVELOPER"])

/** Replace the school's grade scale. Existing grades keep their letter. */
export async function saveGradeScale(
  bands: ScaleBand[]
): Promise<ActionResponse<{ count: number }>> {
  const session = await auth()
  if (!session?.user) return actionError(ACTION_ERRORS.NOT_AUTHENTICATED)
  if (!SCALE_EDITORS.has(session.user.role ?? "")) {
    return actionError(ACTION_ERRORS.FORBIDDEN)
  }
  const { schoolId } = await getTenantContext()
  if (!schoolId) return actionError(ACTION_ERRORS.MISSING_SCHOOL)

  const clean = bands.map((b) => ({
    grade: String(b.grade ?? "").trim(),
    minScore: Number(b.minScore),
    maxScore: Number(b.maxScore),
    gpa: Number(b.gpa),
  }))
  if (clean.some((b) => [b.minScore, b.maxScore, b.gpa].some(Number.isNaN))) {
    return actionError(ACTION_ERRORS.VALIDATION_ERROR)
  }
  const problem = validateScale(clean)
  if (problem) return { success: false, error: problem }

  try {
    await db.$transaction([
      db.gradeBoundary.deleteMany({ where: { schoolId } }),
      db.gradeBoundary.createMany({
        data: clean.map((b) => ({
          schoolId,
          grade: b.grade,
          minScore: b.minScore,
          maxScore: b.maxScore,
          gpaValue: b.gpa,
        })),
      }),
    ])
    revalidatePath(gradesPath("settings"), "page")
    return { success: true, data: { count: clean.length } }
  } catch (error) {
    console.error("[saveGradeScale]", error)
    return actionError(ACTION_ERRORS.SAVE_FAILED)
  }
}

/** Drop the school's own scale and grade on the default again. */
export async function resetGradeScale(): Promise<ActionResponse<void>> {
  const session = await auth()
  if (!session?.user) return actionError(ACTION_ERRORS.NOT_AUTHENTICATED)
  if (!SCALE_EDITORS.has(session.user.role ?? "")) {
    return actionError(ACTION_ERRORS.FORBIDDEN)
  }
  const { schoolId } = await getTenantContext()
  if (!schoolId) return actionError(ACTION_ERRORS.MISSING_SCHOOL)
  try {
    await db.gradeBoundary.deleteMany({ where: { schoolId } })
    revalidatePath(gradesPath("settings"), "page")
    return { success: true }
  } catch (error) {
    console.error("[resetGradeScale]", error)
    return actionError(ACTION_ERRORS.SAVE_FAILED)
  }
}
