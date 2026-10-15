"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { auth } from "@/auth"

import { ACTION_ERRORS, actionError } from "@/lib/action-errors"
import type { ActionResponse } from "@/lib/action-response"
import { refreshPage } from "@/lib/refresh-page"
import { getTenantContext } from "@/lib/tenant-context"

import { collectGradedAssignments } from "../lib/gradebook"

const COLLECTORS = new Set(["ADMIN", "TEACHER", "DEVELOPER"])

/**
 * Bring every graded homework mark into the gradebook. New grading does
 * this as it happens; this catches up marks given before it did.
 */
export async function collectGrades(): Promise<
  ActionResponse<{ recorded: number; remaining: number }>
> {
  const session = await auth()
  if (!session?.user) return actionError(ACTION_ERRORS.NOT_AUTHENTICATED)
  if (!COLLECTORS.has(session.user.role ?? "")) {
    return actionError(ACTION_ERRORS.FORBIDDEN)
  }
  const { schoolId } = await getTenantContext()
  if (!schoolId) return actionError(ACTION_ERRORS.MISSING_SCHOOL)

  try {
    const data = await collectGradedAssignments(schoolId)
    refreshPage("/grades")
    return { success: true, data }
  } catch (error) {
    console.error("[collectGrades]", error)
    return actionError(ACTION_ERRORS.SAVE_FAILED)
  }
}
