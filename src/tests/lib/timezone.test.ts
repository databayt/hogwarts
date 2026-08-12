// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
//
// Precise wall-time ⇄ instant conversions. These MUST hold regardless of the
// server's own TZ (Vercel = UTC, dev laptops = anything): the conference
// wizard stores scheduledStart/End through them, and the reminder/live-now
// windows compare those instants against now.

import { describe, expect, it } from "vitest"

import {
  schoolCalendarDayOf,
  schoolTimeStringOf,
  schoolWallTimeToUtc,
} from "@/lib/timezone"

describe("schoolWallTimeToUtc", () => {
  it("converts a Dubai wall time to the UTC instant (+04:00, no DST)", () => {
    const d = schoolWallTimeToUtc("Asia/Dubai", 2026, 8, 12, 10, 0)
    expect(d.toISOString()).toBe("2026-08-12T06:00:00.000Z")
  })

  it("converts a Khartoum wall time to the UTC instant (+02:00 CAT)", () => {
    const d = schoolWallTimeToUtc("Africa/Khartoum", 2026, 8, 12, 10, 0)
    expect(d.toISOString()).toBe("2026-08-12T08:00:00.000Z")
  })

  it("is the identity for UTC", () => {
    const d = schoolWallTimeToUtc("UTC", 2026, 8, 12, 10, 30)
    expect(d.toISOString()).toBe("2026-08-12T10:30:00.000Z")
  })

  it("honors DST where the zone has it (Europe/London)", () => {
    const summer = schoolWallTimeToUtc("Europe/London", 2026, 8, 12, 10, 0)
    expect(summer.toISOString()).toBe("2026-08-12T09:00:00.000Z") // BST +1
    const winter = schoolWallTimeToUtc("Europe/London", 2026, 1, 12, 10, 0)
    expect(winter.toISOString()).toBe("2026-01-12T10:00:00.000Z") // GMT
  })

  it("crosses the day boundary correctly for early wall times east of UTC", () => {
    const d = schoolWallTimeToUtc("Asia/Dubai", 2026, 8, 12, 1, 0)
    expect(d.toISOString()).toBe("2026-08-11T21:00:00.000Z")
  })
})

describe("schoolCalendarDayOf", () => {
  it("recovers the picked day from a browser-local-midnight instant (Dubai)", () => {
    // A Dubai browser picking Aug 12 sends midnight local = Aug 11 20:00Z.
    const instant = new Date("2026-08-11T20:00:00.000Z")
    expect(schoolCalendarDayOf(instant, "Asia/Dubai")).toEqual({
      year: 2026,
      month: 8,
      day: 12,
    })
  })

  it("keeps the same day for a UTC-midnight instant in +02:00", () => {
    const instant = new Date("2026-06-01T00:00:00.000Z")
    expect(schoolCalendarDayOf(instant, "Africa/Khartoum")).toEqual({
      year: 2026,
      month: 6,
      day: 1,
    })
  })
})

describe("schoolTimeStringOf", () => {
  it("renders the wall clock of an instant in the school zone", () => {
    expect(
      schoolTimeStringOf(new Date("2026-08-12T06:00:00.000Z"), "Asia/Dubai")
    ).toBe("10:00")
    expect(
      schoolTimeStringOf(new Date("2026-08-12T06:05:00.000Z"), "UTC")
    ).toBe("06:05")
  })

  it("round-trips with schoolWallTimeToUtc", () => {
    const instant = schoolWallTimeToUtc("Africa/Khartoum", 2026, 12, 31, 23, 45)
    expect(schoolTimeStringOf(instant, "Africa/Khartoum")).toBe("23:45")
    expect(schoolCalendarDayOf(instant, "Africa/Khartoum")).toEqual({
      year: 2026,
      month: 12,
      day: 31,
    })
  })
})
