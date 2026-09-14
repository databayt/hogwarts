// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import { loadUpcomingData } from "@/components/school-dashboard/dashboard/upcoming-queries"

vi.mock("@/lib/db", () => ({
  db: {
    studentGuardian: { findMany: vi.fn() },
    studentClass: { findMany: vi.fn() },
    schoolAssignment: { count: vi.fn() },
    announcement: { findMany: vi.fn(), count: vi.fn() },
    student: { count: vi.fn() },
    attendance: { count: vi.fn() },
    userInvoice: { count: vi.fn(), aggregate: vi.fn() },
  },
}))

beforeEach(() => {
  vi.clearAllMocks()
})

describe("loadUpcomingData", () => {
  it("guardian: finds children through the Guardian's userId, scoped to the school", async () => {
    vi.mocked(db.studentGuardian.findMany).mockResolvedValue([
      { student: { id: "s1", firstName: "Khadija", lastName: "Alnoor" } },
    ] as never)
    vi.mocked(db.studentClass.findMany).mockResolvedValue([
      { classId: "c1" },
    ] as never)
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
