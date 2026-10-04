// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { auth } from "@/auth"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"
import {
  getAttendanceStats,
  getAttendanceTrends,
  getCalendarData,
  getDayWisePatterns,
  getMethodUsageStats,
  getRecentAttendance,
  getSectionComparisonStats,
  getStudentsAtRisk,
} from "@/components/school-dashboard/attendance/actions/analytics"

vi.mock("@/lib/db", () => ({
  db: {
    attendance: {
      count: vi.fn(),
      findMany: vi.fn(),
      groupBy: vi.fn(),
    },
    section: {
      findMany: vi.fn(),
    },
    student: {
      findMany: vi.fn(),
      count: vi.fn(),
    },
    teacher: {
      findFirst: vi.fn(),
    },
  },
}))
vi.mock("@/lib/tenant-context", () => ({ getTenantContext: vi.fn() }))
vi.mock("@/auth", () => ({ auth: vi.fn() }))

const SCHOOL = "school-1"

function mockAuth(role = "ADMIN", schoolId: string | null = SCHOOL) {
  vi.mocked(getTenantContext).mockResolvedValue({
    schoolId: schoolId ?? "",
    subdomain: "demo",
    role: role as any,
    locale: "en",
  })
  vi.mocked(auth).mockResolvedValue({
    user: { id: "u1", schoolId, role },
  } as any)
}

describe("attendance analytics actions", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAuth("ADMIN")
    // Default safe returns for analytics queries
    vi.mocked(db.attendance.count).mockResolvedValue(0)
    vi.mocked(db.attendance.findMany).mockResolvedValue([])
    vi.mocked(db.attendance.groupBy).mockResolvedValue([] as any)
    vi.mocked(db.section.findMany).mockResolvedValue([])
    vi.mocked(db.student.findMany).mockResolvedValue([])
  })

  describe("getAttendanceStats", () => {
    it("returns a defined result", async () => {
      const result = await getAttendanceStats()
      expect(result).toBeDefined()
    })

    it("scopes count queries by schoolId when called", async () => {
      await getAttendanceStats()

      const calls = vi.mocked(db.attendance.count).mock.calls
      if (calls.length > 0) {
        expect(calls[0][0]?.where).toMatchObject({ schoolId: SCHOOL })
      }
    })
  })

  describe("getAttendanceTrends", () => {
    it("denies missing schoolId", async () => {
      mockAuth("ADMIN", null)

      const result = await getAttendanceTrends({})

      expect(result.success).toBe(false)
    })

    it("scopes the trend query by schoolId", async () => {
      await getAttendanceTrends({ days: 30 })

      const calls = [
        ...vi.mocked(db.attendance.groupBy).mock.calls,
        ...vi.mocked(db.attendance.findMany).mock.calls,
      ]
      const anyScoped = calls.some(
        (c: any) => c?.[0]?.where?.schoolId === SCHOOL
      )
      expect(anyScoped).toBe(true)
    })
  })

  describe("getMethodUsageStats", () => {
    it("scopes by schoolId", async () => {
      await getMethodUsageStats({})

      const calls = [
        ...vi.mocked(db.attendance.groupBy).mock.calls,
        ...vi.mocked(db.attendance.findMany).mock.calls,
      ]
      const anyScoped = calls.some(
        (c: any) => c?.[0]?.where?.schoolId === SCHOOL
      )
      expect(anyScoped).toBe(true)
    })
  })

  describe("getDayWisePatterns", () => {
    it("scopes by schoolId", async () => {
      await getDayWisePatterns({})

      const calls = [
        ...vi.mocked(db.attendance.groupBy).mock.calls,
        ...vi.mocked(db.attendance.findMany).mock.calls,
      ]
      const anyScoped = calls.some(
        (c: any) => c?.[0]?.where?.schoolId === SCHOOL
      )
      expect(anyScoped).toBe(true)
    })
  })

  describe("getCalendarData", () => {
    it("scopes by schoolId with date range", async () => {
      await getCalendarData({ year: 2026, month: 5 })

      const calls = [
        ...vi.mocked(db.attendance.findMany).mock.calls,
        ...vi.mocked(db.attendance.groupBy).mock.calls,
      ]
      const anyScoped = calls.some(
        (c: any) => c?.[0]?.where?.schoolId === SCHOOL
      )
      expect(anyScoped).toBe(true)
    })
  })

  describe("getSectionComparisonStats", () => {
    it("ranks the school's sections by rate", async () => {
      vi.mocked(db.section.findMany).mockResolvedValue([
        { id: "7a", name: "7-A", _count: { students: 20 } },
        { id: "7b", name: "7-B", _count: { students: 18 } },
      ] as never)
      vi.mocked(db.attendance.groupBy).mockResolvedValue([
        { sectionId: "7a", status: "PRESENT", _count: { _all: 6 } },
        { sectionId: "7a", status: "ABSENT", _count: { _all: 4 } },
        { sectionId: "7b", status: "PRESENT", _count: { _all: 9 } },
        { sectionId: "7b", status: "LATE", _count: { _all: 1 } },
      ] as never)

      const result = await getSectionComparisonStats({})

      expect(vi.mocked(db.section.findMany).mock.calls[0][0]!.where).toEqual({
        schoolId: SCHOOL,
      })
      expect(
        vi.mocked(db.attendance.groupBy).mock.calls[0][0]!.where
      ).toMatchObject({ schoolId: SCHOOL, sectionId: { in: ["7a", "7b"] } })
      expect("stats" in result && result.stats).toEqual([
        expect.objectContaining({ sectionId: "7b", rate: 100 }),
        expect.objectContaining({ sectionId: "7a", rate: 60 }),
      ])
    })

    it("shows a teacher only their own sections", async () => {
      mockAuth("TEACHER")
      vi.mocked(db.teacher.findFirst).mockResolvedValue({ id: "t1" } as never)
      vi.mocked(db.section.findMany)
        .mockResolvedValueOnce([{ id: "7a" }] as never) // teacher's sections
        .mockResolvedValueOnce([] as never)

      await getSectionComparisonStats({})

      expect(
        vi.mocked(db.section.findMany).mock.calls[1][0]!.where
      ).toMatchObject({ schoolId: SCHOOL, id: { in: ["7a"] } })
    })
  })

  describe("getStudentsAtRisk", () => {
    it("denies missing schoolId", async () => {
      mockAuth("ADMIN", null)

      const result = await getStudentsAtRisk()

      expect(result.success).toBe(false)
    })

    it("keeps a teacher's list to their sections, students and marks alike", async () => {
      mockAuth("TEACHER")
      vi.mocked(db.teacher.findFirst).mockResolvedValue({ id: "t1" } as never)
      vi.mocked(db.section.findMany).mockResolvedValue([{ id: "7a" }] as never)

      await getStudentsAtRisk({ gradeId: "g7" })

      const where = vi.mocked(db.student.findMany).mock.calls[0][0]!.where
      expect(where).toMatchObject({
        schoolId: SCHOOL,
        sectionId: { in: ["7a"] },
        section: { gradeId: "g7" },
      })
    })
  })

  describe("getRecentAttendance", () => {
    it("scopes findMany by schoolId", async () => {
      await getRecentAttendance({ limit: 10 })

      const calls = vi.mocked(db.attendance.findMany).mock.calls
      const anyScoped = calls.some(
        (c: any) => c?.[0]?.where?.schoolId === SCHOOL
      )
      expect(anyScoped).toBe(true)
    })
  })
})
