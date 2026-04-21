"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { ACTION_ERRORS, actionError } from "@/lib/action-errors"
import type { ActionResponse } from "@/lib/action-response"
import { getFeePreviewByGradeLabel, type FeePreview } from "@/lib/fee-preview"
import { getTenantContext } from "@/lib/tenant-context"

/**
 * Public action — no auth required. Uses subdomain-derived schoolId so the
 * applicant sees the school's configured fees for their selected grade.
 */
export async function getApplicationFeePreview(
  applyingForClass: string
): Promise<ActionResponse<FeePreview>> {
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) return actionError(ACTION_ERRORS.MISSING_SCHOOL)
    if (!applyingForClass || applyingForClass.trim().length === 0) {
      return actionError(ACTION_ERRORS.VALIDATION_ERROR)
    }
    const preview = await getFeePreviewByGradeLabel(schoolId, applyingForClass)
    return { success: true, data: preview }
  } catch (error) {
    return actionError(
      ACTION_ERRORS.LOAD_FAILED,
      error instanceof Error ? error.message : undefined
    )
  }
}
