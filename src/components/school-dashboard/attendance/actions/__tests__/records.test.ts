// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { auth } from "@/auth"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"

import {
  getGuardianChildrenAttendance,
  getStudentOwnAttendance,
} from "../records"

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
  })
})
