// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { auth } from "@/auth"
import type { UserRole } from "@prisma/client"

import { ACTION_ERRORS, actionError } from "@/lib/action-errors"
import { getTenantContext } from "@/lib/tenant-context"
import {
  checkLiveClassPermission,
  type LiveClassAction,
} from "@/components/school-dashboard/live-classes/authorization"

export type RequireContextResult =
  | {
      ok: true
      schoolId: string
      userId: string
      role: UserRole
    }
  | { ok: false; response: ReturnType<typeof actionError> }

/**
 * Resolve auth + tenant context and check a live-class permission.
 * Mirrors transportation/actions/helpers.ts:33 — see that for the canonical
 * pattern.
 */
export async function requireContext(
  action: LiveClassAction
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

  const allowed = checkLiveClassPermission({ userId, role, schoolId }, action)
  if (!allowed) {
    return { ok: false, response: actionError(ACTION_ERRORS.UNAUTHORIZED) }
  }

  return { ok: true, schoolId, userId, role }
}

/**
 * Path used by `revalidatePath` after a live-class mutation.
 * Includes `/s/[subdomain]` because revalidatePath references the
 * internal file-system route, not the client-facing URL.
 */
export function liveClassRevalidatePath(subPath = ""): string {
  const sub = subPath ? `/${subPath.replace(/^\//, "")}` : ""
  return `/[lang]/s/[subdomain]/live-classes${sub}`
}
