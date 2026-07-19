// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import "server-only"

import { db } from "@/lib/db"

/** Per-teacher attendance derived from APPROVED timesheet entries in a pay
 *  period. Informational on the slip — base salary is paid in full regardless,
 *  so these counts don't move net pay; they make the slip honest instead of a
 *  hardcoded "22 days, present, 0 absent". */
export interface TimesheetSummary {
  daysWorked: number
  daysPresent: number
  daysAbsent: number
  hoursWorked: number
  overtimeHours: number
}

const round2 = (n: number): number => Math.round(n * 100) / 100

/**
 * Aggregate APPROVED timesheet entries for a set of teachers within a pay
 * period in ONE query, keyed by teacherId. Only approved hours feed payroll —
 * DRAFT/SUBMITTED/REJECTED entries are excluded, since unapproved hours must
 * never be paid. Teachers with no approved entries are absent from the map, so
 * the caller falls back to its salaried default (full attendance).
 *
 * Day semantics from a bare timesheet (no schedule): a day with worked hours is
 * "present"; a day whose only signal is leave hours is "absent"; daysWorked is
 * the sum, i.e. the working days the timesheet actually accounts for.
 */
export async function loadTimesheetSummaries(args: {
  schoolId: string
  teacherIds: string[]
  periodStart: Date
  periodEnd: Date
}): Promise<Map<string, TimesheetSummary>> {
  const { schoolId, teacherIds, periodStart, periodEnd } = args
  const summaries = new Map<string, TimesheetSummary>()
  if (teacherIds.length === 0) return summaries

  const entries = await db.timesheetEntry.findMany({
    where: {
      schoolId,
      teacherId: { in: teacherIds },
      status: "APPROVED",
      entryDate: { gte: periodStart, lte: periodEnd },
    },
    select: {
      teacherId: true,
      entryDate: true,
      hoursWorked: true,
      overtimeHours: true,
      leaveHours: true,
    },
  })

  // Group in memory: distinct present/absent days (a teacher may log twice on a
  // date across periods, so count DISTINCT dates, not rows) + hour sums.
  interface Acc {
    present: Set<string>
    absent: Set<string>
    hours: number
    overtime: number
  }
  const acc = new Map<string, Acc>()

  for (const e of entries) {
    let a = acc.get(e.teacherId)
    if (!a) {
      a = { present: new Set(), absent: new Set(), hours: 0, overtime: 0 }
      acc.set(e.teacherId, a)
    }
    const dayKey = e.entryDate.toISOString().slice(0, 10) // date-only, stable
    const worked = Number(e.hoursWorked)
    const leave = Number(e.leaveHours)
    if (worked > 0) a.present.add(dayKey)
    else if (leave > 0) a.absent.add(dayKey)
    a.hours += worked
    a.overtime += Number(e.overtimeHours)
  }

  for (const [teacherId, a] of acc) {
    const daysPresent = a.present.size
    const daysAbsent = a.absent.size
    summaries.set(teacherId, {
      daysWorked: daysPresent + daysAbsent,
      daysPresent,
      daysAbsent,
      hoursWorked: round2(a.hours),
      overtimeHours: round2(a.overtime),
    })
  }

  return summaries
}
