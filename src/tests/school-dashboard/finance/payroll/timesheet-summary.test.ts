// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * loadTimesheetSummaries feeds real attendance from APPROVED timesheet entries
 * into salary-slip generation (replacing the old hardcoded "22 days"). Locks in:
 * only approved hours are paid, distinct days are counted once, present/absent
 * split is correct, and teachers with no entries are omitted so the caller
 * falls back to the salaried default.
 */

import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"

vi.mock("@/lib/db", () => ({
  db: { timesheetEntry: { findMany: vi.fn() } },
}))

const { loadTimesheetSummaries } =
  await import("@/components/school-dashboard/finance/payroll/timesheet-summary")

const SCHOOL = "school-1"
const START = new Date("2026-06-01T00:00:00.000Z")
const END = new Date("2026-06-30T00:00:00.000Z")

function entry(over: Record<string, unknown>) {
  return {
    teacherId: "t-A",
    entryDate: new Date("2026-06-02T00:00:00.000Z"),
    hoursWorked: 8,
    overtimeHours: 0,
    leaveHours: 0,
    ...over,
  }
}

describe("loadTimesheetSummaries", () => {
  beforeEach(() => vi.clearAllMocks())

  it("splits present vs absent days and sums hours + overtime per teacher", async () => {
    vi.mocked(db.timesheetEntry.findMany).mockResolvedValue([
      // teacher A: two worked days + one leave-only day
      entry({
        entryDate: new Date("2026-06-02"),
        hoursWorked: 8,
        overtimeHours: 1,
      }),
      entry({
        entryDate: new Date("2026-06-03"),
        hoursWorked: 7.5,
        overtimeHours: 0.5,
      }),
      entry({
        entryDate: new Date("2026-06-04"),
        hoursWorked: 0,
        leaveHours: 8,
      }),
      // teacher B: one worked day
      entry({
        teacherId: "t-B",
        entryDate: new Date("2026-06-02"),
        hoursWorked: 6,
      }),
    ] as never)

    const map = await loadTimesheetSummaries({
      schoolId: SCHOOL,
      teacherIds: ["t-A", "t-B"],
      periodStart: START,
      periodEnd: END,
    })

    const a = map.get("t-A")!
    expect(a.daysPresent).toBe(2)
    expect(a.daysAbsent).toBe(1)
    expect(a.daysWorked).toBe(3) // present + absent
    expect(a.hoursWorked).toBe(15.5)
    expect(a.overtimeHours).toBe(1.5)

    const b = map.get("t-B")!
    expect(b).toMatchObject({
      daysPresent: 1,
      daysAbsent: 0,
      daysWorked: 1,
      hoursWorked: 6,
    })
  })

  it("counts a repeated date once but still sums its hours", async () => {
    vi.mocked(db.timesheetEntry.findMany).mockResolvedValue([
      entry({ entryDate: new Date("2026-06-02"), hoursWorked: 4 }),
      entry({ entryDate: new Date("2026-06-02"), hoursWorked: 4 }), // same day, 2nd period
    ] as never)

    const a = (
      await loadTimesheetSummaries({
        schoolId: SCHOOL,
        teacherIds: ["t-A"],
        periodStart: START,
        periodEnd: END,
      })
    ).get("t-A")!

    expect(a.daysPresent).toBe(1) // distinct date
    expect(a.hoursWorked).toBe(8) // both rows summed
  })

  it("only reads APPROVED entries within the pay period — unapproved hours are never paid", async () => {
    vi.mocked(db.timesheetEntry.findMany).mockResolvedValue([] as never)

    await loadTimesheetSummaries({
      schoolId: SCHOOL,
      teacherIds: ["t-A"],
      periodStart: START,
      periodEnd: END,
    })

    const where = vi.mocked(db.timesheetEntry.findMany).mock.calls[0][0]!
      .where as {
      status: string
      schoolId: string
      entryDate: { gte: Date; lte: Date }
    }
    expect(where.status).toBe("APPROVED")
    expect(where.schoolId).toBe(SCHOOL)
    expect(where.entryDate).toEqual({ gte: START, lte: END })
  })

  it("omits teachers with no approved entries (caller falls back to the salaried default)", async () => {
    vi.mocked(db.timesheetEntry.findMany).mockResolvedValue([
      entry({ teacherId: "t-A", hoursWorked: 8 }),
    ] as never)

    const map = await loadTimesheetSummaries({
      schoolId: SCHOOL,
      teacherIds: ["t-A", "t-no-timesheet"],
      periodStart: START,
      periodEnd: END,
    })

    expect(map.has("t-A")).toBe(true)
    expect(map.has("t-no-timesheet")).toBe(false)
  })

  it("short-circuits with no query when there are no teachers", async () => {
    const map = await loadTimesheetSummaries({
      schoolId: SCHOOL,
      teacherIds: [],
      periodStart: START,
      periodEnd: END,
    })

    expect(map.size).toBe(0)
    expect(db.timesheetEntry.findMany).not.toHaveBeenCalled()
  })
})
