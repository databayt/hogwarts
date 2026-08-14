// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
//
// "Is the school actually running on this date?"
//
// ONE predicate, three callers, deliberately reacting DIFFERENTLY:
//
//   - the conference materialization sweep SUPPRESSES. It writes Conference
//     rows, lights up Join buttons, and mails every student and guardian a
//     reminder — none of which should happen for a class on Eid.
//   - the transportation `build-tomorrow-trips` cron SUPPRESSES, same reason.
//   - the timetable today-schedule INFORMS: it returns the closure alongside
//     the normal day so the views can say "school is closed — عيد الفطر"
//     while still showing the pattern.
//
// The read path informs rather than blanks on purpose. A weekly timetable is a
// PATTERN, and `ScheduleException` rows are hand-entered and easy to get
// wrong; blanking the hottest read path on a stale row would take a school's
// whole timetable away with no explanation. Suppressing a WRITE is recoverable
// (the next sweep re-materializes); hiding a read just looks broken.
//
// Lives in the conference block because that is where it was first needed and
// where `schoolDayWindow` lives; timetable already imports from
// `conference/day-window`, so the dependency direction is established.
import "server-only"

import { db } from "@/lib/db"

import { schoolDayWindow } from "./day-window"

/** Exception types that mean "no classes today". */
const CLOSED_TYPES = ["HOLIDAY", "CANCELLED"]

/** The closure covering a date, or null. `title` is what the UI names. */
export type SchoolClosure = {
  title: string
  /** HOLIDAY or CANCELLED — the two types that mean "no classes". */
  exceptionType: string
}

/**
 * The HOLIDAY / CANCELLED `ScheduleException` covering `date` for this school,
 * or null.
 *
 * Overlap is tested against the school-calendar DAY, not the raw instant, so a
 * holiday stored as a bare date still covers the whole of that day in the
 * school's timezone.
 *
 * Returns the row rather than a boolean because the two callers want different
 * things from it: the materialization sweep only asks whether to stop, while
 * the timetable read path names the closure to the reader.
 */
export async function findSchoolClosure(
  schoolId: string,
  timeZone: string,
  date: Date = new Date()
): Promise<SchoolClosure | null> {
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
    select: { title: true, exceptionType: true },
    // Deterministic when two exceptions overlap one day.
    orderBy: { startDate: "asc" },
  })
  return hit
}

/** Boolean convenience for the write side, which only asks whether to stop. */
export async function isSchoolClosedOn(
  schoolId: string,
  timeZone: string,
  date: Date = new Date()
): Promise<boolean> {
  return (await findSchoolClosure(schoolId, timeZone, date)) !== null
}
