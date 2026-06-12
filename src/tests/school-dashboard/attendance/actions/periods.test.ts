// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { auth } from "@/auth"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"
import {
  getCurrentPeriod,
  getPeriodAttendanceAnalytics,
  getPeriodsForClass,
  getStudentDayAttendance,
  markPeriodAttendance,
} from "@/components/school-dashboard/attendance/actions/periods"

vi.mock("@/lib/db", () => ({
  db: {
    attendance: {
      create: vi.fn(),
      createMany: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      upsert: vi.fn(),
      count: vi.fn(),
      groupBy: vi.fn(),
    },
    period: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
    },
    timetable: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
    },
    class: { findFirst: vi.fn(), findUnique: vi.fn() },
    student: { findMany: vi.fn(), findFirst: vi.fn() },
    studentClass: { findMany: vi.fn() },
    user: { findMany: vi.fn() },
  },
}))
vi.mock("@/lib/tenant-context", () => ({ getTenantContext: vi.fn() }))
vi.mock("@/auth", () => ({ auth: vi.fn() }))
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }))
vi.mock("@/lib/term-resolver", () => ({
  resolveActiveTerm: vi
    .fn()
    .mockResolvedValue({ term: { id: "term-1" }, source: "active" }),
}))

const SCHOOL = "school-1"

function mockAuth(role = "TEACHER", schoolId: string | null = SCHOOL) {
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

describe("period attendance actions", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAuth("TEACHER")
  })

  describe("getPeriodsForClass", () => {
    it("denies when schoolId missing", async () => {
      mockAuth("TEACHER", null)

      const result = await getPeriodsForClass({ classId: "c1" })

      expect(result.success).toBe(false)
    })

    it("returns a result (success or error) without crashing on valid inputs", async () => {
      vi.mocked(db.timetable.findMany).mockResolvedValue([])
      vi.mocked(db.period.findMany).mockResolvedValue([])
      vi.mocked(db.class.findFirst).mockResolvedValue(null)

      const result = await getPeriodsForClass({ classId: "c1" })

      expect(result).toBeDefined()
      expect(result).toHaveProperty("success")
    })
  })

  describe("getCurrentPeriod", () => {
    it("returns success false when schoolId missing", async () => {
      mockAuth("TEACHER", null)

      const result = await getCurrentPeriod()

      expect(result.success).toBe(false)
    })
  })

  describe("markPeriodAttendance", () => {
    it("requires canMarkAttendance role", async () => {
      mockAuth("STUDENT")

      const result = await markPeriodAttendance({
        classId: "c1",
        date: "2026-06-01",
        periodId: "p1",
        records: [{ studentId: "s1", status: "present" }],
      })

      expect(result.success).toBe(false)
    })

    it("denies on missing schoolId", async () => {
      mockAuth("TEACHER", null)

      const result = await markPeriodAttendance({
        classId: "c1",
        date: "2026-06-01",
        periodId: "p1",
        records: [{ studentId: "s1", status: "present" }],
      })

      expect(result.success).toBe(false)
    })

    it("resolves sectionId from timetableId and writes it on create", async () => {
      vi.mocked(db.class.findFirst).mockResolvedValue({ id: "c1" } as any)
      vi.mocked(db.period.findFirst).mockResolvedValue({
        id: "p1",
        name: "Period 1",
      } as any)
      // timetable lookup by timetableId returns sectionId
      vi.mocked(db.timetable.findFirst).mockResolvedValue({
        sectionId: "sec-1",
      } as any)
      vi.mocked(db.attendance.findFirst).mockResolvedValue(null)
      vi.mocked(db.attendance.create).mockResolvedValue({} as any)

      const result = await markPeriodAttendance({
        classId: "c1",
        date: "2026-06-01",
        periodId: "p1",
        timetableId: "tt-1",
        records: [{ studentId: "s1", status: "PRESENT" }],
      })

      expect(result.success).toBe(true)
      // timetable was queried with the supplied timetableId
      expect(vi.mocked(db.timetable.findFirst)).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ id: "tt-1", schoolId: SCHOOL }),
          select: { sectionId: true },
        })
      )
      // sectionId was written in the create payload
      const createCall = vi.mocked(db.attendance.create).mock.calls[0][0]
      expect(createCall.data).toMatchObject({ sectionId: "sec-1" })
    })

    it("writes sectionId on update when resolved from timetableId", async () => {
      vi.mocked(db.class.findFirst).mockResolvedValue({ id: "c1" } as any)
      vi.mocked(db.period.findFirst).mockResolvedValue({
        id: "p1",
        name: "Period 1",
      } as any)
      vi.mocked(db.timetable.findFirst).mockResolvedValue({
        sectionId: "sec-1",
      } as any)
      // existing row — triggers update path
      vi.mocked(db.attendance.findFirst).mockResolvedValue({
        id: "att-1",
      } as any)
      vi.mocked(db.attendance.update).mockResolvedValue({} as any)

      const result = await markPeriodAttendance({
        classId: "c1",
        date: "2026-06-01",
        periodId: "p1",
        timetableId: "tt-1",
        records: [{ studentId: "s1", status: "ABSENT" }],
      })

      expect(result.success).toBe(true)
      const updateCall = vi.mocked(db.attendance.update).mock.calls[0][0]
      expect(updateCall.data).toMatchObject({ sectionId: "sec-1" })
    })

    it("writes record with null sectionId when timetableId absent and slot unresolvable", async () => {
      vi.mocked(db.class.findFirst).mockResolvedValue({ id: "c1" } as any)
      vi.mocked(db.period.findFirst).mockResolvedValue({
        id: "p1",
        name: "Period 1",
      } as any)
      // no timetable slot found — fallback returns null
      vi.mocked(db.timetable.findFirst).mockResolvedValue(null)
      vi.mocked(db.attendance.findFirst).mockResolvedValue(null)
      vi.mocked(db.attendance.create).mockResolvedValue({} as any)

      const result = await markPeriodAttendance({
        classId: "c1",
        date: "2026-06-01",
        periodId: "p1",
        // no timetableId
        records: [{ studentId: "s1", status: "PRESENT" }],
      })

      expect(result.success).toBe(true)
      // record is still created (no regression)
      expect(vi.mocked(db.attendance.create)).toHaveBeenCalled()
      // sectionId is undefined/absent (not forced to a wrong value)
      const createCall = vi.mocked(db.attendance.create).mock.calls[0][0]
      expect(createCall.data.sectionId).toBeUndefined()
    })
  })

  describe("getPeriodAttendanceAnalytics", () => {
    it("requires schoolId", async () => {
      mockAuth("ADMIN", null)

      const result = await getPeriodAttendanceAnalytics()

      expect(result.success).toBe(false)
    })

    it("aggregates with schoolId scope", async () => {
      mockAuth("ADMIN")
      vi.mocked(db.attendance.groupBy).mockResolvedValue([] as any)
      vi.mocked(db.attendance.findMany).mockResolvedValue([])

      await getPeriodAttendanceAnalytics({ classId: "c1" })

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

  describe("getStudentDayAttendance", () => {
    it("denies missing schoolId", async () => {
      mockAuth("TEACHER", null)

      const result = await getStudentDayAttendance({
        studentId: "s1",
        date: "2026-06-01",
      })

      expect(result.success).toBe(false)
    })

    it("denies a STUDENT viewing another student's attendance", async () => {
      // A non-staff user who is neither the student nor a linked guardian
      // must be rejected (intra-tenant IDOR defense).
      mockAuth("STUDENT")
      vi.mocked(db.student.findFirst).mockResolvedValue({
        id: "s1",
        firstName: "Other",
        lastName: "Pupil",
        userId: "different-user",
        studentGuardians: [],
      } as any)

      const result = await getStudentDayAttendance({
        studentId: "s1",
        date: "2026-06-01",
      })

      expect(result.success).toBe(false)
    })

    it("allows staff (TEACHER) and scopes the marker lookup by schoolId", async () => {
      mockAuth("TEACHER")
      vi.mocked(db.student.findFirst).mockResolvedValue({
        id: "s1",
        firstName: "Real",
        lastName: "Pupil",
        userId: "student-user",
        studentGuardians: [],
      } as any)
      // One attendance row with a marker so the user lookup is exercised.
      vi.mocked(db.attendance.findMany).mockResolvedValue([
        {
          periodId: "p1",
          periodName: "Period 1",
          status: "PRESENT",
          checkInTime: null,
          notes: null,
          markedAt: new Date(),
          markedBy: "marker-1",
          class: { name: "Math", subject: { name: "Math" } },
        },
      ] as any)
      vi.mocked(db.user.findMany).mockResolvedValue([
        { id: "marker-1", username: "teacher1", email: null },
      ] as any)

      const result = await getStudentDayAttendance({
        studentId: "s1",
        date: "2026-06-01",
      })

      expect(result.success).toBe(true)
      // Defense-in-depth: the marker (user) lookup must carry schoolId.
      const userCalls = vi.mocked(db.user.findMany).mock.calls
      expect(userCalls.length).toBeGreaterThan(0)
      expect(userCalls[0][0]?.where).toMatchObject({ schoolId: SCHOOL })
    })
  })
})
