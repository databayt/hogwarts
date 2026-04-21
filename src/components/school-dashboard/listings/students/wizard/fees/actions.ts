"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { auth } from "@/auth"

import { ACTION_ERRORS, actionError } from "@/lib/action-errors"
import type { ActionResponse } from "@/lib/action-response"
import { getFeePreviewByGradeId, type FeePreview } from "@/lib/fee-preview"
import { getTenantContext } from "@/lib/tenant-context"

export async function getStudentFeePreview(
  academicGradeId: string
): Promise<ActionResponse<FeePreview>> {
  try {
    const session = await auth()
    if (!session?.user?.id) return actionError(ACTION_ERRORS.NOT_AUTHENTICATED)

    const { schoolId } = await getTenantContext()
    if (!schoolId) return actionError(ACTION_ERRORS.MISSING_SCHOOL)

    if (!academicGradeId || academicGradeId.trim().length === 0) {
      return actionError(ACTION_ERRORS.VALIDATION_ERROR)
    }
    const preview = await getFeePreviewByGradeId(schoolId, academicGradeId)
    return { success: true, data: preview }
  } catch (error) {
    return actionError(
      ACTION_ERRORS.LOAD_FAILED,
      error instanceof Error ? error.message : undefined
    )
  }
}
