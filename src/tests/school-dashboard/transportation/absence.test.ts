// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import { getAbsentStudentIdsForDate } from "@/components/school-dashboard/transportation/lib/absence"

vi.mock("@/lib/db", () => ({
  db: {
    attendance: { findMany: vi.fn() },
    absenceIntention: { findMany: vi.fn() },
  },
}))

beforeEach(() => vi.clearAllMocks())

describe("getAbsentStudentIdsForDate", () => {
  it("unions attendance + approved intentions and dedupes", async () => {
    vi.mocked(db.attendance.findMany).mockResolvedValue([
      { studentId: "a" },
      { studentId: "b" },
    ] as never)
    vi.mocked(db.absenceIntention.findMany).mockResolvedValue([
      { studentId: "b" },
      { studentId: "c" },
    ] as never)

    const set = await getAbsentStudentIdsForDate(
      "school-1",
      new Date("2026-06-19")
    )
    expect(set).toEqual(new Set(["a", "b", "c"]))
  })

  it("returns an empty set when nobody is absent", async () => {
    vi.mocked(db.attendance.findMany).mockResolvedValue([] as never)
    vi.mocked(db.absenceIntention.findMany).mockResolvedValue([] as never)

    const set = await getAbsentStudentIdsForDate(
      "school-1",
      new Date("2026-06-19")
    )
    expect(set.size).toBe(0)
  })

  it("scopes attendance to schoolId, away statuses, and UTC-midnight date", async () => {
    vi.mocked(db.attendance.findMany).mockResolvedValue([] as never)
    vi.mocked(db.absenceIntention.findMany).mockResolvedValue([] as never)

    await getAbsentStudentIdsForDate(
      "school-1",
      new Date("2026-06-19T08:30:00Z")
    )

    const arg = vi.mocked(db.attendance.findMany).mock.calls[0][0] as {
      where: { schoolId: string; status: unknown; date: Date }
    }
    expect(arg.where.schoolId).toBe("school-1")
    expect(arg.where.status).toEqual({ in: ["ABSENT", "EXCUSED", "SICK"] })
    expect(arg.where.date.toISOString()).toBe("2026-06-19T00:00:00.000Z")
  })

  it("only counts APPROVED intentions covering the date", async () => {
    vi.mocked(db.attendance.findMany).mockResolvedValue([] as never)
    vi.mocked(db.absenceIntention.findMany).mockResolvedValue([] as never)

    await getAbsentStudentIdsForDate("school-1", new Date("2026-06-19"))

    const arg = vi.mocked(db.absenceIntention.findMany).mock.calls[0][0] as {
      where: { status: string; dateFrom: unknown; dateTo: unknown }
    }
    expect(arg.where.status).toBe("APPROVED")
    expect(arg.where.dateFrom).toHaveProperty("lte")
    expect(arg.where.dateTo).toHaveProperty("gte")
  })
})
