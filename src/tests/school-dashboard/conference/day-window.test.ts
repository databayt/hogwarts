// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
//
// School-calendar day math. These are the boundaries the old `setHours()` /
// `getDay()` code got wrong: both read the SERVER's zone (UTC on Vercel), so
// any school whose local day straddles the UTC date line resolved the wrong
// day. Every case below is checked from BOTH sides of UTC — a Gulf school
// (UTC+4, no DST), a school far east of UTC (UTC+12/+13, with DST), and one
// west of it (UTC-8/-7, with DST) — because a bug that only shows on one side
// of the meridian is exactly what slipped through before.

import { describe, expect, it } from "vitest"

import {
  isWithinSchoolDayRange,
  periodWallTime,
  schoolDayOfInstant,
  schoolDayOfWeek,
  schoolDayToInstant,
  schoolDayWindow,
  slotInstantsOn,
} from "@/components/school-dashboard/conference/day-window"

/** Period times are stored as UTC wall-clock — the app-wide convention. */
const at = (h: number, m = 0) => new Date(Date.UTC(1970, 0, 1, h, m))

describe("schoolDayWindow", () => {
  it("brackets the school day, not the UTC day (east of UTC)", () => {
    // 01:00 Dubai on Aug 15 is Aug 14 21:00Z — a UTC-day window would have
    // placed this instant on the 14th.
    const { start, end } = schoolDayWindow(
      "Asia/Dubai",
      new Date("2026-08-14T21:00:00Z")
    )
    expect(start.toISOString()).toBe("2026-08-14T20:00:00.000Z")
    expect(end.toISOString()).toBe("2026-08-15T20:00:00.000Z")
  })

  it("brackets the school day west of UTC", () => {
    // 18:00 Los Angeles on Aug 14 is Aug 15 01:00Z — the UTC day has already
    // rolled over while the school day has not.
    const { start, end } = schoolDayWindow(
      "America/Los_Angeles",
      new Date("2026-08-15T01:00:00Z")
    )
    expect(start.toISOString()).toBe("2026-08-14T07:00:00.000Z")
    expect(end.toISOString()).toBe("2026-08-15T07:00:00.000Z")
  })

  it("spans 23 hours across a spring-forward day", () => {
    // Los Angeles loses an hour on 2026-03-08 — `start + 24h` would overshoot
    // into the next day, which is why the helper converts the next wall date.
    const { start, end } = schoolDayWindow(
      "America/Los_Angeles",
      new Date("2026-03-08T20:00:00Z")
    )
    expect((end.getTime() - start.getTime()) / 3_600_000).toBe(23)
  })

  it("spans 25 hours across a fall-back day", () => {
    const { start, end } = schoolDayWindow(
      "America/Los_Angeles",
      new Date("2026-11-01T20:00:00Z")
    )
    expect((end.getTime() - start.getTime()) / 3_600_000).toBe(25)
  })

  it("rolls the month over at a month boundary", () => {
    const { start, end } = schoolDayWindow(
      "Asia/Dubai",
      new Date("2026-08-31T12:00:00Z")
    )
    expect(start.toISOString()).toBe("2026-08-30T20:00:00.000Z")
    expect(end.toISOString()).toBe("2026-08-31T20:00:00.000Z")
  })
})

describe("schoolDayOfWeek", () => {
  it("reads the weekday in the school's zone, not the server's", () => {
    // 2026-08-15 is a Saturday. At 21:00Z on Friday the 14th, Dubai is already
    // on Saturday — a server-side getDay() would still say Friday (5).
    expect(
      schoolDayOfWeek("Asia/Dubai", new Date("2026-08-14T21:00:00Z"))
    ).toBe(6)
    // …and Los Angeles is still on Friday when UTC has moved to Saturday.
    expect(
      schoolDayOfWeek("America/Los_Angeles", new Date("2026-08-15T01:00:00Z"))
    ).toBe(5)
  })
})

describe("slotInstantsOn", () => {
  it("places a period on the school day in school-local time", () => {
    const out = slotInstantsOn("Asia/Dubai", new Date("2026-08-15T06:00:00Z"), {
      startTime: at(8),
      endTime: at(8, 45),
    })
    // 08:00–08:45 Dubai → 04:00–04:45Z.
    expect(out?.scheduledStart.toISOString()).toBe("2026-08-15T04:00:00.000Z")
    expect(out?.scheduledEnd.toISOString()).toBe("2026-08-15T04:45:00.000Z")
  })

  it("anchors to the SCHOOL day even when the reference instant is the day before in UTC", () => {
    const out = slotInstantsOn(
      "Asia/Dubai",
      new Date("2026-08-14T21:00:00Z"), // already Aug 15 in Dubai
      { startTime: at(8), endTime: at(8, 45) }
    )
    expect(out?.scheduledStart.toISOString()).toBe("2026-08-15T04:00:00.000Z")
  })

  it("returns null for a period whose end does not follow its start", () => {
    // Bad seed data must not mint an inverted session: the list layer rejects
    // those, and the end-stale cron would treat one as instantly stranded.
    expect(
      slotInstantsOn("Asia/Dubai", new Date("2026-08-15T06:00:00Z"), {
        startTime: at(10),
        endTime: at(8),
      })
    ).toBeNull()
    expect(
      slotInstantsOn("Asia/Dubai", new Date("2026-08-15T06:00:00Z"), {
        startTime: at(10),
        endTime: at(10),
      })
    ).toBeNull()
  })
})

describe("periodWallTime", () => {
  it("reads the stored wall clock in UTC (the app-wide period convention)", () => {
    expect(periodWallTime(at(7, 45))).toEqual({ hour: 7, minute: 45 })
  })
})

describe("isWithinSchoolDayRange", () => {
  // The emergency window's day math. Boundaries are compared as the
  // school-calendar day CONTAINING them, so it makes no difference whether the
  // stored instant is that day's midnight, UTC midnight, or the moment the
  // admin clicked save.
  const TZ = "Africa/Khartoum" // UTC+2, no DST
  const day = (iso: string) => new Date(iso)

  it("requires a start date — an end alone is no window at all", () => {
    expect(
      isWithinSchoolDayRange(
        TZ,
        day("2026-03-10T09:00:00Z"),
        null,
        day("2026-03-20T00:00:00Z")
      )
    ).toBe(false)
    expect(
      isWithinSchoolDayRange(TZ, day("2026-03-10T09:00:00Z"), null, null)
    ).toBe(false)
  })

  it("is inclusive at BOTH ends", () => {
    const from = day("2026-03-10T00:00:00Z")
    const until = day("2026-03-12T00:00:00Z")
    // First day, last day, and a day in between.
    expect(
      isWithinSchoolDayRange(TZ, day("2026-03-10T05:00:00Z"), from, until)
    ).toBe(true)
    expect(
      isWithinSchoolDayRange(TZ, day("2026-03-11T23:00:00Z"), from, until)
    ).toBe(true)
    expect(
      isWithinSchoolDayRange(TZ, day("2026-03-12T21:30:00Z"), from, until)
    ).toBe(true)
    // …and closed the day after.
    expect(
      isWithinSchoolDayRange(TZ, day("2026-03-13T05:00:00Z"), from, until)
    ).toBe(false)
  })

  it("runs indefinitely with no end date", () => {
    const from = day("2026-03-10T00:00:00Z")
    expect(
      isWithinSchoolDayRange(TZ, day("2027-01-01T09:00:00Z"), from, null)
    ).toBe(true)
    expect(
      isWithinSchoolDayRange(TZ, day("2026-03-09T09:00:00Z"), from, null)
    ).toBe(false)
  })
})

describe("schoolDayToInstant / schoolDayOfInstant", () => {
  it("round-trips a calendar day through any timezone", () => {
    // Noon, not midnight: a midnight instant can be pushed across the date
    // line by any later rounding or offset read, silently moving a window by a
    // day. Every zone below is a different sign and size of offset.
    for (const tz of [
      "Africa/Khartoum", // UTC+2
      "Pacific/Kiritimati", // UTC+14, the extreme east
      "Pacific/Midway", // UTC-11, the extreme west
      "America/New_York", // DST
      "Asia/Kathmandu", // :45 offset
    ]) {
      for (const d of [
        "2026-01-01",
        "2026-03-10",
        "2026-11-01",
        "2026-12-31",
      ]) {
        const instant = schoolDayToInstant(tz, d)
        expect(instant).not.toBeNull()
        expect(schoolDayOfInstant(tz, instant)).toBe(d)
      }
    }
  })

  it("rejects anything that is not a calendar day, and formats no date as ''", () => {
    expect(schoolDayToInstant("Africa/Khartoum", "")).toBeNull()
    expect(schoolDayToInstant("Africa/Khartoum", "10/03/2026")).toBeNull()
    expect(schoolDayOfInstant("Africa/Khartoum", null)).toBe("")
  })
})
