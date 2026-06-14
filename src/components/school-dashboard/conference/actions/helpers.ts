// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { auth } from "@/auth"
import type { UserRole } from "@prisma/client"

import { ACTION_ERRORS, actionError } from "@/lib/action-errors"
import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"
import {
  checkLiveClassPermission,
  type LiveClassAction,
} from "@/components/school-dashboard/conference/authorization"

const SESSION_STAFF_ROLES: UserRole[] = [
  "DEVELOPER",
  "ADMIN",
  "STAFF",
  "TEACHER",
]

/**
 * Enrollment-level access to a live-class session (and its recordings),
 * on top of the role-level `view_recordings` permission. Staff may view
 * school-wide; a STUDENT/GUARDIAN may only access a session whose section
 * they (or their ward) are enrolled in. Mirrors resolveParticipantRole in
 * actions/tokens.ts. Without this, any student could pull another section's
 * recording within the same school.
 */
export async function canAccessSession(
  ctx: { userId: string; role: UserRole; schoolId: string },
  sectionId: string | null
): Promise<boolean> {
  if (SESSION_STAFF_ROLES.includes(ctx.role)) return true
  if (!sectionId) return false
  if (ctx.role === "STUDENT") {
    const student = await db.student.findFirst({
      where: { schoolId: ctx.schoolId, userId: ctx.userId, sectionId },
      select: { id: true },
    })
    return Boolean(student)
  }
  if (ctx.role === "GUARDIAN") {
    const guardian = await db.guardian.findFirst({
      where: {
        schoolId: ctx.schoolId,
        userId: ctx.userId,
        studentGuardians: { some: { student: { sectionId } } },
      },
      select: { id: true },
    })
    return Boolean(guardian)
  }
  return false
}

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
 * Per-school concurrent live-room cap. Shared by `startLiveClass` (sessions.ts)
 * and the HOST auto-start path in `joinLiveClass` (tokens.ts) so the two cannot
 * diverge. Returns an actionError response when the school row is missing
 * (hard error — never silently bypass the cap) or the cap is reached;
 * otherwise `null` (ok to proceed).
 */
export async function concurrentCapError(
  schoolId: string
): Promise<ReturnType<typeof actionError> | null> {
  const [school, liveCount] = await Promise.all([
    db.school.findUnique({
      where: { id: schoolId },
      select: { conferenceMaxConcurrent: true },
    }),
    db.conference.count({
      where: { schoolId, status: "live", deletedAt: null },
    }),
  ])
  if (!school) return actionError(ACTION_ERRORS.SCHOOL_NOT_FOUND)
  if (liveCount >= school.conferenceMaxConcurrent) {
    return actionError(ACTION_ERRORS.LIVE_CLASS_MAX_CONCURRENT)
  }
  return null
}

/**
 * Path used by `revalidatePath` after a live-class mutation.
 * Includes `/s/[subdomain]` because revalidatePath references the
 * internal file-system route, not the client-facing URL.
 */
export function conferenceRevalidatePath(subPath = ""): string {
  const sub = subPath ? `/${subPath.replace(/^\//, "")}` : ""
  return `/[lang]/s/[subdomain]/conference${sub}`
}
