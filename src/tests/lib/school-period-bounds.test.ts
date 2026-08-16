// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { describe, expect, it } from "vitest"

import {
  schoolEndOfMonth,
  schoolEndOfYear,
  schoolMonthsBack,
  schoolStartOfMonth,
  schoolStartOfYear,
} from "@/lib/timezone"

/**
 * These guard the bug class that `date-fns`' startOfMonth/endOfMonth carry:
 * they resolve against the RUNTIME's zone, so on Vercel (UTC) every period
 * figure was off by the school's offset at both edges.
 */
describe("period bounds in the school's own zone", () => {
  const DUBAI = "Asia/Dubai" // UTC+4, no DST
  const mid = new Date("2026-08-14T10:00:00Z")

  it("starts the month at local midnight, not UTC midnight", () => {
    expect(schoolStartOfMonth(DUBAI, mid).toISOString()).toBe(
      "2026-07-31T20:00:00.000Z"
    )
    expect(schoolStartOfMonth("UTC", mid).toISOString()).toBe(
      "2026-08-01T00:00:00.000Z"
    )
  })

  it("ends the month EXCLUSIVE — the first instant of the next one", () => {
    // Not 23:59:59.999. Callers must query `lt`, never `lte`.
    expect(schoolEndOfMonth(DUBAI, mid).toISOString()).toBe(
      "2026-08-31T20:00:00.000Z"
    )
  })

  it("rolls the year over when stepping back past January", () => {
    const jan = new Date("2026-01-15T10:00:00Z")
    // Quarter-to-date from January reaches back to the previous November.
    expect(schoolMonthsBack(DUBAI, jan, 2).toISOString()).toBe(
      "2025-10-31T20:00:00.000Z"
    )
  })

  it("does not roll over when it does not need to", () => {
    expect(schoolMonthsBack(DUBAI, mid, 2).toISOString()).toBe(
      "2026-05-31T20:00:00.000Z"
    )
  })

  it("bounds the year in the school's zone, exclusive at the top", () => {
    expect(schoolStartOfYear(DUBAI, mid).toISOString()).toBe(
      "2025-12-31T20:00:00.000Z"
    )
    expect(schoolEndOfYear(DUBAI, mid).toISOString()).toBe(
      "2026-12-31T20:00:00.000Z"
    )
  })

  it("handles a zone west of UTC too", () => {
    const NY = "America/New_York" // UTC-4 in August
    expect(schoolStartOfMonth(NY, mid).toISOString()).toBe(
      "2026-08-01T04:00:00.000Z"
    )
  })
})
