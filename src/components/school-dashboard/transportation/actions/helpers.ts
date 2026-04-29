// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { auth } from "@/auth"
import type { UserRole } from "@prisma/client"

import { ACTION_ERRORS, actionError } from "@/lib/action-errors"
import { getTenantContext } from "@/lib/tenant-context"
import {
  checkTransportationPermission,
  type TransportationAction,
} from "@/components/school-dashboard/transportation/authorization"

export type RequireContextResult =
  | {
      ok: true
      schoolId: string
      userId: string
      role: UserRole
    }
  | { ok: false; response: ReturnType<typeof actionError> }

/**
 * Resolve auth + tenant context and check a permission. Returns either an `ok`
 * payload with the resolved context, or a ready-to-return error response.
 *
 * Usage in server actions:
 *
 *   const ctx = await requireContext("manage_vehicle")
 *   if (!ctx.ok) return ctx.response
 *   const { schoolId } = ctx
 */
export async function requireContext(
  action: TransportationAction
): Promise<RequireContextResult> {
  const session = await auth()
  const userId = session?.user?.id
  const role = session?.user?.role as UserRole | undefined
  if (!userId || !role) {
    return { ok: false, response: actionError(ACTION_ERRORS.NOT_AUTHENTICATED) }
  }

  const { schoolId } = await getTenantContext()
  if (!schoolId) {
    return { ok: false, response: actionError(ACTION_ERRORS.MISSING_SCHOOL) }
  }

  const allowed = checkTransportationPermission(
    { userId, role, schoolId },
    action
  )
  if (!allowed) {
    return { ok: false, response: actionError(ACTION_ERRORS.UNAUTHORIZED) }
  }

  return { ok: true, schoolId, userId, role }
}

/**
 * Path used by `revalidatePath` after a transportation mutation.
 * The path includes `/s/[subdomain]` because revalidatePath uses internal
 * file-system routes (not client-facing URLs).
 */
export function transportationRevalidatePath(subPath = ""): string {
  const sub = subPath ? `/${subPath.replace(/^\//, "")}` : ""
  return `/[lang]/s/[subdomain]/transportation${sub}`
}
