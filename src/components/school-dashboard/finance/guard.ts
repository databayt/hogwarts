// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import "server-only"

import { auth } from "@/auth"

import { ACTION_ERRORS, actionError } from "@/lib/action-errors"
import type { ActionResponse } from "@/lib/action-response"
import { getTenantContext } from "@/lib/tenant-context"

import {
  checkFinancePermission,
  type FinanceAction,
  type FinanceModule,
} from "./lib/permissions"

export interface FinanceAccess<A extends FinanceAction> {
  /** Null when the tenant could not be resolved from the request. */
  schoolId: string | null
  /** One entry per requested action. Absent permission is always `false`. */
  can: Record<A, boolean>
}

/**
 * Resolve tenant + session once, then evaluate every requested permission
 * concurrently.
 *
 * getTenantContext() derives schoolId from the x-subdomain header before the
 * session is read, so a tenant context alone never establishes who the caller
 * is — only the permission check does. Any page that queries finance data
 * directly instead of delegating to a gated content.tsx must call this first.
 */
export async function resolveFinanceAccess<A extends FinanceAction>(
  module: FinanceModule,
  actions: readonly A[]
): Promise<FinanceAccess<A>> {
  const [session, { schoolId }] = await Promise.all([
    auth(),
    getTenantContext(),
  ])
  const userId = session?.user?.id

  const denyAll = () =>
    Object.fromEntries(actions.map((a) => [a, false])) as Record<A, boolean>

  if (!userId || !schoolId)
    return { schoolId: schoolId ?? null, can: denyAll() }

  const granted = await Promise.all(
    actions.map((action) =>
      checkFinancePermission(userId, schoolId, module, action)
    )
  )

  return {
    schoolId,
    can: Object.fromEntries(
      actions.map((action, i) => [action, granted[i]])
    ) as Record<A, boolean>,
  }
}

export interface FinanceActor {
  userId: string
  schoolId: string
}

/** Narrow (`success: false`) shape, so callers with a stricter union than
 *  ActionResponse can return it straight back. */
export type FinanceAuthError = ReturnType<typeof actionError>

/**
 * Action-side counterpart of resolveFinanceAccess: returns the caller, or the
 * ActionResponse to hand straight back to the client.
 *
 * A "use server" export is a public POST endpoint — reaching it proves nothing
 * about the caller, and getTenantContext() only reflects the subdomain in the
 * request. Every finance action must start here.
 */
export async function requireFinanceActor(
  module: FinanceModule,
  action: FinanceAction
): Promise<FinanceActor | FinanceAuthError> {
  const [session, { schoolId }] = await Promise.all([
    auth(),
    getTenantContext(),
  ])
  const userId = session?.user?.id

  if (!userId) return actionError(ACTION_ERRORS.NOT_AUTHENTICATED)
  if (!schoolId) return actionError(ACTION_ERRORS.MISSING_SCHOOL)

  const allowed = await checkFinancePermission(userId, schoolId, module, action)
  if (!allowed) return actionError(ACTION_ERRORS.UNAUTHORIZED)

  return { userId, schoolId }
}

export function isFinanceAuthError(
  result: FinanceActor | FinanceAuthError
): result is FinanceAuthError {
  return "success" in result && result.success === false
}
