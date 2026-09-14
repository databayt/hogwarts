// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"

import {
  clockInCore,
  clockOutCore,
  readClockStatus,
  resolveClockIdentityFor,
  UNAVAILABLE_CLOCK_STATUS,
  type ClockStatus,
} from "@/components/school-dashboard/attendance/actions/clock-core"

import { authenticate, isAuthError } from "../../lib/authenticate"

const bodySchema = z.object({ action: z.enum(["in", "out"]) })

const NO_STORE = { "Cache-Control": "private, no-store, max-age=0" }

function toDto(s: ClockStatus) {
  return {
    available: s.available,
    kind: s.kind ?? null,
    checked_in_at: s.checkedInAt,
    checked_out_at: s.checkedOutAt,
    today_hours: s.todayHours,
    week_hours: s.weekHours,
  }
}

/**
 * GET  /api/mobile/attendance/clock — today's clock state
 * POST /api/mobile/attendance/clock — `{ action: "in" | "out" }`
 *
 * The web clock card's actions (attendance/actions/clock.ts) over the bearer
 * token: same roles (TEACHER, STAFF, ADMIN, DEVELOPER), same registers (a
 * StaffMember row clocks into StaffTimesheetEntry, else a Teacher row into the
 * finance TimesheetEntry), same idempotency. Both read clock-core.ts.
 *
 * Returns { available, kind: staff|teacher|null, checked_in_at,
 * checked_out_at, today_hours, week_hours }. GET never refuses: a caller with
 * no clock gets `available: false`, as the web card does. POST refusals:
 * 400 invalid body, 403 role, 404 NO_CLOCK_IDENTITY (no staff/teacher row in
 * this school), 404 NOT_CHECKED_IN (clock-out with no check-in today).
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await authenticate(request)
    if (isAuthError(auth)) return auth

    const resolved = await resolveClockIdentityFor({
      schoolId: auth.schoolId,
      userId: auth.userId,
      role: auth.role,
    })
    const status = resolved.ok
      ? await readClockStatus(resolved.identity)
      : UNAVAILABLE_CLOCK_STATUS
    return NextResponse.json(toDto(status), { headers: NO_STORE })
  } catch (error) {
    console.error("Mobile attendance clock status error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await authenticate(request)
    if (isAuthError(auth)) return auth

    let json: unknown
    try {
      json = await request.json()
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
    }
    const parsed = bodySchema.safeParse(json)
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid body" }, { status: 400 })
    }

    const resolved = await resolveClockIdentityFor({
      schoolId: auth.schoolId,
      userId: auth.userId,
      role: auth.role,
    })
    if (!resolved.ok) {
      return resolved.reason === "forbidden"
        ? NextResponse.json({ error: "Forbidden" }, { status: 403 })
        : NextResponse.json({ error: "NO_CLOCK_IDENTITY" }, { status: 404 })
    }

    if (parsed.data.action === "in") {
      await clockInCore(resolved.identity)
    } else if ((await clockOutCore(resolved.identity)) === "notCheckedIn") {
      return NextResponse.json({ error: "NOT_CHECKED_IN" }, { status: 404 })
    }

    return NextResponse.json(toDto(await readClockStatus(resolved.identity)), {
      headers: NO_STORE,
    })
  } catch (error) {
    console.error("Mobile attendance clock error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
