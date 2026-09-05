// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * One guard for every student-wizard server action.
 *
 * `getTenantContext()` resolves `schoolId` from the `x-subdomain` header BEFORE
 * the session, so an action that checks only `if (!schoolId)` is callable by an
 * unauthenticated POST to any valid school subdomain. Every wizard action —
 * the four step files AND the top-level draft/complete/delete actions — must
 * assert an authenticated session whose role permits the operation.
 *
 * This used to be copy-pasted into personal/, academic/, location/ and
 * attachments/actions.ts (four identical bodies), while the top-level
 * `wizard/actions.ts` had no role check at all and `getStudentForWizard` had
 * no `auth()` either. One module, one behaviour.
 *
 * Deliberately NOT a `"use server"` file: a helper exported from a server-action
 * module becomes a public POST endpoint of its own.
 */

import { auth } from "@/auth"

import { ACTION_ERRORS, actionError } from "@/lib/action-errors"
import type { ActionResponse } from "@/lib/action-response"
import { getTenantContext } from "@/lib/tenant-context"

import {
  checkStudentPermission,
  getAuthContext,
  type AuthContext,
  type StudentAction,
} from "../authorization"

export type WizardAuthorization =
  | { ok: true; schoolId: string; authContext: AuthContext }
  | { ok: false; response: ActionResponse }

export async function authorizeWizardAction(
  action: StudentAction
): Promise<WizardAuthorization> {
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
