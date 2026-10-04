// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { auth } from "@/auth"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"
import {
  getCurrentPeriod,
  getPeriodAttendanceAnalytics,
  getPeriodsForSection,
  getStudentDayAttendance,
  markPeriodAttendance,
} from "@/components/school-dashboard/attendance/actions/periods"

vi.mock("@/lib/db", () => {
  const db: any = {
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
    section: { findFirst: vi.fn(), findMany: vi.fn() },
    teacher: { findFirst: vi.fn() },
    student: { findMany: vi.fn(), findFirst: vi.fn() },
    user: { findMany: vi.fn() },
    school: { findUnique: vi.fn() },
  }
  // Transaction runs its callback against the same mocked client (tx === db).
  db.$transaction = vi.fn(async (cb: (tx: any) => unknown) => cb(db))
  return { db }
})
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

  describe("getPeriodsForSection", () => {
    it("denies when schoolId missing", async () => {
      mockAuth("TEACHER", null)

      const result = await getPeriodsForSection({
        sectionId: "sec-1",
        date: "2026-06-01",
      })

      expect(result.success).toBe(false)
    })

    it("reads the section's timetable for the day", async () => {
      vi.mocked(db.school.findUnique).mockResolvedValue({
        name: "Demo",
      } as never)
      vi.mocked(db.timetable.findMany).mockResolvedValue([])
      vi.mocked(db.attendance.findMany).mockResolvedValue([])

      const result = await getPeriodsForSection({
        sectionId: "sec-1",
        date: "2026-06-01",
      })

      expect(result.success).toBe(true)
      expect(
        vi.mocked(db.timetable.findMany).mock.calls[0][0]!.where
      ).toMatchObject({ schoolId: SCHOOL, sectionId: "sec-1" })
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
        sectionId: "sec-1",
        date: "2026-06-01",
        periodId: "p1",
        records: [{ studentId: "s1", status: "present" }],
      })

      expect(result.success).toBe(false)
    })

    it("denies on missing schoolId", async () => {
      mockAuth("TEACHER", null)

      const result = await markPeriodAttendance({
        sectionId: "sec-1",
        date: "2026-06-01",
        periodId: "p1",
        records: [{ studentId: "s1", status: "present" }],
      })

      expect(result.success).toBe(false)
    })

    describe("on a section", () => {
      beforeEach(() => {
        vi.mocked(db.section.findFirst).mockResolvedValue({
          id: "sec-1",
        } as never)
        vi.mocked(db.teacher.findFirst).mockResolvedValue({ id: "t1" } as never)
        // the teacher's own sections
        vi.mocked(db.section.findMany).mockResolvedValue([
          { id: "sec-1" },
        ] as never)
        vi.mocked(db.period.findFirst).mockResolvedValue({
          id: "p1",
          name: "Period 1",
        } as never)
        vi.mocked(db.timetable.findFirst).mockResolvedValue({
          id: "tt-1",
        } as never)
        // submitted students are in the section
        vi.mocked(db.student.findMany).mockResolvedValue([
          { id: "s1" },
        ] as never)
      })

      it("writes the period's marks on the section", async () => {
        vi.mocked(db.attendance.findMany).mockResolvedValue([] as never)
        vi.mocked(db.attendance.createMany).mockResolvedValue({
          count: 1,
        } as never)

        const result = await markPeriodAttendance({
          sectionId: "sec-1",
          date: "2026-06-01",
          periodId: "p1",
          timetableId: "tt-1",
          records: [{ studentId: "s1", status: "PRESENT" }],
        })

        expect(result.success).toBe(true)
        // a given slot must be this section's
        expect(vi.mocked(db.timetable.findFirst)).toHaveBeenCalledWith(
          expect.objectContaining({
            where: { id: "tt-1", schoolId: SCHOOL, sectionId: "sec-1" },
          })
        )
        const createCall = vi.mocked(db.attendance.createMany).mock
          .calls[0][0]
        expect(createCall.data[0]).toMatchObject({
          sectionId: "sec-1",
          periodId: "p1",
          timetableId: "tt-1",
        })
        expect(createCall.data[0]).not.toHaveProperty("classId")
      })

      it("updates a period mark it finds, reviving a removed one", async () => {
        vi.mocked(db.attendance.findMany).mockResolvedValue([
          { id: "att-1", studentId: "s1" },
        ] as never)
        vi.mocked(db.attendance.update).mockResolvedValue({} as never)

        const result = await markPeriodAttendance({
          sectionId: "sec-1",
          date: "2026-06-01",
          periodId: "p1",
          records: [{ studentId: "s1", status: "ABSENT" }],
        })

        expect(result.success).toBe(true)
        const updateCall = vi.mocked(db.attendance.update).mock.calls[0][0]
        expect(updateCall.data).toMatchObject({
          status: "ABSENT",
          deletedAt: null,
        })
      })

      it("refuses a teacher's mark on another teacher's section", async () => {
        vi.mocked(db.section.findMany).mockResolvedValue([
          { id: "sec-9" },
        ] as never)

        const result = await markPeriodAttendance({
          sectionId: "sec-1",
          date: "2026-06-01",
          periodId: "p1",
          records: [{ studentId: "s1", status: "PRESENT" }],
        })

        expect(result.success).toBe(false)
        expect(db.attendance.createMany).not.toHaveBeenCalled()
      })

      it("refuses a student who is not in the section", async () => {
        vi.mocked(db.student.findMany).mockResolvedValue([] as never)

        const result = await markPeriodAttendance({
          sectionId: "sec-1",
          date: "2026-06-01",
          periodId: "p1",
          records: [{ studentId: "s-other", status: "PRESENT" }],
        })

        expect(result.success).toBe(false)
        expect(
          vi.mocked(db.student.findMany).mock.calls[0][0]!.where
        ).toMatchObject({ schoolId: SCHOOL, sectionId: "sec-1" })
        expect(db.attendance.createMany).not.toHaveBeenCalled()
      })
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

      await getPeriodAttendanceAnalytics({ sectionId: "sec-1" })

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
          timetableId: null,
          section: { name: "7-A" },
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
