// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import { getStudentScopes } from "@/lib/teaching-scope"
import {
  attendanceDueCount,
  loadUpcomingData,
} from "@/components/school-dashboard/dashboard/upcoming-queries"

vi.mock("@/lib/db", () => ({
  db: {
    school: { findUnique: vi.fn().mockResolvedValue(null) },
    timetable: { findMany: vi.fn().mockResolvedValue([]) },
    studentGuardian: { findMany: vi.fn() },
    schoolAssignment: { count: vi.fn() },
    announcement: { findMany: vi.fn(), count: vi.fn() },
    student: { count: vi.fn() },
    attendance: { count: vi.fn() },
    userInvoice: { count: vi.fn(), aggregate: vi.fn() },
  },
}))

vi.mock("@/lib/term-resolver", () => ({
  resolveActiveTerm: vi.fn().mockResolvedValue({ term: { id: "term-1" } }),
}))

vi.mock("@/lib/teaching-scope", () => ({
  getStudentScopes: vi.fn(),
  getTeacherPairs: vi.fn().mockResolvedValue([]),
}))

beforeEach(() => {
  vi.clearAllMocks()
})

describe("loadUpcomingData", () => {
  it("guardian: finds children through the Guardian's userId, scoped to the school", async () => {
    vi.mocked(db.studentGuardian.findMany).mockResolvedValue([
      { student: { id: "s1", firstName: "Khadija", lastName: "Alnoor" } },
    ] as never)
    vi.mocked(getStudentScopes).mockResolvedValue([
      { studentId: "s1", sectionId: "7a", gradeId: "g7" },
    ])
    vi.mocked(db.schoolAssignment.count)
      .mockResolvedValueOnce(2)
      .mockResolvedValueOnce(1)
    vi.mocked(db.announcement.findMany).mockResolvedValue([])

    const data = await loadUpcomingData("user-1", "school-1", "GUARDIAN")

    expect(db.studentGuardian.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { guardian: { userId: "user-1" }, schoolId: "school-1" },
      })
    )
    expect(data).toMatchObject({
      children: [
        {
          id: "s1",
          name: "Khadija Alnoor",
          pendingAssignments: 2,
          overdueAssignments: 1,
        },
      ],
    })
    // Work set for the child's section or whole grade — not a class
    expect(
      vi.mocked(db.schoolAssignment.count).mock.calls[0][0]!.where
    ).toMatchObject({
      schoolId: "school-1",
      OR: [
        { sectionId: { in: ["7a"] } },
        { sectionId: null, gradeId: { in: ["g7"] } },
      ],
    })
  })

  it("admin: reads alerts for the passed school without a session", async () => {
    vi.mocked(db.student.count).mockResolvedValue(0)
    vi.mocked(db.attendance.count).mockResolvedValue(0)
    vi.mocked(db.announcement.count).mockResolvedValue(4)
    const data = await loadUpcomingData("user-1", "school-1", "ADMIN")
    expect(data).toMatchObject({ pendingApprovals: 4 })
    expect(db.announcement.count).toHaveBeenCalledWith({
      where: { schoolId: "school-1", published: false },
    })
  })

  it("accountant: invoice counts scoped to the school", async () => {
    vi.mocked(db.userInvoice.count)
      .mockResolvedValueOnce(3)
      .mockResolvedValueOnce(1)
    vi.mocked(db.userInvoice.aggregate).mockResolvedValue({
      _sum: { total: 10 },
    } as never)
    const data = await loadUpcomingData("user-1", "school-1", "ACCOUNTANT")
    expect(data).toMatchObject({
      pendingPayments: { count: 3 },
      overdueInvoices: { count: 1 },
    })
  })
})

describe("attendanceDueCount", () => {
  const NOON = Date.UTC(2026, 10, 21, 10, 0) // 12:00 in Khartoum
  const HOUR = 60 * 60 * 1000

  it("a class later today is not owed a register yet", () => {
    const slots = [
      { sectionId: "g4", startMs: NOON + 4 * HOUR },
      { sectionId: "g5", startMs: NOON + 6 * HOUR },
    ]
    expect(attendanceDueCount(slots, new Set(), NOON)).toBe(0)
  })

  it("a class that has begun and is unmarked is owed one", () => {
    const slots = [
      { sectionId: "g4", startMs: NOON - HOUR },
      { sectionId: "g5", startMs: NOON + HOUR },
    ]
    expect(attendanceDueCount(slots, new Set(), NOON)).toBe(1)
  })

  it("a marked section is never owed, and two periods of one section count once", () => {
    const slots = [
      { sectionId: "g4", startMs: NOON - 2 * HOUR },
      { sectionId: "g4", startMs: NOON - HOUR },
      { sectionId: "g5", startMs: NOON - HOUR },
    ]
    expect(attendanceDueCount(slots, new Set(["g5"]), NOON)).toBe(1)
  })

  it("a slot with no section or no readable start never counts", () => {
    const slots = [
      { sectionId: null, startMs: NOON - HOUR },
      { sectionId: "g4", startMs: null },
    ]
    expect(attendanceDueCount(slots, new Set(), NOON)).toBe(0)
  })
})
