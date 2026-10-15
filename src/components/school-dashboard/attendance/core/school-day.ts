// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Server-side "today" for attendance writes, in the SCHOOL's timezone.
 *
 * Attendance rows are stored at midnight UTC of the school's calendar day
 * (what the class list sends). `setHours(0,0,0,0)` / `toDateString()` read
 * the server's zone instead, which put scans made just after local midnight
 * on the previous day. Timestamps (kiosk logs, hall passes) are bounded by
 * the school day's real UTC window.
 */
import { db } from "@/lib/db"
import { schoolTimeStringOf } from "@/lib/timezone"
import {
  DEFAULT_SCHOOL_TZ,
  schoolDayOfInstant,
  schoolDayWindow,
} from "@/components/school-dashboard/live/day-window"

export async function getSchoolTimeZone(schoolId: string): Promise<string> {
  try {
    const school = await db.school.findUnique({
      where: { id: schoolId },
      select: { timezone: true },
    })
    return school?.timezone || DEFAULT_SCHOOL_TZ
  } catch {
    // A missing row (or a test double without `school`) must not block a
    // scan — fall back to the schema default.
    return DEFAULT_SCHOOL_TZ
  }
}

export interface SchoolToday {
  timeZone: string
  /** Midnight UTC of the school's calendar day — the `Attendance.date` value. */
  day: Date
  /** The school day's real instants, `[start, end)`, for timestamp ranges. */
  start: Date
  end: Date
  /** School wall-clock "HH:mm" now. */
  wallTime: string
}

export async function schoolToday(
  schoolId: string,
  now: Date = new Date()
): Promise<SchoolToday> {
  const timeZone = await getSchoolTimeZone(schoolId)
  const { start, end } = schoolDayWindow(timeZone, now)
  return {
    timeZone,
    day: new Date(`${schoolDayOfInstant(timeZone, now)}T00:00:00.000Z`),
    start,
    end,
    wallTime: schoolTimeStringOf(now, timeZone),
  }
}
