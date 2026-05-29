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
  getClassAttendanceStats,
  getPerfectAttendance,
} from "../attendance-stats"

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
    studentClass: {
      findMany: vi.fn(),
    },
    class: {
      findUnique: vi.fn(),
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
      ).rejects.toThrow("Missing school context")
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
      expect(result.presentDays).toBe(2) // PRESENT + LATE
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
      ).rejects.toThrow("Missing school context")
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

  describe("getClassAttendanceStats", () => {
    it("throws on missing schoolId", async () => {
      mockContext(null)

      await expect(
        getClassAttendanceStats({ classId: "c1", date: "2026-06-01" })
      ).rejects.toThrow("Missing school context")
    })

    it("returns 0 totals when no enrollments", async () => {
      vi.mocked(db.studentClass.findMany).mockResolvedValue([])
      vi.mocked(db.attendance.findMany).mockResolvedValue([])
      vi.mocked(db.class.findUnique).mockResolvedValue(null)

      const result = await getClassAttendanceStats({
        classId: "c1",
        date: "2026-06-01",
      })

      expect(result.totalStudents).toBe(0)
      expect(result.attendanceRate).toBe(0)
    })

    it("counts PRESENT + LATE as present", async () => {
      vi.mocked(db.studentClass.findMany).mockResolvedValue([
        { studentId: "s1" },
        { studentId: "s2" },
      ] as any)
      vi.mocked(db.attendance.findMany).mockResolvedValue([
        { studentId: "s1", status: "PRESENT" },
        { studentId: "s2", status: "LATE" },
      ] as any)
      vi.mocked(db.class.findUnique).mockResolvedValue({
        name: "Class 10A",
      } as any)

      const result = await getClassAttendanceStats({
        classId: "c1",
        date: "2026-06-01",
      })

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
        "Missing school context"
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

      await expect(getAtRiskStudents({})).rejects.toThrow(
        "Missing school context"
      )
    })
  })

  describe("getPerfectAttendance", () => {
    it("throws on missing schoolId", async () => {
      mockContext(null)

      await expect(getPerfectAttendance({})).rejects.toThrow(
        "Missing school context"
      )
    })
  })
})
