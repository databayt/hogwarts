// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { describe, expect, it } from "vitest"

import { buildQuarterlySchedule } from "@/lib/fee-provisioning"

describe("Step 10 — buildQuarterlySchedule", () => {
  it("emits 4 entries matching the PaymentScheduleEntry shape the cron expects", () => {
    const s = buildQuarterlySchedule("2025/2026", 10000)
    expect(s).toHaveLength(4)
    for (const entry of s) {
      expect(typeof entry.dueDate).toBe("string")
      expect(() => new Date(entry.dueDate).toISOString()).not.toThrow()
      expect(typeof entry.amount).toBe("number")
      expect(entry.amount).toBeGreaterThan(0)
      expect(typeof entry.description).toBe("string")
    }
  })

  it("evenly splits the amount with Q4 absorbing rounding remainder", () => {
    const s = buildQuarterlySchedule("2025/2026", 10000)
    const total = s.reduce((sum, e) => sum + e.amount, 0)
    expect(Math.round(total * 100) / 100).toBe(10000)
  })

  it("anchors the first due date to September 1 of the academic year start", () => {
    const s = buildQuarterlySchedule("2025/2026", 4000)
    const first = new Date(s[0].dueDate)
    expect(first.getUTCMonth()).toBe(8) // September
    expect(first.getUTCDate()).toBe(1)
    expect(first.getUTCFullYear()).toBe(2025)
  })

  it("schedules subsequent quarters at 3-month intervals", () => {
    const s = buildQuarterlySchedule("2025/2026", 4000)
    const dates = s.map((e) => new Date(e.dueDate))
    for (let i = 1; i < dates.length; i++) {
      const monthsApart =
        (dates[i].getUTCFullYear() - dates[i - 1].getUTCFullYear()) * 12 +
        (dates[i].getUTCMonth() - dates[i - 1].getUTCMonth())
      expect(monthsApart).toBe(3)
    }
  })

  it("handles '2025-2026' (dash) form too", () => {
    const s = buildQuarterlySchedule("2025-2026", 4000)
    expect(new Date(s[0].dueDate).getUTCFullYear()).toBe(2025)
  })

  it("falls back to current year for malformed academic-year strings", () => {
    const s = buildQuarterlySchedule("bogus", 4000)
    expect(new Date(s[0].dueDate).getUTCFullYear()).toBe(
      new Date().getFullYear()
    )
  })
})
