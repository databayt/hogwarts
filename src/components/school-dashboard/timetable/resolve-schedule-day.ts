// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Fall forward to the next day that actually has classes on it.
 *
 * The phone dashboard's day card (`dashboard/today-timetable.tsx`) and the
 * mobile dashboard's `today_timetable` both need this and must agree: on a
 * Friday the web shows Sunday's classes under a "Next classes" heading, so an
 * app showing an empty Friday is a different product, not a smaller one.
 *
 * Deliberately a SEPARATE module from `today-schedule.ts`: it takes the day
 * loader as an argument rather than importing one, so the web can keep reading
 * through its session-scoped `getTodaySchedule` and the mobile route through
 * the bearer-token `loadTodaySchedule`, with one resolution rule between them.
 */

/**
 * How many days forward to look for a day that has classes.
 *
 * The Sudanese school week runs Sunday to Thursday, so the two-day weekend
 * needs two hops at most; the extra headroom is for a declared holiday sitting
 * against it. The search stops at the FIRST day with classes, so a school day
 * costs exactly one read and only a Friday pays for a second.
 */
export const SCHEDULE_LOOKAHEAD_DAYS = 4

/** The shape the resolver reads — any richer day payload satisfies it. */
export interface ScheduleDayLike {
  schedule: ReadonlyArray<{ timetableId?: string | null }>
  closure?: { title: string; exceptionType: string } | null
}

export interface ScheduleDayResolution<T> {
  /**
   * The first day at or after the start with classes on it — null when none of
   * the days looked at had any.
   */
  resolved: { day: T; offset: number; isToday: boolean } | null
  /** What the loader returned for the start day itself. Always present. */
  today: T
}

/**
 * Read the start day, then the next few, until one of them has classes.
 *
 * Stops immediately when the start day has no periods AT ALL: that means no
 * term and no school week, and looking at tomorrow would ask the same question
 * and get the same answer.
 *
 * A declared holiday still returns the day's PATTERN — the loaders inform
 * rather than blank — so a closed day is skipped the way a weekend is. Showing
 * a closed day's pattern with nothing saying عيد would be a lie, which is why
 * the closure of a day fallen past is never reported to the caller.
 *
 * `load` is called with `undefined` for the start day, exactly as the callers
 * would call their loader for "today".
 */
export async function resolveScheduleDay<T extends ScheduleDayLike>(
  load: (date?: Date) => Promise<T>,
  options?: { lookaheadDays?: number; from?: Date }
): Promise<ScheduleDayResolution<T>> {
  const lookahead = options?.lookaheadDays ?? SCHEDULE_LOOKAHEAD_DAYS
  const start = options?.from ?? new Date()

  let today!: T

  for (let offset = 0; offset <= lookahead; offset += 1) {
    const date = new Date(start)
    date.setDate(date.getDate() + offset)

    const day = await load(offset === 0 ? undefined : date)
    if (offset === 0) today = day

    // No periods at all — no term, no school week. Nothing to look forward to.
    if (day.schedule.length === 0) return { resolved: null, today }

    if (day.closure) continue

    const hasClasses = day.schedule.some((row) => row.timetableId)
    if (!hasClasses) continue

    return { resolved: { day, offset, isToday: offset === 0 }, today }
  }

  return { resolved: null, today }
}
