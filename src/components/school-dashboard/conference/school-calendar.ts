// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
//
// "Is the school actually running on this date?"
//
// The materialization sweep needs this and the timetable read path does not,
// and that asymmetry is deliberate. A weekly timetable is a PATTERN: rendering
// the pattern on Eid is cosmetically wrong and costs nothing. Materializing it
// is not — it writes Conference rows, lights up Join buttons, and mails every
// student and guardian a reminder for a class that will never happen. Writes
// are consequential; reads are not. So the holiday gate lives on the write
// side only, and the read-side gap is tracked in ISSUE.md rather than fixed
// here (blanking the grid is a timetable-block change with its own blast
// radius).
//
// The predicate deliberately MIRRORS the one already in
// `src/app/api/cron/build-tomorrow-trips/route.ts` — two crons must not
// disagree about what a holiday is. If one changes, change both.
import "server-only"

import { db } from "@/lib/db"

import { schoolDayWindow } from "./day-window"

/** Exception types that mean "no classes today". */
const CLOSED_TYPES = ["HOLIDAY", "CANCELLED"]

/**
 * Is `date` covered by a HOLIDAY / CANCELLED `ScheduleException` for this
 * school?
 *
 * Overlap is tested against the school-calendar DAY, not the raw instant, so a
 * holiday stored as a bare date still covers the whole of that day in the
 * school's timezone.
 */
export async function isSchoolClosedOn(
  schoolId: string,
  timeZone: string,
  date: Date = new Date()
): Promise<boolean> {
  const { start, end } = schoolDayWindow(timeZone, date)
  const hit = await db.scheduleException.findFirst({
    where: {
      schoolId,
      exceptionType: { in: CLOSED_TYPES },
      // Half-open on our side, inclusive on theirs: an exception overlaps the
      // day when it starts before the day ends and ends at or after the day
      // starts.
      startDate: { lt: end },
      endDate: { gte: start },
    },
    select: { id: true },
  })
  return hit !== null
}
