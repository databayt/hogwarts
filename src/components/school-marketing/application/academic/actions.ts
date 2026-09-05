"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { ACTION_ERRORS, actionError } from "@/lib/action-errors"
import type { ActionResponse } from "@/lib/action-response"
import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"

import { academicSchema, type AcademicSchemaType } from "./validation"

/**
 * Public action — no auth required, like `getApplicationFeePreview`. Returns
 * the grade numbers this school teaches (0 = KG, -1 = nursery, 1–12) so the
 * wizard's grade picker offers only real grades. Nothing sensitive: the same
 * set is visible on the public admissions page.
 */
export async function getSchoolGradeNumbers(): Promise<
  ActionResponse<number[]>
> {
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) return actionError(ACTION_ERRORS.MISSING_SCHOOL)
    const grades = await db.academicGrade.findMany({
      where: { schoolId },
      select: { gradeNumber: true },
    })
    const numbers = [
      ...new Set(
        grades
          .map((g) => g.gradeNumber)
          .filter((n): n is number => typeof n === "number")
      ),
    ]
    return { success: true, data: numbers }
  } catch (error) {
    return actionError(
      ACTION_ERRORS.LOAD_FAILED,
      error instanceof Error ? error.message : undefined
    )
  }
}

export async function saveAcademicStep(
  data: AcademicSchemaType
): Promise<ActionResponse<AcademicSchemaType>> {
  try {
    const validatedData = academicSchema.parse(data)
    return { success: true, data: validatedData }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Validation failed",
    }
  }
}
