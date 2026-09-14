"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { auth } from "@/auth"

import { ACTION_ERRORS, actionError } from "@/lib/action-errors"
import { getTenantContext } from "@/lib/tenant-context"

import {
  canUseClock,
  clockInCore,
  clockOutCore,
  readClockStatus,
  resolveClockIdentityFor,
  UNAVAILABLE_CLOCK_STATUS,
  type ClockIdentity,
  type ClockStatus,
} from "./clock-core"
import type { ActionResponse } from "./core"

// Staff/teacher self-service clock. The rules and both timesheet lanes live
// in clock-core.ts, shared with the mobile route (api/mobile/attendance/clock);
// these actions only resolve the session and the tenant.

export type { ClockStatus }

async function resolveClockIdentity(): Promise<
  | { ok: true; identity: ClockIdentity }
  | { ok: false; error: { success: false; error: string } }
> {
  const session = await auth()
  if (!session?.user?.id) {
    return { ok: false, error: actionError(ACTION_ERRORS.NOT_AUTHENTICATED) }
  }
  const role = session.user.role ?? ""
  if (!canUseClock(role)) {
    return { ok: false, error: actionError(ACTION_ERRORS.UNAUTHORIZED) }
  }
  const { schoolId } = await getTenantContext()
  if (!schoolId) {
    return { ok: false, error: actionError(ACTION_ERRORS.MISSING_SCHOOL) }
  }

  const resolved = await resolveClockIdentityFor({
    schoolId,
    userId: session.user.id,
    role,
  })
  if (resolved.ok) return resolved
  return {
    ok: false,
    error: actionError(
      resolved.reason === "forbidden"
        ? ACTION_ERRORS.UNAUTHORIZED
        : ACTION_ERRORS.NOT_FOUND
    ),
  }
}

/**
 * Current clock state for the signed-in teacher/staff member, plus today's
 * and this week's hours from their timesheet system of record.
 */
export async function getMyClockStatus(): Promise<ActionResponse<ClockStatus>> {
  try {
    const resolved = await resolveClockIdentity()
    if (!resolved.ok) {
      // Not an error for the UI — the card simply doesn't render.
      return { success: true, data: { ...UNAVAILABLE_CLOCK_STATUS } }
    }
    return { success: true, data: await readClockStatus(resolved.identity) }
  } catch (error) {
    console.error("[getMyClockStatus] Error:", error)
    return actionError(ACTION_ERRORS.NOT_FOUND)
  }
}

/** Check in for today. Idempotent: an existing check-in is returned as-is. */
export async function clockIn(): Promise<ActionResponse<ClockStatus>> {
  try {
    const resolved = await resolveClockIdentity()
    if (!resolved.ok) return resolved.error
    await clockInCore(resolved.identity)
    return { success: true, data: await readClockStatus(resolved.identity) }
  } catch (error) {
    console.error("[clockIn] Error:", error)
    return actionError(ACTION_ERRORS.CREATE_FAILED)
  }
}

/** Check out for today; computes hours worked since check-in. */
export async function clockOut(): Promise<ActionResponse<ClockStatus>> {
  try {
    const resolved = await resolveClockIdentity()
    if (!resolved.ok) return resolved.error
    const out = await clockOutCore(resolved.identity)
    if (out === "notCheckedIn") return actionError(ACTION_ERRORS.NOT_FOUND)
    return { success: true, data: await readClockStatus(resolved.identity) }
  } catch (error) {
    console.error("[clockOut] Error:", error)
    return actionError(ACTION_ERRORS.UPDATE_FAILED)
  }
}
