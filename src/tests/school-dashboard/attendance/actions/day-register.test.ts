// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import { getAttendanceList } from "@/components/school-dashboard/attendance/actions/core"

vi.mock("@/lib/db", () => ({
  db: {
    student: { findMany: vi.fn() },
    attendance: { findMany: vi.fn() },
    school: { findFirst: vi.fn() },
  },
}))
vi.mock("@/components/school-dashboard/attendance/actions/helpers", () => ({
  guardAttendance: vi.fn(async () => ({
    ok: true,
    schoolId: "school1",
    userId: "u1",
    role: "TEACHER",
  })),
}))
vi.mock("@/lib/school-name-format", () => ({
  schoolNameDisplay: vi.fn(async () => "first-second"),
}))
vi.mock("@/auth", () => ({ auth: vi.fn() }))
vi.mock("@/lib/tenant-context", () => ({ getTenantContext: vi.fn() }))
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }))
vi.mock("server-only", () => ({}))

const STUDENTS = [
  { id: "sA", firstName: "A", middleName: null, lastName: "X", userId: "uA" },
  { id: "sB", firstName: "B", middleName: null, lastName: "Y", userId: "uB" },
]

// The DAY register reads a section's marks for one date, and that query also
// returns PERIOD rows — every live-class sync writes them. "Last row wins"
// showed whichever period the database returned last.
describe("getAttendanceList — the day row is the mark", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(db.student.findMany).mockResolvedValue(STUDENTS as never)
  })

  it("prefers the day row over any period row, whatever the order", async () => {
    vi.mocked(db.attendance.findMany).mockResolvedValue([
      { studentId: "sA", status: "ABSENT", method: "VIRTUAL", periodId: null },
      { studentId: "sA", status: "PRESENT", method: "VIRTUAL", periodId: "p4" },
    ] as never)

    const res = await getAttendanceList({
      sectionId: "sec1",
      date: "2026-10-19",
    })
    const a = res.success
      ? res.data!.rows.find((r) => r.studentId === "sA")
      : null

    expect(a?.status).toBe("absent")
    expect(a?.method).toBe("VIRTUAL")
  })

  it("derives an UNSAVED day from period rows when no day row exists", async () => {
    vi.mocked(db.attendance.findMany).mockResolvedValue([
      { studentId: "sB", status: "PRESENT", method: "VIRTUAL", periodId: "p4" },
      { studentId: "sB", status: "ABSENT", method: "VIRTUAL", periodId: "p1" },
    ] as never)

    const res = await getAttendanceList({
      sectionId: "sec1",
      date: "2026-10-19",
    })
    const b = res.success
      ? res.data!.rows.find((r) => r.studentId === "sB")
      : null

    // In any period → the day counts; no method → Save will store it.
    expect(b?.status).toBe("present")
    expect(b?.method).toBeUndefined()
  })
})
