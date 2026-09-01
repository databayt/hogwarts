// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
//
// School-calendar day math for slot-anchored sessions.
//
// A timetable slot is a weekly PATTERN (termId + dayOfWeek + periodId); the
// instants it denotes on a given date depend entirely on the SCHOOL's
// timezone. Every function here is pure and db-free so the boundary cases
// (DST, a school day that straddles the UTC date line) are unit-testable.
//
// NEVER use `setHours()`/`getDay()` for any of this: those read the SERVER's
// timezone, which is UTC on Vercel. That is the bug class the 2026-08-12 pass
// fixed for schedule storage — these helpers close the same hole on the read
// and materialization paths.
import { schoolCalendarDayOf, schoolWallTimeToUtc } from "@/lib/timezone"

/**
 * Fallback when `School.timezone` is somehow unset — matches the Prisma
 * default so a missing value can never silently mean UTC (which on Vercel is
 * the server zone, the exact thing these helpers exist to avoid).
 */
export const DEFAULT_SCHOOL_TZ = "Africa/Khartoum"

/** The UTC instants bounding one school-calendar day: `[start, end)`. */
export function schoolDayWindow(
  timeZone: string,
  date: Date = new Date()
): { start: Date; end: Date } {
  const { year, month, day } = schoolCalendarDayOf(date, timeZone)
  const start = schoolWallTimeToUtc(timeZone, year, month, day, 0, 0)
  // Take the next calendar day through Date.UTC so month/year rollover is
  // handled by the platform, then convert THAT wall date — never `start + 24h`,
  // which is wrong on the 23- and 25-hour days either side of a DST change.
  const next = new Date(Date.UTC(year, month - 1, day + 1))
  const end = schoolWallTimeToUtc(
    timeZone,
    next.getUTCFullYear(),
    next.getUTCMonth() + 1,
    next.getUTCDate(),
    0,
    0
  )
  return { start, end }
}

/** Weekday index (0 = Sunday) of a date in the school's timezone. */
export function schoolDayOfWeek(
  timeZone: string,
  date: Date = new Date()
): number {
  const { year, month, day } = schoolCalendarDayOf(date, timeZone)
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay()
}

/**
 * `Period.startTime`/`endTime` are DateTimes that carry a wall-clock time, read
 * in UTC — the convention `periodTimeString` (queries.ts) already relies on.
 */
export function periodWallTime(t: Date): { hour: number; minute: number } {
  const d = new Date(t)
  return { hour: d.getUTCHours(), minute: d.getUTCMinutes() }
}

/**
 * The UTC instants a period occupies on a given school-calendar day.
 *
 * A period whose end is not after its start (bad seed data, or a slot that
 * would cross midnight) yields `null` rather than a session with an inverted
 * or zero-length schedule — the list layer rejects those outright, and the
 * end-stale cron would treat one as instantly stranded.
 */
export function slotInstantsOn(
  timeZone: string,
  date: Date,
  period: { startTime: Date; endTime: Date }
): { scheduledStart: Date; scheduledEnd: Date } | null {
  const { year, month, day } = schoolCalendarDayOf(date, timeZone)
  const s = periodWallTime(period.startTime)
  const e = periodWallTime(period.endTime)
  const scheduledStart = schoolWallTimeToUtc(
    timeZone,
    year,
    month,
    day,
    s.hour,
    s.minute
  )
  const scheduledEnd = schoolWallTimeToUtc(
    timeZone,
    year,
    month,
    day,
    e.hour,
    e.minute
  )
  if (scheduledEnd.getTime() <= scheduledStart.getTime()) return null
  return { scheduledStart, scheduledEnd }
}

/**
 * Is `date` inside the school-calendar day range `[from, until]`?
 *
 * Day-granular and INCLUSIVE at both ends: a window that runs "today only" is
 * `from = until = today`, and the school stays online for the whole of the
 * last day rather than until whatever wall-clock time the admin happened to
 * pick. `until = null` means "until further notice" — the shape an emergency
 * actually has, since nobody knows on day one when the roads reopen.
 *
 * `from` is REQUIRED for a window to exist. A row with only an `until` is
 * treated as no window at all, so a half-filled form can never silently put a
 * school online forever.
 *
 * Both boundaries are compared as the school-calendar day CONTAINING them, so
 * it makes no difference whether the stored instant is that day's midnight in
 * the school's zone, in UTC, or the moment the admin clicked save.
 */
export function isWithinSchoolDayRange(
  timeZone: string,
  date: Date,
  from: Date | null | undefined,
  until: Date | null | undefined
): boolean {
  if (!from) return false
  const day = schoolDayWindow(timeZone, date).start.getTime()
  if (day < schoolDayWindow(timeZone, from).start.getTime()) return false
  if (until && day > schoolDayWindow(timeZone, until).start.getTime()) {
    return false
  }
  return true
}

/**
 * Turn a `"YYYY-MM-DD"` calendar day into a stable instant inside that day in
 * the SCHOOL's timezone — NOON, deliberately.
 *
 * Midnight would be the obvious choice and is the wrong one: any later
 * rounding, DST shift, or re-read in a slightly different zone can push a
 * midnight instant across the date line, silently moving the window by a day.
 * Noon is ~12 hours from either boundary, so the day round-trips through
 * `schoolDayOfInstant` intact under every offset on earth.
 */
export function schoolDayToInstant(timeZone: string, day: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(day)
  if (!m) return null
  return schoolWallTimeToUtc(
    timeZone,
    Number(m[1]),
    Number(m[2]),
    Number(m[3]),
    12,
    0
  )
}

/** The inverse: the school-calendar day of an instant, as `"YYYY-MM-DD"`. */
export function schoolDayOfInstant(
  timeZone: string,
  date: Date | null | undefined
): string {
  if (!date) return ""
  const { year, month, day } = schoolCalendarDayOf(date, timeZone)
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`
}
