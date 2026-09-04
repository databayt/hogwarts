// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { auth } from "@/auth"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"
import {
  getGuardianChildrenAttendance,
  getStudentOwnAttendance,
} from "@/components/school-dashboard/attendance/actions/records"

vi.mock("@/lib/db", () => ({
  db: {
    student: { findFirst: vi.fn() },
    guardian: { findFirst: vi.fn() },
    attendance: { findMany: vi.fn() },
    term: { findFirst: vi.fn() },
  },
}))
vi.mock("@/lib/tenant-context", () => ({ getTenantContext: vi.fn() }))
vi.mock("@/auth", () => ({ auth: vi.fn() }))

const SCHOOL = "school-1"
const USER = "user-1"

function mockAuth(
  role: string | null = "STUDENT",
  schoolId: string | null = SCHOOL
) {
  vi.mocked(getTenantContext).mockResolvedValue({
    schoolId: schoolId ?? "",
    subdomain: "demo",
    role: role as any,
    locale: "en",
  })
  vi.mocked(auth).mockResolvedValue(
    role ? ({ user: { id: USER, schoolId, role } } as any) : null
  )
}

describe("attendance records (self-service) actions", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("getStudentOwnAttendance", () => {
    it("denies when schoolId is missing", async () => {
      mockAuth("STUDENT", null)

      const result = await getStudentOwnAttendance()

      expect(result.success).toBe(false)
    })

    it("denies when not authenticated", async () => {
      mockAuth(null)

      const result = await getStudentOwnAttendance()

      expect(result.success).toBe(false)
    })

    it("returns error when student record not found for the user", async () => {
      mockAuth("STUDENT")
      vi.mocked(db.student.findFirst).mockResolvedValue(null)

      const result = await getStudentOwnAttendance()

      expect(result.success).toBe(false)
    })

    it("reads ONLY this school's attendance via compound where", async () => {
      mockAuth("STUDENT")
      vi.mocked(db.student.findFirst).mockResolvedValue({ id: "s1" } as any)
      vi.mocked(db.term.findFirst).mockResolvedValue({
        startDate: new Date("2026-01-01"),
      } as any)
      vi.mocked(db.attendance.findMany).mockResolvedValue([])

      await getStudentOwnAttendance()

      expect(db.student.findFirst).toHaveBeenCalledWith({
        where: { userId: USER, schoolId: SCHOOL },
        select: { id: true },
      })
      expect(db.attendance.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            studentId: "s1",
            schoolId: SCHOOL,
            deletedAt: null,
          }),
        })
      )
    })

    it("excludes soft-deleted rows (deletedAt: null)", async () => {
      mockAuth("STUDENT")
      vi.mocked(db.student.findFirst).mockResolvedValue({ id: "s1" } as any)
      vi.mocked(db.term.findFirst).mockResolvedValue(null)
      vi.mocked(db.attendance.findMany).mockResolvedValue([])

      await getStudentOwnAttendance()

      const call = vi.mocked(db.attendance.findMany).mock.calls[0]?.[0]
      expect(call?.where).toMatchObject({ deletedAt: null })
    })

    // attn-03: a live-class-synced (VIRTUAL) row carries no classId, so
    // `class` resolves to null — the view must still name the period.
    it("falls back to periodName + section name when a VIRTUAL row has no class", async () => {
      mockAuth("STUDENT")
      vi.mocked(db.student.findFirst).mockResolvedValue({ id: "s1" } as any)
      vi.mocked(db.term.findFirst).mockResolvedValue(null)
      vi.mocked(db.attendance.findMany).mockResolvedValue([
        {
          id: "a1",
          date: new Date("2026-06-19"),
          status: "PRESENT",
          classId: null,
          notes: null,
          periodName: "Period 1",
          section: { name: "Grade 7-A" },
          class: null,
        },
        {
          id: "a2",
          date: new Date("2026-06-18"),
          status: "PRESENT",
          classId: null,
          notes: null,
          periodName: "Period 2",
          section: null,
          class: null,
        },
      ] as any)

      const result = await getStudentOwnAttendance()

      expect(result.success).toBe(true)
      if (!result.success) return
      expect(result.data.records[0].className).toBe("Period 1 - Grade 7-A")
      // No section on the row -> periodName alone.
      expect(result.data.records[1].className).toBe("Period 2")
    })

    it("prefers the class name over the period fallback when a class is present", async () => {
      mockAuth("STUDENT")
      vi.mocked(db.student.findFirst).mockResolvedValue({ id: "s1" } as any)
      vi.mocked(db.term.findFirst).mockResolvedValue(null)
      vi.mocked(db.attendance.findMany).mockResolvedValue([
        {
          id: "a1",
          date: new Date("2026-06-19"),
          status: "PRESENT",
          classId: "c1",
          notes: null,
          periodName: "Period 1",
          section: { name: "Grade 7-A" },
          class: { name: "7A", subject: { name: "Math" } },
        },
      ] as any)

      const result = await getStudentOwnAttendance()

      expect(result.success).toBe(true)
      if (!result.success) return
      expect(result.data.records[0].className).toBe("Math - 7A")
    })

    it("returns null className when neither class nor periodName is set", async () => {
      mockAuth("STUDENT")
      vi.mocked(db.student.findFirst).mockResolvedValue({ id: "s1" } as any)
      vi.mocked(db.term.findFirst).mockResolvedValue(null)
      vi.mocked(db.attendance.findMany).mockResolvedValue([
        {
          id: "a1",
          date: new Date("2026-06-19"),
          status: "PRESENT",
          classId: null,
          notes: null,
          periodName: null,
          section: null,
          class: null,
        },
      ] as any)

      const result = await getStudentOwnAttendance()

      expect(result.success).toBe(true)
      if (!result.success) return
      expect(result.data.records[0].className).toBeNull()
    })
  })

  describe("getGuardianChildrenAttendance", () => {
    it("denies when schoolId missing", async () => {
      mockAuth("GUARDIAN", null)

      const result = await getGuardianChildrenAttendance()

      expect(result.success).toBe(false)
    })

    it("denies when not authenticated", async () => {
      mockAuth(null)

      const result = await getGuardianChildrenAttendance()

      expect(result.success).toBe(false)
    })

    it("returns error when guardian record not found", async () => {
      mockAuth("GUARDIAN")
      vi.mocked(db.guardian.findFirst).mockResolvedValue(null)

      const result = await getGuardianChildrenAttendance()

      expect(result.success).toBe(false)
    })

    it("scopes the guardian lookup by userId AND schoolId (no cross-school leak)", async () => {
      mockAuth("GUARDIAN")
      vi.mocked(db.guardian.findFirst).mockResolvedValue(null)

      await getGuardianChildrenAttendance()

      expect(db.guardian.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: USER, schoolId: SCHOOL },
        })
      )
    })

    // attn-03: same VIRTUAL-row fallback, on the guardian's read of a child's
    // attendance.
    it("falls back to periodName + section name for a child's VIRTUAL row with no class", async () => {
      mockAuth("GUARDIAN")
      vi.mocked(db.guardian.findFirst).mockResolvedValue({
        studentGuardians: [
          {
            student: {
              id: "st1",
              firstName: "Amal",
              middleName: null,
              lastName: "Ali",
              studentClasses: [],
              attendances: [
                {
                  id: "a1",
                  date: new Date("2026-06-19"),
                  status: "PRESENT",
                  classId: null,
                  notes: null,
                  periodName: "Period 3",
                  section: { name: "Grade 5-B" },
                  class: null,
                },
              ],
            },
          },
        ],
      } as any)

      const result = await getGuardianChildrenAttendance()

      expect(result.success).toBe(true)
      if (!result.success) return
      expect(result.data.students[0].attendances[0].className).toBe(
        "Period 3 - Grade 5-B"
      )
    })
  })
})
