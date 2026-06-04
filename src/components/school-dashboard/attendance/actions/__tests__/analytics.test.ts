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
  getClassComparisonStats,
  getDayWisePatterns,
  getMethodUsageStats,
  getRecentAttendance,
  getStudentsAtRisk,
} from "../analytics"

vi.mock("@/lib/db", () => ({
  db: {
    attendance: {
      count: vi.fn(),
      findMany: vi.fn(),
      groupBy: vi.fn(),
    },
    class: {
      findMany: vi.fn(),
    },
    student: {
      findMany: vi.fn(),
      count: vi.fn(),
    },
    teacher: {
      findFirst: vi.fn(),
    },
    classTeacher: {
      findMany: vi.fn(),
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
    vi.mocked(db.class.findMany).mockResolvedValue([])
    vi.mocked(db.student.findMany).mockResolvedValue([])
    vi.mocked(db.classTeacher.findMany).mockResolvedValue([])
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

  describe("getClassComparisonStats", () => {
    it("scopes class list and aggregation by schoolId", async () => {
      await getClassComparisonStats({})

      const calls = [
        ...vi.mocked(db.attendance.groupBy).mock.calls,
        ...vi.mocked(db.class.findMany).mock.calls,
      ]
      const anyScoped = calls.some(
        (c: any) => c?.[0]?.where?.schoolId === SCHOOL
      )
      expect(anyScoped).toBe(true)
    })
  })

  describe("getStudentsAtRisk", () => {
    it("denies missing schoolId", async () => {
      mockAuth("ADMIN", null)

      const result = await getStudentsAtRisk()

      expect(result.success).toBe(false)
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
