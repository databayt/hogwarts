// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { describe, expect, it } from "vitest"

import {
  DEFAULT_ASSIGNMENT_TIME_ZONE,
  formatAssignmentDate,
} from "@/components/school-dashboard/listings/assignments/date"

describe("formatAssignmentDate on the school's clock", () => {
  // Khartoum is UTC+2 all year.
  const lateEvening = new Date("2026-11-15T21:30:00Z") // 23:30 in Khartoum
  const pastMidnight = new Date("2026-11-15T22:30:00Z") // 00:30 next day in Khartoum

  it("keeps the same day when the local time is still before midnight", () => {
    expect(
      formatAssignmentDate(lateEvening, "en", "short", "Africa/Khartoum")
    ).toBe("15 Nov 2026")
    expect(formatAssignmentDate(lateEvening, "en", "short", "UTC")).toBe(
      "15 Nov 2026"
    )
  })

  it("rolls to the next day once the school's clock passes midnight", () => {
    expect(
      formatAssignmentDate(pastMidnight, "en", "short", "Africa/Khartoum")
    ).toBe("16 Nov 2026")
    // The server's own zone would still say the 15th — the hydration bug.
    expect(formatAssignmentDate(pastMidnight, "en", "short", "UTC")).toBe(
      "15 Nov 2026"
    )
  })

  it("is the same answer whatever zone the process runs in", () => {
    const original = process.env.TZ
    try {
      const out = ["UTC", "Asia/Dubai", "America/Los_Angeles"].map((tz) => {
        process.env.TZ = tz
        return formatAssignmentDate(pastMidnight, "en", "short", "Africa/Khartoum")
      })
      expect(new Set(out).size).toBe(1)
    } finally {
      if (original === undefined) delete process.env.TZ
      else process.env.TZ = original
    }
  })

  it("moves a Gulf school's evening due time past midnight too", () => {
    expect(
      formatAssignmentDate(lateEvening, "en", "short", "Asia/Dubai")
    ).toBe("16 Nov 2026") // 01:30 in Dubai (UTC+4)
  })

  it("shows the time of day on the school's clock in the datetime style", () => {
    const out = formatAssignmentDate(
      pastMidnight,
      "en",
      "datetime",
      "Africa/Khartoum"
    )
    expect(out).toContain("16 Nov 2026")
    expect(out).toMatch(/\b0?0:30\b/)
  })

  it("defaults to Khartoum when the school row has no zone", () => {
    expect(DEFAULT_ASSIGNMENT_TIME_ZONE).toBe("Africa/Khartoum")
    expect(formatAssignmentDate(pastMidnight, "en")).toBe("16 Nov 2026")
    expect(formatAssignmentDate(pastMidnight, "en", "short", null)).toBe(
      "16 Nov 2026"
    )
    expect(formatAssignmentDate(pastMidnight, "en", "short", "")).toBe(
      "16 Nov 2026"
    )
  })

  it("applies the zone to option-object styles (weekday, day tile)", () => {
    expect(
      formatAssignmentDate(
        pastMidnight,
        "en",
        { day: "numeric" },
        "Africa/Khartoum"
      )
    ).toBe("16")
    expect(
      formatAssignmentDate(pastMidnight, "en", { day: "numeric" }, "UTC")
    ).toBe("15")
  })
})
