"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { auth } from "@/auth"

import { ACTION_ERRORS, actionError } from "@/lib/action-errors"
import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"

import type { ActionResponse } from "./core"

// ============================================================================
// STAFF/TEACHER SELF-SERVICE CLOCK (timesheet integration)
//
// Two systems of record, each left in its own lane:
// - STAFF (StaffMember row)  → StaffTimesheetEntry (native checkIn/checkOut).
// - TEACHER (Teacher row)    → finance's TimesheetEntry: created at check-in
//   with 0h inside the OPEN TimesheetPeriod covering today (a month-named
//   period is created when none exists), hours computed at check-out, left
//   in DRAFT so the finance approval flow (submit → approve) is untouched.
//   In/out timestamps ride in `notes` as "in:<ISO>;out:<ISO>" — no schema
//   change, and the finance UI shows them as plain text.
// ============================================================================

const CLOCK_ROLES = ["TEACHER", "STAFF", "ADMIN", "DEVELOPER"]

interface ClockIdentity {
  schoolId: string
  userId: string
  kind: "teacher" | "staff"
  teacherId?: string
  staffMemberId?: string
}

export interface ClockStatus {
  available: boolean
  kind?: "teacher" | "staff"
  checkedInAt: string | null
  checkedOutAt: string | null
  todayHours: number
  weekHours: number
}

async function resolveClockIdentity(): Promise<
  | { ok: true; identity: ClockIdentity }
  | { ok: false; error: { success: false; error: string } }
> {
  const session = await auth()
  if (!session?.user?.id) {
    return { ok: false, error: actionError(ACTION_ERRORS.NOT_AUTHENTICATED) }
  }
  const role = session.user.role ?? ""
  if (!CLOCK_ROLES.includes(role)) {
    return { ok: false, error: actionError(ACTION_ERRORS.UNAUTHORIZED) }
  }
  const { schoolId } = await getTenantContext()
  if (!schoolId) {
    return { ok: false, error: actionError(ACTION_ERRORS.MISSING_SCHOOL) }
  }

  // Prefer the staff register (native check-in/out) when the user has a
  // StaffMember row; otherwise fall back to the teacher timesheet.
  const [staffMember, teacher] = await Promise.all([
    db.staffMember.findFirst({
      where: { schoolId, userId: session.user.id },
      select: { id: true },
    }),
    db.teacher.findFirst({
      where: { schoolId, userId: session.user.id },
      select: { id: true },
    }),
  ])

  if (staffMember) {
    return {
      ok: true,
      identity: {
        schoolId,
        userId: session.user.id,
        kind: "staff",
        staffMemberId: staffMember.id,
      },
    }
  }
  if (teacher) {
    return {
      ok: true,
      identity: {
        schoolId,
        userId: session.user.id,
        kind: "teacher",
        teacherId: teacher.id,
      },
    }
  }
  return { ok: false, error: actionError(ACTION_ERRORS.NOT_FOUND) }
}

function todayMidnight(): Date {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d
}

function weekStart(): Date {
  // Sunday-start week (matches SchoolWeekConfig's [0..4] = Sun–Thu region).
  const d = todayMidnight()
  d.setDate(d.getDate() - d.getDay())
  return d
}

function parseTeacherNotes(notes: string | null | undefined): {
  in: string | null
  out: string | null
} {
  const result: { in: string | null; out: string | null } = {
    in: null,
    out: null,
  }
  if (!notes) return result
  for (const part of notes.split(";")) {
    if (part.startsWith("in:")) result.in = part.slice(3)
    if (part.startsWith("out:")) result.out = part.slice(4)
  }
  return result
}

function roundHours(ms: number): number {
  const hours = ms / 3_600_000
  return Math.min(24, Math.max(0, Math.round(hours * 100) / 100))
}

/** Find (or create) the OPEN timesheet period covering today. */
async function resolveOpenPeriod(schoolId: string, today: Date) {
  const existing = await db.timesheetPeriod.findFirst({
    where: {
      schoolId,
      status: "OPEN",
      startDate: { lte: today },
      endDate: { gte: today },
    },
    select: { id: true },
  })
  if (existing) return existing

  // Month-named period, created on demand. @@unique([schoolId, name]) makes
  // concurrent creation safe-ish; on a race the second create throws and the
  // caller's findFirst on retry would see it — acceptable for a clock action.
  const name = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`
  const startDate = new Date(today.getFullYear(), today.getMonth(), 1)
  const endDate = new Date(
    today.getFullYear(),
    today.getMonth() + 1,
    0,
    23,
    59,
    59
  )
  const byName = await db.timesheetPeriod.findFirst({
    where: { schoolId, name },
    select: { id: true },
  })
  if (byName) return byName
  return db.timesheetPeriod.create({
    data: { schoolId, name, startDate, endDate, status: "OPEN" },
    select: { id: true },
  })
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
      return {
        success: true,
        data: {
          available: false,
          checkedInAt: null,
          checkedOutAt: null,
          todayHours: 0,
          weekHours: 0,
        },
      }
    }
    const { identity } = resolved
    const today = todayMidnight()
    const week = weekStart()

    if (identity.kind === "staff") {
      const [todayEntry, weekEntries] = await Promise.all([
        db.staffTimesheetEntry.findFirst({
          where: {
            schoolId: identity.schoolId,
            staffMemberId: identity.staffMemberId!,
            date: today,
          },
          select: { checkIn: true, checkOut: true, hoursWorked: true },
        }),
        db.staffTimesheetEntry.findMany({
          where: {
            schoolId: identity.schoolId,
            staffMemberId: identity.staffMemberId!,
            date: { gte: week, lte: today },
          },
          select: { hoursWorked: true },
        }),
      ])
      const weekHours = weekEntries.reduce(
        (sum, e) => sum + Number(e.hoursWorked ?? 0),
        0
      )
      return {
        success: true,
        data: {
          available: true,
          kind: "staff",
          checkedInAt: todayEntry?.checkIn?.toISOString() ?? null,
          checkedOutAt: todayEntry?.checkOut?.toISOString() ?? null,
          todayHours: Number(todayEntry?.hoursWorked ?? 0),
          weekHours: Math.round(weekHours * 100) / 100,
        },
      }
    }

    // Teacher path
    const [todayEntry, weekEntries] = await Promise.all([
      db.timesheetEntry.findFirst({
        where: {
          schoolId: identity.schoolId,
          teacherId: identity.teacherId!,
          entryDate: today,
        },
        select: { notes: true, hoursWorked: true },
      }),
      db.timesheetEntry.findMany({
        where: {
          schoolId: identity.schoolId,
          teacherId: identity.teacherId!,
          entryDate: { gte: week, lte: today },
        },
        select: { hoursWorked: true },
      }),
    ])
    const times = parseTeacherNotes(todayEntry?.notes)
    const weekHours = weekEntries.reduce(
      (sum, e) => sum + Number(e.hoursWorked ?? 0),
      0
    )
    return {
      success: true,
      data: {
        available: true,
        kind: "teacher",
        checkedInAt: times.in,
        checkedOutAt: times.out,
        todayHours: Number(todayEntry?.hoursWorked ?? 0),
        weekHours: Math.round(weekHours * 100) / 100,
      },
    }
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
    const { identity } = resolved
    const today = todayMidnight()
    const now = new Date()

    if (identity.kind === "staff") {
      const existing = await db.staffTimesheetEntry.findFirst({
        where: {
          schoolId: identity.schoolId,
          staffMemberId: identity.staffMemberId!,
          date: today,
        },
        select: { id: true, checkIn: true },
      })
      if (!existing) {
        await db.staffTimesheetEntry.create({
          data: {
            schoolId: identity.schoolId,
            staffMemberId: identity.staffMemberId!,
            date: today,
            checkIn: now,
            status: "PRESENT",
          },
        })
      } else if (!existing.checkIn) {
        await db.staffTimesheetEntry.updateMany({
          where: { id: existing.id, schoolId: identity.schoolId },
          data: { checkIn: now, status: "PRESENT" },
        })
      }
    } else {
      const period = await resolveOpenPeriod(identity.schoolId, today)
      const existing = await db.timesheetEntry.findFirst({
        where: {
          schoolId: identity.schoolId,
          teacherId: identity.teacherId!,
          entryDate: today,
        },
        select: { id: true, notes: true },
      })
      if (!existing) {
        await db.timesheetEntry.create({
          data: {
            schoolId: identity.schoolId,
            periodId: period.id,
            teacherId: identity.teacherId!,
            entryDate: today,
            hoursWorked: 0,
            status: "DRAFT",
            notes: `in:${now.toISOString()}`,
            submittedBy: identity.userId,
          },
        })
      } else {
        const times = parseTeacherNotes(existing.notes)
        if (!times.in) {
          await db.timesheetEntry.updateMany({
            where: { id: existing.id, schoolId: identity.schoolId },
            data: {
              notes: `in:${now.toISOString()}${times.out ? `;out:${times.out}` : ""}`,
            },
          })
        }
      }
    }

    return getMyClockStatus()
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
    const { identity } = resolved
    const today = todayMidnight()
    const now = new Date()

    if (identity.kind === "staff") {
      const existing = await db.staffTimesheetEntry.findFirst({
        where: {
          schoolId: identity.schoolId,
          staffMemberId: identity.staffMemberId!,
          date: today,
        },
        select: { id: true, checkIn: true, checkOut: true },
      })
      if (!existing?.checkIn) {
        return actionError(ACTION_ERRORS.NOT_FOUND)
      }
      if (!existing.checkOut) {
        await db.staffTimesheetEntry.updateMany({
          where: { id: existing.id, schoolId: identity.schoolId },
          data: {
            checkOut: now,
            hoursWorked: roundHours(now.getTime() - existing.checkIn.getTime()),
          },
        })
      }
    } else {
      const existing = await db.timesheetEntry.findFirst({
        where: {
          schoolId: identity.schoolId,
          teacherId: identity.teacherId!,
          entryDate: today,
        },
        select: { id: true, notes: true },
      })
      const times = parseTeacherNotes(existing?.notes)
      if (!existing || !times.in) {
        return actionError(ACTION_ERRORS.NOT_FOUND)
      }
      if (!times.out) {
        await db.timesheetEntry.updateMany({
          where: { id: existing.id, schoolId: identity.schoolId },
          data: {
            hoursWorked: roundHours(
              now.getTime() - new Date(times.in).getTime()
            ),
            notes: `in:${times.in};out:${now.toISOString()}`,
          },
        })
      }
    }

    return getMyClockStatus()
  } catch (error) {
    console.error("[clockOut] Error:", error)
    return actionError(ACTION_ERRORS.UPDATE_FAILED)
  }
}
