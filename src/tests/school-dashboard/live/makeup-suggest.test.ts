// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
//
// Make-up class slot math (makeup-suggest.ts) — pure, so every boundary is
// asserted against fixed instants. School zone Africa/Khartoum is UTC+2 with no
// DST; 2026-11-22 is a Sunday.

import { describe, expect, it } from "vitest"

import {
  MAKEUP_LATEST_END_HOUR,
  suggestMakeupSlots,
  type BellPeriod,
  type SuggestMakeupInput,
  type WeeklyBusySlot,
} from "@/components/school-dashboard/live/makeup-suggest"

const KRT = "Africa/Khartoum"
const wall = (h: number, m = 0) => new Date(Date.UTC(1970, 0, 1, h, m))
const period = (id: string, h: number, m: number, endH: number, endM: number) =>
  ({
    id,
    name: id,
    startTime: wall(h, m),
    endTime: wall(endH, endM),
  }) satisfies BellPeriod
const slot = (
  dayOfWeek: number,
  h: number,
  m: number,
  eh: number,
  em: number
) =>
  ({
    dayOfWeek,
    startTime: wall(h, m),
    endTime: wall(eh, em),
  }) satisfies WeeklyBusySlot

const P1 = period("p1", 8, 0, 8, 45)
const P2 = period("p2", 9, 0, 9, 45)
const P3 = period("p3", 10, 0, 10, 45)

// Sunday 06:00 Khartoum.
const SUN_06 = new Date("2026-11-22T04:00:00Z")

const base = (over: Partial<SuggestMakeupInput> = {}): SuggestMakeupInput => ({
  now: SUN_06,
  timeZone: KRT,
  horizonDays: 7,
  limit: 50,
  durationMin: 45,
  workingDays: [0, 1, 2, 3, 4],
  closures: [],
  periods: [P1, P2, P3],
  weeklySlots: [],
  busy: [],
  ...over,
})

/** Every candidate start of a day as "HH:MM" Khartoum time. */
const startsOf = (day: { slots: { start: Date }[] }) =>
  day.slots.map((s) =>
    new Date(s.start.getTime() + 2 * 3_600_000).toISOString().slice(11, 16)
  )

describe("suggestMakeupSlots", () => {
  it("offers every free period, soonest first, grouped by school day", () => {
    const days = suggestMakeupSlots(base({ horizonDays: 2 }))
    expect(days.map((d) => d.day)).toEqual(["2026-11-22", "2026-11-23"])
    expect(startsOf(days[0])).toEqual(["08:00", "09:00", "10:00"])
    expect(days[0].slots.every((s) => s.kind === "period")).toBe(true)
    expect(days[0].slots[0].periodId).toBe("p1")
  })

  it("skips a period the TEACHER teaches (weekly slot) — on that weekday only", () => {
    const days = suggestMakeupSlots(
      base({ horizonDays: 2, weeklySlots: [slot(0, 8, 0, 8, 45)] })
    )
    const periods = (d: (typeof days)[number]) =>
      d.slots.filter((s) => s.kind === "period").map((s) => s.periodId)
    expect(periods(days[0])).toEqual(["p2", "p3"])
    // Monday (dow 1) is untouched.
    expect(periods(days[1])).toEqual(["p1", "p2", "p3"])
  })

  it("skips a period the SECTION is busy in — a concrete session overlapping it", () => {
    const days = suggestMakeupSlots(
      base({
        horizonDays: 1,
        busy: [
          {
            start: new Date("2026-11-22T06:30:00Z"), // 08:30 KRT, overlaps P1
            end: new Date("2026-11-22T07:10:00Z"), // 09:10, overlaps P2
          },
        ],
      })
    )
    const periods = days[0].slots.filter((s) => s.kind === "period")
    expect(periods.map((s) => s.periodId)).toEqual(["p3"])
  })

  it("treats a sibling section of a combined class as busy too", () => {
    // The caller passes the teacher's slots AND every group section's slots;
    // here only the sibling (G8) has the 09:00 period.
    const days = suggestMakeupSlots(
      base({ horizonDays: 1, weeklySlots: [slot(0, 9, 0, 9, 45)] })
    )
    expect(
      days[0].slots.filter((s) => s.kind === "period").map((s) => s.periodId)
    ).toEqual(["p1", "p3"])
  })

  it("lets two spans that only touch coexist", () => {
    const days = suggestMakeupSlots(
      base({ horizonDays: 1, weeklySlots: [slot(0, 8, 45, 9, 0)] })
    )
    expect(startsOf(days[0])).toEqual(["08:00", "09:00", "10:00"])
  })

  it("skips a closure day entirely", () => {
    const days = suggestMakeupSlots(
      base({
        horizonDays: 3,
        closures: [
          {
            startDate: new Date("2026-11-21T22:00:00Z"), // Sun 00:00 KRT
            endDate: new Date("2026-11-22T21:59:59Z"), // Sun 23:59 KRT
          },
        ],
      })
    )
    expect(days.map((d) => d.day)).toEqual(["2026-11-23", "2026-11-24"])
  })

  it("skips a non-working day (Friday/Saturday here)", () => {
    // Thursday 2026-11-26 06:00 KRT, horizon over the weekend.
    const days = suggestMakeupSlots(
      base({ now: new Date("2026-11-26T04:00:00Z"), horizonDays: 4 })
    )
    expect(days.map((d) => d.day)).toEqual(["2026-11-26", "2026-11-29"])
  })

  it("starts nothing earlier than now + 30 minutes", () => {
    // 08:40 KRT → earliest 09:10: P2 (09:00) is out, P3 (10:00) is in.
    const days = suggestMakeupSlots(
      base({ now: new Date("2026-11-22T06:40:00Z"), horizonDays: 1 })
    )
    expect(startsOf(days[0])).toEqual(["10:00"])
    // Exactly now + 30 is allowed.
    const exact = suggestMakeupSlots(
      base({ now: new Date("2026-11-22T06:30:00Z"), horizonDays: 1 })
    )
    expect(startsOf(exact[0])).toEqual(["09:00", "10:00"])
  })

  it("follows the SCHOOL's day boundary, not the viewer's zone", () => {
    // 20:00Z is 22:00 Saturday in Khartoum but already 00:00 Sunday in Dubai.
    const now = new Date("2026-11-21T20:00:00Z")
    const late = period("late", 23, 0, 23, 45)
    const input = base({
      now,
      horizonDays: 2,
      workingDays: [0, 1, 2, 3, 4, 5, 6],
      periods: [P1, late],
    })
    const khartoum = suggestMakeupSlots({
      ...input,
      timeZone: "Africa/Khartoum",
    })
    expect(khartoum[0].day).toBe("2026-11-21")
    expect(khartoum[0].dayOfWeek).toBe(6)
    expect(khartoum[0].slots[0].start.toISOString()).toBe(
      "2026-11-21T21:00:00.000Z"
    )

    const dubai = suggestMakeupSlots({ ...input, timeZone: "Asia/Dubai" })
    expect(dubai[0].day).toBe("2026-11-22")
    expect(dubai[0].dayOfWeek).toBe(0)
    expect(dubai[0].slots[0].start.toISOString()).toBe(
      "2026-11-22T04:00:00.000Z"
    )
  })

  it("offers one 'after the last class' slot at the missed class's length", () => {
    // Teacher teaches all three periods on Sunday: nothing free in the bell.
    const days = suggestMakeupSlots(
      base({
        horizonDays: 1,
        durationMin: 45,
        weeklySlots: [
          slot(0, 8, 0, 8, 45),
          slot(0, 9, 0, 9, 45),
          slot(0, 10, 0, 10, 45),
        ],
      })
    )
    expect(days).toHaveLength(1)
    expect(days[0].slots).toHaveLength(1)
    const [s] = days[0].slots
    expect(s.kind).toBe("after_last")
    expect(s.periodId).toBeNull()
    expect(startsOf(days[0])).toEqual(["10:45"])
    expect((s.end.getTime() - s.start.getTime()) / 60_000).toBe(45)
  })

  it("takes the latest end across teacher AND sections, rounded up to 5 minutes", () => {
    const days = suggestMakeupSlots(
      base({
        horizonDays: 1,
        durationMin: 30,
        periods: [],
        weeklySlots: [slot(0, 8, 0, 8, 45)],
        busy: [
          {
            start: new Date("2026-11-22T07:00:00Z"),
            end: new Date("2026-11-22T07:48:00Z"), // 09:48 KRT
          },
        ],
      })
    )
    expect(startsOf(days[0])).toEqual(["09:50"])
  })

  it("never offers an 'after the last class' slot ending after the latest-end hour", () => {
    const days = suggestMakeupSlots(
      base({
        horizonDays: 1,
        durationMin: 45,
        periods: [],
        weeklySlots: [slot(0, 20, 30, 21, 30)], // ends 21:30 → 22:15 is too late
      })
    )
    expect(MAKEUP_LATEST_END_HOUR).toBe(22)
    expect(days).toEqual([])
  })

  it("offers no 'after the last class' slot on a day without any class", () => {
    const days = suggestMakeupSlots(base({ horizonDays: 1, periods: [] }))
    expect(days).toEqual([])
  })

  it("collapses periods of two grades that ring at the same time", () => {
    const days = suggestMakeupSlots(
      base({ horizonDays: 1, periods: [P1, { ...P1, id: "p1-g2" }, P2] })
    )
    expect(startsOf(days[0])).toEqual(["08:00", "09:00"])
  })

  it("ignores break and untimed periods", () => {
    const days = suggestMakeupSlots(
      base({
        horizonDays: 1,
        periods: [P1, { ...P2, isBreak: true }, { ...P3, untimed: true }],
      })
    )
    expect(startsOf(days[0])).toEqual(["08:00"])
  })

  it("stops at the limit, soonest first, across days", () => {
    const days = suggestMakeupSlots(base({ limit: 4, horizonDays: 7 }))
    const all = days.flatMap((d) => d.slots)
    expect(all).toHaveLength(4)
    expect(days.map((d) => d.day)).toEqual(["2026-11-22", "2026-11-23"])
    expect(days[1].slots).toHaveLength(1)
    const times = all.map((s) => s.start.getTime())
    expect(times).toEqual([...times].sort((a, b) => a - b))
  })

  it("offers nothing for a class longer than the school's maximum", () => {
    expect(
      suggestMakeupSlots(base({ durationMin: 130, maxDurationMin: 120 }))
    ).toEqual([])
  })
})
