"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { auth } from "@/auth"

import { ACTION_ERRORS, actionError } from "@/lib/action-errors"
import type { ActionResponse } from "@/lib/action-response"
import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"
import {
  checkStudentPermission,
  getAuthContext,
  type AuthContext,
  type StudentAction,
} from "@/components/school-dashboard/listings/students/authorization"

import { locationSchema, type LocationFormData } from "./validation"

/**
 * Shared guard — `getTenantContext()` resolves schoolId from the subdomain
 * header before the session, so these address read/write actions must assert
 * an authenticated, role-permitted session too (not schoolId alone). See the
 * matching guard in the personal wizard actions.
 */
async function authorizeWizardAction(
  action: StudentAction
): Promise<
  | { ok: true; schoolId: string; authContext: AuthContext }
  | { ok: false; response: ActionResponse }
> {
  const session = await auth()
  const authContext = getAuthContext(session)
  if (!authContext) {
    return { ok: false, response: actionError(ACTION_ERRORS.NOT_AUTHENTICATED) }
  }
  const { schoolId } = await getTenantContext()
  if (!schoolId) {
    return { ok: false, response: actionError(ACTION_ERRORS.MISSING_SCHOOL) }
  }
  if (!checkStudentPermission(authContext, action, { schoolId })) {
    return { ok: false, response: actionError(ACTION_ERRORS.UNAUTHORIZED) }
  }
  return { ok: true, schoolId, authContext }
}

export async function getStudentLocation(
  studentId: string
): Promise<ActionResponse<LocationFormData>> {
  try {
    const authz = await authorizeWizardAction("read")
    if (!authz.ok) return authz.response
    const { schoolId } = authz

    const student = await db.student.findFirst({
      where: { id: studentId, schoolId },
      select: {
        currentAddress: true,
        city: true,
        state: true,
        postalCode: true,
        country: true,
      },
    })

    if (!student) return actionError(ACTION_ERRORS.STUDENT_NOT_FOUND)

    return {
      success: true,
      data: {
        currentAddress: student.currentAddress ?? undefined,
        city: student.city ?? undefined,
        state: student.state ?? undefined,
        postalCode: student.postalCode ?? undefined,
        country: student.country ?? undefined,
      },
    }
  } catch (error) {
    return actionError(
      ACTION_ERRORS.LOAD_FAILED,
      error instanceof Error ? error.message : undefined
    )
  }
}

export async function updateStudentLocation(
  studentId: string,
  input: LocationFormData
): Promise<ActionResponse> {
  try {
    const authz = await authorizeWizardAction("update")
    if (!authz.ok) return authz.response
    const { schoolId } = authz

    const parsed = locationSchema.parse(input)

    await db.student.updateMany({
      where: { id: studentId, schoolId },
      data: {
        currentAddress: parsed.currentAddress || null,
        city: parsed.city || null,
        state: parsed.state || null,
        postalCode: parsed.postalCode || null,
        country: parsed.country || null,
      },
    })

    return { success: true }
  } catch (error) {
    return actionError(
      ACTION_ERRORS.SAVE_FAILED,
      error instanceof Error ? error.message : undefined
    )
  }
}
