// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * The school's wall clock, not the device's.
 *
 * Period times are the school's wall-clock times (Africa/Khartoum, UTC+2). A
 * teacher or family in Bahrain (UTC+3) reading the device clock sees a 16:00
 * class as started at 15:00 Khartoum time, so the class showed "missed" the
 * moment it began and the Join control vanished. Everything the timetable asks
 * of "now" (minute of day, weekday, calendar date) is read in the school's
 * zone here. Pure on purpose: no imports, safe in any client component.
 */
const DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
const OPTS = {
  weekday: "short",
  year: "numeric",
  month: "numeric",
  day: "numeric",
  hour: "numeric",
  minute: "numeric",
  hourCycle: "h23",
} as const

export function schoolNow(
  timeZone?: string | null,
  at: Date | number = Date.now()
) {
  let p: Intl.DateTimeFormatPart[]
  try {
    p = new Intl.DateTimeFormat("en-US", {
      ...OPTS,
      timeZone: timeZone || undefined,
    }).formatToParts(at)
  } catch {
    p = new Intl.DateTimeFormat("en-US", OPTS).formatToParts(at) // bad zone → the device's
  }
  const n = (t: string) => Number(p.find((x) => x.type === t)?.value)
  return {
    minutesOfDay: (n("hour") % 24) * 60 + n("minute"),
    dayOfWeek: DOW.indexOf(p.find((x) => x.type === "weekday")!.value),
    year: n("year"),
    month: n("month"),
    day: n("day"),
  }
}
export type SchoolNow = ReturnType<typeof schoolNow>
