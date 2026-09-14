// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

// NOT a "use server" module on purpose: the clock actions (clock.ts, session)
// and the mobile clock route (api/mobile/attendance/clock, bearer token) both
// call this, and a "use server" export would become a client-callable
// endpoint of its own that trusts whatever userId it is handed.
import { db } from "@/lib/db"

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

export const CLOCK_ROLES = ["TEACHER", "STAFF", "ADMIN", "DEVELOPER"]

export function canUseClock(role: string | null | undefined): boolean {
  return !!role && CLOCK_ROLES.includes(role)
}

export interface ClockIdentity {
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

/** What a caller without a clock sees — the card simply doesn't render. */
export const UNAVAILABLE_CLOCK_STATUS: ClockStatus = {
  available: false,
  checkedInAt: null,
  checkedOutAt: null,
  todayHours: 0,
  weekHours: 0,
}

export type ClockIdentityResult =
  | { ok: true; identity: ClockIdentity }
  /** Role outside CLOCK_ROLES. */
  | { ok: false; reason: "forbidden" }
  /** Neither a StaffMember nor a Teacher row for this user in this school. */
  | { ok: false; reason: "noIdentity" }

/**
 * Which register this user clocks into, inside one school. The caller has
 * already authenticated the user and resolved the tenant.
 */
export async function resolveClockIdentityFor(input: {
  schoolId: string
  userId: string
  role: string
}): Promise<ClockIdentityResult> {
  const { schoolId, userId, role } = input
  if (!canUseClock(role)) return { ok: false, reason: "forbidden" }

  // Prefer the staff register (native check-in/out) when the user has a
  // StaffMember row; otherwise fall back to the teacher timesheet.
  const [staffMember, teacher] = await Promise.all([
    db.staffMember.findFirst({
      where: { schoolId, userId },
      select: { id: true },
    }),
    db.teacher.findFirst({
      where: { schoolId, userId },
      select: { id: true },
    }),
  ])

  if (staffMember) {
    return {
      ok: true,
      identity: {
        schoolId,
        userId,
        kind: "staff",
        staffMemberId: staffMember.id,
      },
    }
  }
  if (teacher) {
    return {
      ok: true,
      identity: { schoolId, userId, kind: "teacher", teacherId: teacher.id },
    }
  }
  return { ok: false, reason: "noIdentity" }
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
 * Current clock state, plus today's and this week's hours from the
 * identity's timesheet system of record.
 */
export async function readClockStatus(
  identity: ClockIdentity
): Promise<ClockStatus> {
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
      available: true,
      kind: "staff",
      checkedInAt: todayEntry?.checkIn?.toISOString() ?? null,
      checkedOutAt: todayEntry?.checkOut?.toISOString() ?? null,
      todayHours: Number(todayEntry?.hoursWorked ?? 0),
      weekHours: Math.round(weekHours * 100) / 100,
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
    available: true,
    kind: "teacher",
    checkedInAt: times.in,
    checkedOutAt: times.out,
    todayHours: Number(todayEntry?.hoursWorked ?? 0),
    weekHours: Math.round(weekHours * 100) / 100,
  }
}

/** Check in for today. Idempotent: an existing check-in is left as-is. */
export async function clockInCore(identity: ClockIdentity): Promise<void> {
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
    return
  }

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

/**
 * Check out for today; computes hours worked since check-in. Idempotent once
 * checked out. `notCheckedIn` when there is no check-in today to close.
 */
export async function clockOutCore(
  identity: ClockIdentity
): Promise<"ok" | "notCheckedIn"> {
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
    if (!existing?.checkIn) return "notCheckedIn"
    if (!existing.checkOut) {
      await db.staffTimesheetEntry.updateMany({
        where: { id: existing.id, schoolId: identity.schoolId },
        data: {
          checkOut: now,
          hoursWorked: roundHours(now.getTime() - existing.checkIn.getTime()),
        },
      })
    }
    return "ok"
  }

  const existing = await db.timesheetEntry.findFirst({
    where: {
      schoolId: identity.schoolId,
      teacherId: identity.teacherId!,
      entryDate: today,
    },
    select: { id: true, notes: true },
  })
  const times = parseTeacherNotes(existing?.notes)
  if (!existing || !times.in) return "notCheckedIn"
  if (!times.out) {
    await db.timesheetEntry.updateMany({
      where: { id: existing.id, schoolId: identity.schoolId },
      data: {
        hoursWorked: roundHours(now.getTime() - new Date(times.in).getTime()),
        notes: `in:${times.in};out:${now.toISOString()}`,
      },
    })
  }
  return "ok"
}
