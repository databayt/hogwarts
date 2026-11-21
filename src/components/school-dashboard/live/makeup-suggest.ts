// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
//
// Make-up class («حصة تعويضية») — the slot math. PURE: no db, no clock of its
// own (`now` is an input), so every boundary is unit-testable.
//
// Given what a teacher and a section(s) are already busy with, it lists the
// times a replacement class could go: soonest first, grouped by SCHOOL day.
// Every instant is derived from the school's timezone through the day-window /
// timezone helpers — never `setHours()` / `getDay()` (the server is UTC), and
// never the viewer's zone: a school in Africa/Khartoum asked from a phone set
// to Asia/Dubai still walks Khartoum days.
//
// Candidates per day:
//   (a) each period of the section's bell that is free for the teacher AND
//       every section of the class;
//   (b) one "after the last class" candidate: the missed class's duration,
//       starting when both sides are free after their last busy interval of
//       the day, bounded by LATEST_END_HOUR.
//
// NOT modelled in v1 (on purpose, to be added if a school asks):
//   - rotation weeks (Timetable.rotationWeek A/B): every weekly slot is
//     treated as busy every week, which can only hide a free time, never offer
//     a clashing one;
//   - a covered teacher's freed slots: when another teacher covers the
//     teacher's slot (the timetable's SubstitutionRecord — a different feature
//     from this one) the teacher is really free then, but the slot still
//     counts as busy here.
import { schoolCalendarDayOf, schoolWallTimeToUtc } from "@/lib/timezone"

import { periodWallTime } from "./day-window"

/** No candidate starts earlier than this long after `now` — time to notify. */
export const MAKEUP_LEAD_MINUTES = 30
/** The "after the last class" candidate must END by this hour, school time. */
export const MAKEUP_LATEST_END_HOUR = 22
/** The "after the last class" start is rounded up to this many minutes. */
const ROUND_MINUTES = 5

export type Interval = { start: Date; end: Date }

/** A bell period: `startTime` / `endTime` carry a wall clock read in UTC. */
export type BellPeriod = {
  id: string
  name: string
  startTime: Date
  endTime: Date
  isBreak?: boolean
  untimed?: boolean
}

/** A weekly timetable slot reduced to when it rings. */
export type WeeklyBusySlot = {
  /** 0 = Sunday … 6 = Saturday, as `Timetable.dayOfWeek`. */
  dayOfWeek: number
  startTime: Date
  endTime: Date
}

export type ClosureRange = { startDate: Date; endDate: Date }

export type MakeupCandidate = {
  start: Date
  end: Date
  kind: "period" | "after_last"
  periodId: string | null
  periodName: string | null
}

export type MakeupDay = {
  /** The school-calendar day, `"YYYY-MM-DD"`. */
  day: string
  dayOfWeek: number
  slots: MakeupCandidate[]
}

export type SuggestMakeupInput = {
  now: Date
  timeZone: string
  horizonDays: number
  limit: number
  /** The missed class's length — the "after the last class" candidate's size. */
  durationMin: number
  /** The school's cap; a candidate longer than this is never offered. */
  maxDurationMin?: number
  workingDays: number[]
  closures: ClosureRange[]
  periods: BellPeriod[]
  /** Teacher's weekly slots + every section's weekly slots. */
  weeklySlots: WeeklyBusySlot[]
  /** Concrete sessions in the horizon (teacher's or any section's). */
  busy: Interval[]
}

export function intervalsOverlap(a: Interval, b: Interval): boolean {
  return (
    a.start.getTime() < b.end.getTime() && b.start.getTime() < a.end.getTime()
  )
}

/** The wall-clock span of a period (or slot) on a given school day. */
export function spanOnDay(
  timeZone: string,
  day: { year: number; month: number; day: number },
  p: { startTime: Date; endTime: Date }
): Interval | null {
  const s = periodWallTime(p.startTime)
  const e = periodWallTime(p.endTime)
  const start = schoolWallTimeToUtc(
    timeZone,
    day.year,
    day.month,
    day.day,
    s.hour,
    s.minute
  )
  const end = schoolWallTimeToUtc(
    timeZone,
    day.year,
    day.month,
    day.day,
    e.hour,
    e.minute
  )
  // A span that does not run forward (bad data, or one crossing midnight) is
  // no span: it would otherwise blank a whole day or offer a negative class.
  return end.getTime() > start.getTime() ? { start, end } : null
}

function dayKey(d: { year: number; month: number; day: number }): string {
  return `${d.year}-${String(d.month).padStart(2, "0")}-${String(d.day).padStart(2, "0")}`
}

/**
 * The busy intervals the WEEKLY slots make on a school day: the same slot
 * rows the timetable draws, turned into instants on that date.
 */
export function weeklyBusyOn(
  timeZone: string,
  day: { year: number; month: number; day: number },
  dayOfWeek: number,
  slots: WeeklyBusySlot[]
): Interval[] {
  const out: Interval[] = []
  for (const s of slots) {
    if (s.dayOfWeek !== dayOfWeek) continue
    const span = spanOnDay(timeZone, day, s)
    if (span) out.push(span)
  }
  return out
}

export function suggestMakeupSlots(input: SuggestMakeupInput): MakeupDay[] {
  const {
    now,
    timeZone,
    horizonDays,
    limit,
    durationMin,
    workingDays,
    closures,
    weeklySlots,
    busy,
  } = input
  const out: MakeupDay[] = []
  if (limit <= 0 || horizonDays <= 0 || durationMin <= 0) return out
  if (input.maxDurationMin && durationMin > input.maxDurationMin) return out

  const earliest = now.getTime() + MAKEUP_LEAD_MINUTES * 60_000
  const first = schoolCalendarDayOf(now, timeZone)
  const working = new Set(workingDays)

  // Timed, teaching periods only; two grades' periods ringing at the same
  // clock time are one choice, not two.
  const seen = new Set<string>()
  const periods = input.periods
    .filter((p) => !p.isBreak && !p.untimed)
    .filter((p) => {
      const key = `${p.startTime.getTime()}-${p.endTime.getTime()}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
    .sort((a, b) => a.startTime.getTime() - b.startTime.getTime())

  let count = 0
  for (let i = 0; i < horizonDays && count < limit; i++) {
    // Calendar arithmetic through Date.UTC: month and year roll over by
    // themselves, and it is never `+ 24h` (wrong on a DST day).
    const rolled = new Date(
      Date.UTC(first.year, first.month - 1, first.day + i)
    )
    const day = {
      year: rolled.getUTCFullYear(),
      month: rolled.getUTCMonth() + 1,
      day: rolled.getUTCDate(),
    }
    const dayOfWeek = rolled.getUTCDay()
    if (!working.has(dayOfWeek)) continue

    const dayStart = schoolWallTimeToUtc(
      timeZone,
      day.year,
      day.month,
      day.day,
      0,
      0
    )
    const next = new Date(Date.UTC(day.year, day.month - 1, day.day + 1))
    const dayEnd = schoolWallTimeToUtc(
      timeZone,
      next.getUTCFullYear(),
      next.getUTCMonth() + 1,
      next.getUTCDate(),
      0,
      0
    )
    // Same overlap rule as findSchoolClosure: starts before the day ends and
    // ends at or after the day starts.
    if (
      closures.some(
        (c) =>
          c.startDate.getTime() < dayEnd.getTime() &&
          c.endDate.getTime() >= dayStart.getTime()
      )
    ) {
      continue
    }

    const dayBusy: Interval[] = [
      ...weeklyBusyOn(timeZone, day, dayOfWeek, weeklySlots),
      ...busy.filter((b) =>
        intervalsOverlap(b, { start: dayStart, end: dayEnd })
      ),
    ]
    const free = (iv: Interval) => !dayBusy.some((b) => intervalsOverlap(iv, b))

    const slots: MakeupCandidate[] = []
    for (const p of periods) {
      const span = spanOnDay(timeZone, day, p)
      if (!span) continue
      if (span.start.getTime() < earliest) continue
      const minutes = (span.end.getTime() - span.start.getTime()) / 60_000
      if (input.maxDurationMin && minutes > input.maxDurationMin) continue
      if (!free(span)) continue
      slots.push({
        ...span,
        kind: "period",
        periodId: p.id,
        periodName: p.name,
      })
    }

    // (b) After the last class: nothing to follow on a day with no class.
    if (dayBusy.length > 0) {
      const lastEnd = Math.max(...dayBusy.map((b) => b.end.getTime()))
      let startMs = Math.max(lastEnd, earliest)
      const step = ROUND_MINUTES * 60_000
      startMs = Math.ceil(startMs / step) * step
      const endMs = startMs + durationMin * 60_000
      const latestEnd = schoolWallTimeToUtc(
        timeZone,
        day.year,
        day.month,
        day.day,
        MAKEUP_LATEST_END_HOUR,
        0
      ).getTime()
      const cand = { start: new Date(startMs), end: new Date(endMs) }
      if (
        endMs <= latestEnd &&
        startMs >= dayStart.getTime() &&
        free(cand) &&
        !slots.some((s) => s.start.getTime() === startMs)
      ) {
        slots.push({
          ...cand,
          kind: "after_last",
          periodId: null,
          periodName: null,
        })
      }
    }

    if (slots.length === 0) continue
    slots.sort((a, b) => a.start.getTime() - b.start.getTime())
    const room = limit - count
    const kept = slots.slice(0, room)
    count += kept.length
    out.push({ day: dayKey(day), dayOfWeek, slots: kept })
  }
  return out
}
