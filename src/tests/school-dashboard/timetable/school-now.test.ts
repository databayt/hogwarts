// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { describe, expect, it } from "vitest"

import { schoolNow } from "@/components/school-dashboard/timetable/school-now"

describe("schoolNow", () => {
  const at = new Date("2026-11-21T14:55:00Z")

  it("reads the clock in the school's zone, whatever the device", () => {
    expect(schoolNow("Africa/Khartoum", at)).toMatchObject({
      minutesOfDay: 1015,
      dayOfWeek: 6,
    })
    expect(schoolNow("Asia/Riyadh", at).minutesOfDay).toBe(1075)
    expect(schoolNow("Asia/Dubai", at).minutesOfDay).toBe(1135)
  })

  it("rolls the weekday and date with the school's midnight", () => {
    expect(
      schoolNow("Africa/Khartoum", new Date("2026-11-21T22:30:00Z"))
    ).toMatchObject({ minutesOfDay: 30, dayOfWeek: 0, day: 22 })
  })

  it("midnight is minute 0, not 1440", () => {
    expect(
      schoolNow("Africa/Khartoum", new Date("2026-11-21T22:00:00Z"))
        .minutesOfDay
    ).toBe(0)
  })

  it("a bad or missing zone does not throw", () => {
    expect(() => schoolNow("Not/AZone", at)).not.toThrow()
    expect(() => schoolNow(undefined, at)).not.toThrow()
    expect(() => schoolNow(null, at)).not.toThrow()
  })
})
