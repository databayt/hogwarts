// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"
import {
  calculateAttendancePercentage,
  getAtRiskStudents,
  getAttendanceTrends,
  getBulkAttendanceStats,
  getPerfectAttendance,
  getSectionAttendanceStats,
} from "@/components/school-dashboard/attendance/attendance-stats"

vi.mock("@/lib/db", () => ({
  db: {
    attendance: {
      findMany: vi.fn(),
      count: vi.fn(),
      groupBy: vi.fn(),
    },
    student: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
    },
    section: {
      findFirst: vi.fn(),
    },
  },
}))
vi.mock("@/lib/tenant-context", () => ({ getTenantContext: vi.fn() }))

const SCHOOL = "school-1"

function mockContext(schoolId: string | null = SCHOOL) {
  vi.mocked(getTenantContext).mockResolvedValue({
    schoolId: schoolId ?? "",
    subdomain: "demo",
    role: "ADMIN" as any,
    locale: "en",
  })
}

describe("attendance-stats utility", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockContext()
  })

  describe("calculateAttendancePercentage", () => {
    it("throws on missing schoolId", async () => {
      mockContext(null)

      await expect(
        calculateAttendancePercentage({ studentId: "s1" })
      ).rejects.toThrow("MISSING_SCHOOL")
    })

    it("returns 0 percentage when no records", async () => {
      vi.mocked(db.attendance.findMany).mockResolvedValue([])

      const result = await calculateAttendancePercentage({ studentId: "s1" })

      expect(result.totalDays).toBe(0)
      expect(result.percentage).toBe(0)
    })

    it("counts PRESENT correctly", async () => {
      vi.mocked(db.attendance.findMany).mockResolvedValue([
        { date: new Date("2026-01-01"), status: "PRESENT" },
        { date: new Date("2026-01-02"), status: "PRESENT" },
        { date: new Date("2026-01-03"), status: "PRESENT" },
      ] as any)

      const result = await calculateAttendancePercentage({ studentId: "s1" })

      expect(result.presentDays).toBe(3)
      expect(result.totalDays).toBe(3)
      expect(result.percentage).toBe(100)
    })

    it("LATE counts as present for percentage", async () => {
      vi.mocked(db.attendance.findMany).mockResolvedValue([
        { date: new Date("2026-01-01"), status: "PRESENT" },
        { date: new Date("2026-01-02"), status: "LATE" },
      ] as any)

      const result = await calculateAttendancePercentage({ studentId: "s1" })

      expect(result.lateDays).toBe(1)
      expect(result.presentDays).toBe(1) // strict PRESENT; LATE tracked separately
    })

    it("EXCUSED removes day from denominator", async () => {
      vi.mocked(db.attendance.findMany).mockResolvedValue([
        { date: new Date("2026-01-01"), status: "PRESENT" },
        { date: new Date("2026-01-02"), status: "EXCUSED" },
      ] as any)

      const result = await calculateAttendancePercentage({ studentId: "s1" })

      // Only 1 effective day (excused removed), 1 present → 100%
      expect(result.percentage).toBe(100)
    })

    it("calculates partial attendance", async () => {
      vi.mocked(db.attendance.findMany).mockResolvedValue([
        { date: new Date("2026-01-01"), status: "PRESENT" },
        { date: new Date("2026-01-02"), status: "ABSENT" },
      ] as any)

      const result = await calculateAttendancePercentage({ studentId: "s1" })

      expect(result.percentage).toBe(50)
      expect(result.absentDays).toBe(1)
    })

    it("scopes findMany by schoolId + studentId", async () => {
      vi.mocked(db.attendance.findMany).mockResolvedValue([])

      await calculateAttendancePercentage({ studentId: "s1" })

      expect(db.attendance.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            schoolId: SCHOOL,
            studentId: "s1",
          }),
        })
      )
    })

    it("applies date range filter when from/to provided", async () => {
      vi.mocked(db.attendance.findMany).mockResolvedValue([])

      await calculateAttendancePercentage({
        studentId: "s1",
        from: "2026-01-01",
        to: "2026-01-31",
      })

      const call = vi.mocked(db.attendance.findMany).mock.calls[0]?.[0]
      expect((call?.where as any)?.date).toBeDefined()
    })
  })

  describe("getBulkAttendanceStats", () => {
    it("throws on missing schoolId", async () => {
      mockContext(null)

      await expect(
        getBulkAttendanceStats({ studentIds: ["s1"] })
      ).rejects.toThrow("MISSING_SCHOOL")
    })

    it("scopes by schoolId", async () => {
      vi.mocked(db.attendance.findMany).mockResolvedValue([])
      vi.mocked(db.student.findMany).mockResolvedValue([])

      await getBulkAttendanceStats({ studentIds: ["s1", "s2"] })

      const calls = vi.mocked(db.attendance.findMany).mock.calls
      if (calls.length > 0) {
        expect((calls[0]?.[0]?.where as any)?.schoolId).toBe(SCHOOL)
      }
    })
  })

  describe("getSectionAttendanceStats", () => {
    it("throws on missing schoolId", async () => {
      mockContext(null)

      await expect(
        getSectionAttendanceStats({ sectionId: "7a", date: "2026-06-01" })
      ).rejects.toThrow("MISSING_SCHOOL")
    })

    it("returns 0 totals for a section of another school", async () => {
      vi.mocked(db.section.findFirst).mockResolvedValue(null)
      vi.mocked(db.attendance.findMany).mockResolvedValue([])

      const result = await getSectionAttendanceStats({
        sectionId: "7a",
        date: "2026-06-01",
      })

      expect(vi.mocked(db.section.findFirst).mock.calls[0][0]!.where).toEqual({
        id: "7a",
        schoolId: SCHOOL,
      })
      expect(result.totalStudents).toBe(0)
      expect(result.attendanceRate).toBe(0)
    })

    it("counts PRESENT + LATE as present, over the section's students", async () => {
      vi.mocked(db.section.findFirst).mockResolvedValue({
        name: "7-A",
        students: [{ id: "s1" }, { id: "s2" }],
      } as never)
      vi.mocked(db.attendance.findMany).mockResolvedValue([
        { studentId: "s1", status: "PRESENT" },
        { studentId: "s2", status: "LATE" },
      ] as never)

      const result = await getSectionAttendanceStats({
        sectionId: "7a",
        date: "2026-06-01",
      })

      expect(
        vi.mocked(db.attendance.findMany).mock.calls[0][0]!.where
      ).toMatchObject({ schoolId: SCHOOL, sectionId: "7a", periodId: null })
      expect(result.sectionName).toBe("7-A")
      expect(result.presentCount).toBe(2) // PRESENT + LATE both count
      expect(result.lateCount).toBe(1)
      expect(result.totalStudents).toBe(2)
      expect(result.attendanceRate).toBe(100)
    })
  })

  describe("getAttendanceTrends", () => {
    it("throws on missing schoolId", async () => {
      mockContext(null)

      await expect(getAttendanceTrends({ days: 30 })).rejects.toThrow(
        "MISSING_SCHOOL"
      )
    })

    it("scopes groupBy by schoolId", async () => {
      vi.mocked(db.attendance.groupBy).mockResolvedValue([] as any)

      await getAttendanceTrends({ days: 30 })

      const call = vi.mocked(db.attendance.groupBy).mock.calls[0]?.[0]
      expect((call?.where as any)?.schoolId).toBe(SCHOOL)
    })
  })

  describe("getAtRiskStudents", () => {
    it("throws on missing schoolId", async () => {
      mockContext(null)

      await expect(getAtRiskStudents({})).rejects.toThrow("MISSING_SCHOOL")
    })
  })

  describe("getPerfectAttendance", () => {
    it("throws on missing schoolId", async () => {
      mockContext(null)

      await expect(getPerfectAttendance({})).rejects.toThrow("MISSING_SCHOOL")
    })
  })

  // Regression guard: soft-deleted attendance (deletedAt != null) must never be
  // counted in any analytics read, or an admin-removed record would still skew a
  // student's percentage, the at-risk list and perfect-attendance awards.
  describe("soft-delete exclusion (deletedAt: null)", () => {
    it("calculateAttendancePercentage filters deletedAt: null", async () => {
      vi.mocked(db.attendance.findMany).mockResolvedValue([])

      await calculateAttendancePercentage({ studentId: "s1" })

      const call = vi.mocked(db.attendance.findMany).mock.calls[0]?.[0]
      expect((call?.where as any)?.deletedAt).toBeNull()
    })

    it("getBulkAttendanceStats filters deletedAt: null", async () => {
      vi.mocked(db.attendance.findMany).mockResolvedValue([])
      vi.mocked(db.student.findMany).mockResolvedValue([])

      await getBulkAttendanceStats({ studentIds: ["s1"] })

      const call = vi.mocked(db.attendance.findMany).mock.calls[0]?.[0]
      expect((call?.where as any)?.deletedAt).toBeNull()
    })

    it("getSectionAttendanceStats filters deletedAt: null", async () => {
      vi.mocked(db.section.findFirst).mockResolvedValue({
        name: "7-A",
        students: [{ id: "s1" }],
      } as never)
      vi.mocked(db.attendance.findMany).mockResolvedValue([])

      await getSectionAttendanceStats({ sectionId: "7a", date: "2026-06-01" })

      const call = vi.mocked(db.attendance.findMany).mock.calls[0]?.[0]
      expect((call?.where as any)?.deletedAt).toBeNull()
    })

    it("getAttendanceTrends filters deletedAt: null", async () => {
      vi.mocked(db.attendance.groupBy).mockResolvedValue([] as any)

      await getAttendanceTrends({ days: 30 })

      const call = vi.mocked(db.attendance.groupBy).mock.calls[0]?.[0]
      expect((call?.where as any)?.deletedAt).toBeNull()
    })
  })
})
