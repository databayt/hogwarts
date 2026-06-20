// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
//
// Absence-aware re-routing input. A student is "out of the equation" for a given
// day when EITHER attendance marks them away that day OR an approved absence
// intention (any reason — incl. the transport-specific "skip pickup") covers it.
// Used by the nightly trip builder to drop absent riders and re-optimize.

import "server-only"

import { db } from "@/lib/db"

/** Normalize to UTC midnight so it matches `@db.Date` columns. */
export function startOfUTCDay(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))
}

/**
 * Set of studentIds who will NOT ride on `date`:
 *  - Attendance for that date marked ABSENT / EXCUSED / SICK
 *  - an APPROVED AbsenceIntention whose [dateFrom, dateTo] covers the date
 *    (the guardian "skip pickup" flow creates these with reason=TRANSPORTATION)
 */
export async function getAbsentStudentIdsForDate(
  schoolId: string,
  date: Date
): Promise<Set<string>> {
  const day = startOfUTCDay(date)
  const [attendance, intentions] = await Promise.all([
    db.attendance.findMany({
      where: {
        schoolId,
        date: day,
        status: { in: ["ABSENT", "EXCUSED", "SICK"] },
      },
      select: { studentId: true },
    }),
    db.absenceIntention.findMany({
      where: {
        schoolId,
        status: "APPROVED",
        dateFrom: { lte: day },
        dateTo: { gte: day },
      },
      select: { studentId: true },
    }),
  ])

  const set = new Set<string>()
  for (const a of attendance) set.add(a.studentId)
  for (const i of intentions) set.add(i.studentId)
  return set
}
