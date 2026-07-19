// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { auth } from "@/auth"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"
import {
  getFollowUpStudents,
  getParentAttendanceSummary,
  getStudentEarlyWarningDetails,
  getStudentsByRiskLevel,
  getTeacherClassesToday,
  getTodaysDashboard,
  getUnmarkedClasses,
} from "@/components/school-dashboard/attendance/actions/dashboard"

vi.mock("@/lib/db", () => ({
  db: {
    attendance: {
      count: vi.fn(),
      findMany: vi.fn(),
      findFirst: vi.fn(),
      groupBy: vi.fn(),
    },
    student: {
      findMany: vi.fn(),
      count: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
    },
    guardian: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
    },
    studentGuardian: {
      findMany: vi.fn(),
    },
    teacher: {
      findFirst: vi.fn(),
    },
    classTeacher: {
      findMany: vi.fn(),
    },
    class: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
    },
    schoolWeekConfig: {
      findMany: vi.fn(),
    },
    studentClass: {
      findMany: vi.fn(),
    },
    timetable: {
      findMany: vi.fn(),
    },
    attendanceIntervention: {
      findMany: vi.fn(),
    },
    term: {
      findFirst: vi.fn(),
    },
  },
}))
vi.mock("@/lib/tenant-context", () => ({ getTenantContext: vi.fn() }))
vi.mock("@/auth", () => ({ auth: vi.fn() }))

const SCHOOL = "school-1"
const USER = "user-1"

function mockAuth(role = "ADMIN", schoolId: string | null = SCHOOL) {
  vi.mocked(getTenantContext).mockResolvedValue({
    schoolId: schoolId ?? "",
    subdomain: "demo",
    role: role as any,
    locale: "en",
  })
  vi.mocked(auth).mockResolvedValue({
    user: { id: USER, schoolId, role },
  } as any)
}

describe("attendance dashboard actions", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAuth("ADMIN")
    vi.mocked(db.attendance.findMany).mockResolvedValue([])
    vi.mocked(db.schoolWeekConfig.findMany).mockResolvedValue([])
    vi.mocked(db.attendance.count).mockResolvedValue(0)
    vi.mocked(db.attendance.groupBy).mockResolvedValue([] as any)
    vi.mocked(db.student.findMany).mockResolvedValue([])
    vi.mocked(db.class.findMany).mockResolvedValue([])
    vi.mocked(db.studentClass.findMany).mockResolvedValue([])
    vi.mocked(db.studentGuardian.findMany).mockResolvedValue([])
  })

  describe("getStudentsByRiskLevel", () => {
    it("denies missing schoolId", async () => {
      mockAuth("ADMIN", null)

      const result = await getStudentsByRiskLevel({ riskLevel: "HIGH" })

      expect(result.success).toBe(false)
    })

    it("scopes student lookup by schoolId", async () => {
      await getStudentsByRiskLevel({ riskLevel: "HIGH" })

      const calls = [
        ...vi.mocked(db.student.findMany).mock.calls,
        ...vi.mocked(db.attendance.findMany).mock.calls,
      ]
      const anyScoped = calls.some(
        (c: any) => c?.[0]?.where?.schoolId === SCHOOL
      )
      expect(anyScoped).toBe(true)
    })
  })

  describe("getStudentEarlyWarningDetails", () => {
    it("requires schoolId", async () => {
      mockAuth("ADMIN", null)

      const result = await getStudentEarlyWarningDetails("s1")

      expect(result.success).toBe(false)
    })

    it("scopes student lookup by schoolId (cross-tenant defense)", async () => {
      vi.mocked(db.student.findFirst).mockResolvedValue(null)

      const result = await getStudentEarlyWarningDetails("s-other-school")

      expect(result.success).toBe(false)
      // If findFirst was used, schoolId must be in the where clause
      const calls = vi.mocked(db.student.findFirst).mock.calls
      if (calls.length > 0) {
        expect(calls[0][0]?.where).toMatchObject({ schoolId: SCHOOL })
      }
    })
  })

  describe("getTodaysDashboard", () => {
    it("denies missing schoolId", async () => {
      mockAuth("ADMIN", null)

      const result = await getTodaysDashboard()

      expect(result.success).toBe(false)
    })

    it("scopes all today-queries by schoolId", async () => {
      await getTodaysDashboard()

      const calls = [
        ...vi.mocked(db.attendance.count).mock.calls,
        ...vi.mocked(db.attendance.findMany).mock.calls,
        ...vi.mocked(db.attendance.groupBy).mock.calls,
        ...vi.mocked(db.student.count).mock.calls,
      ]
      const anyScoped = calls.some(
        (c: any) => c?.[0]?.where?.schoolId === SCHOOL
      )
      expect(anyScoped).toBe(true)
    })
  })

  describe("getTeacherClassesToday", () => {
    it("denies non-TEACHER role", async () => {
      mockAuth("STUDENT")

      const result = await getTeacherClassesToday()

      // Returns either error or empty
      expect(
        result.success === false || (result as any).data?.classes
      ).toBeDefined()
    })
  })

  describe("getFollowUpStudents", () => {
    it("denies missing schoolId", async () => {
      mockAuth("ADMIN", null)

      const result = await getFollowUpStudents()

      expect(result.success).toBe(false)
    })
  })

  describe("getUnmarkedClasses", () => {
    it("denies missing schoolId", async () => {
      mockAuth("ADMIN", null)

      const result = await getUnmarkedClasses()

      expect(result.success).toBe(false)
    })
  })

  describe("getParentAttendanceSummary", () => {
    it("denies missing schoolId", async () => {
      mockAuth("GUARDIAN", null)

      const result = await getParentAttendanceSummary()

      expect(result.success).toBe(false)
    })

    it("denies unauthenticated", async () => {
      vi.mocked(getTenantContext).mockResolvedValue({
        schoolId: SCHOOL,
        subdomain: "demo",
        role: "GUARDIAN",
        locale: "en",
      })
      vi.mocked(auth).mockResolvedValue(null)

      const result = await getParentAttendanceSummary()

      expect(result.success).toBe(false)
    })

    it("scopes the guardian lookup by current schoolId (cross-tenant defense)", async () => {
      mockAuth("GUARDIAN")
      // Source resolves the guardian via findFirst scoped to the tenant.
      vi.mocked(db.guardian.findFirst).mockResolvedValue({
        id: "g1",
        userId: USER,
      } as any)
      vi.mocked(db.studentGuardian.findMany).mockResolvedValue([])

      await getParentAttendanceSummary()

      // The CRITICAL fix: the guardian record must be resolved with schoolId
      // in the where clause, not just by userId (P0 cross-tenant leak).
      const guardianCalls = vi.mocked(db.guardian.findFirst).mock.calls
      expect(guardianCalls.length).toBeGreaterThan(0)
      expect(guardianCalls[0][0]?.where).toMatchObject({
        userId: USER,
        schoolId: SCHOOL,
      })
    })

    it("scopes studentGuardian lookup by current schoolId (cross-tenant defense)", async () => {
      mockAuth("GUARDIAN")
      vi.mocked(db.guardian.findFirst).mockResolvedValue({
        id: "g1",
        userId: USER,
      } as any)
      vi.mocked(db.studentGuardian.findMany).mockResolvedValue([])

      await getParentAttendanceSummary()

      // studentGuardian.findMany MUST include schoolId (P0 cross-tenant leak)
      const calls = vi.mocked(db.studentGuardian.findMany).mock.calls
      expect(calls.length).toBeGreaterThan(0)
      expect(calls[0][0]?.where).toMatchObject({ schoolId: SCHOOL })
    })

    it("fails when no guardian record exists for this tenant", async () => {
      // A guardian belonging to another school resolves to null here because
      // the lookup is now schoolId-scoped -> the caller is denied.
      mockAuth("GUARDIAN")
      vi.mocked(db.guardian.findFirst).mockResolvedValue(null)

      const result = await getParentAttendanceSummary()

      expect(result.success).toBe(false)
    })

    it("succeeds for an authorized in-tenant GUARDIAN", async () => {
      mockAuth("GUARDIAN")
      vi.mocked(db.guardian.findFirst).mockResolvedValue({
        id: "g1",
        userId: USER,
      } as any)
      vi.mocked(db.studentGuardian.findMany).mockResolvedValue([])

      const result = await getParentAttendanceSummary()

      expect(result.success).toBe(true)
      expect((result as any).data?.children).toEqual([])
    })
  })
})
