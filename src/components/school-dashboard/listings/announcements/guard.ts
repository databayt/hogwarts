// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Auth + RBAC guard shared by the announcement actions and wizard steps.
 *
 * Each wizard action is an independently invokable POST endpoint, so it must
 * resolve the session and re-check permissions itself. `getTenantContext()`
 * resolves schoolId from the `x-subdomain` header before it ever consults the
 * session, so a tenant context alone proves nothing about the caller.
 */

import { auth } from "@/auth"

import { ACTION_ERRORS, actionError } from "@/lib/action-errors"
import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"

import {
  checkAnnouncementPermission,
  getAuthContext,
  type AnnouncementAction,
  type AnnouncementContext,
  type AuthContext,
} from "./authorization"

type Denied = ReturnType<typeof actionError>

export type GuardResult<T> =
  | { ok: true; value: T }
  | { ok: false; denied: Denied }

export interface WizardContext {
  authContext: AuthContext
  schoolId: string
}

export interface GuardedAnnouncement extends WizardContext {
  announcement: {
    id: string
    schoolId: string
    createdBy: string | null
    scope: AnnouncementContext["scope"]
  }
}

/**
 * Resolve the caller's identity and tenant.
 *
 * `getTenantContext()` calls `auth()` internally, so the two are issued
 * concurrently rather than resolving the session twice in sequence.
 */
export async function resolveContext(): Promise<GuardResult<WizardContext>> {
  const [session, tenant] = await Promise.all([auth(), getTenantContext()])

  const authContext = getAuthContext(session)
  if (!authContext) {
    return { ok: false, denied: actionError(ACTION_ERRORS.NOT_AUTHENTICATED) }
  }
  if (!tenant.schoolId) {
    return { ok: false, denied: actionError(ACTION_ERRORS.MISSING_SCHOOL) }
  }

  return { ok: true, value: { authContext, schoolId: tenant.schoolId } }
}

/**
 * Resolve context, load the announcement's ownership fields, and assert the
 * caller may perform `action` on it.
 *
 * Wizard steps load a draft into an editable form, so they guard on "update"
 * rather than "read" — viewing the list is a lower bar than editing a draft.
 */
export async function guardAnnouncement(
  announcementId: string,
  action: AnnouncementAction
): Promise<GuardResult<GuardedAnnouncement>> {
  const ctx = await resolveContext()
  if (!ctx.ok) return ctx

  const { authContext, schoolId } = ctx.value

  const announcement = await db.announcement.findFirst({
    where: { id: announcementId, schoolId },
    select: { id: true, schoolId: true, createdBy: true, scope: true },
  })

  if (!announcement) {
    return {
      ok: false,
      denied: actionError(ACTION_ERRORS.ANNOUNCEMENT_NOT_FOUND),
    }
  }

  const permitted = checkAnnouncementPermission(authContext, action, {
    id: announcement.id,
    schoolId: announcement.schoolId,
    createdBy: announcement.createdBy,
    scope: announcement.scope as AnnouncementContext["scope"],
  })

  if (!permitted) {
    return { ok: false, denied: actionError(ACTION_ERRORS.UNAUTHORIZED) }
  }

  return {
    ok: true,
    value: {
      authContext,
      schoolId,
      announcement: {
        ...announcement,
        scope: announcement.scope as AnnouncementContext["scope"],
      },
    },
  }
}
