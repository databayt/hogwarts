// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { auth } from "@/auth"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"

import {
  addStudentIdentifier,
  deleteStudentIdentifier,
  findStudentByIdentifier,
  getStudentIdentifiers,
} from "@/components/school-dashboard/attendance/actions/identifiers"

vi.mock("@/lib/db", () => ({
  db: {
    student: { findFirst: vi.fn() },
    studentIdentifier: {
      create: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
    },
  },
}))

vi.mock("@/lib/tenant-context", () => ({ getTenantContext: vi.fn() }))
vi.mock("@/auth", () => ({ auth: vi.fn() }))

const SCHOOL = "school-1"
const USER = "user-1"

function mockAuth(
  role: string | undefined = "ADMIN",
  schoolId: string | undefined = SCHOOL
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

describe("attendance identifiers actions", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAuth("ADMIN")
  })

  describe("addStudentIdentifier", () => {
    const valid = {
      studentId: "s1",
      type: "BARCODE" as const,
      value: "BC123",
      isActive: true,
    }

    it("requires admin role — teacher gets insufficient permissions", async () => {
      mockAuth("TEACHER")

      const result = await addStudentIdentifier(valid)

      expect(result).toEqual({
        success: false,
        error: "Insufficient permissions",
      })
    })

    it("requires authentication (auth returns null)", async () => {
      vi.mocked(auth).mockResolvedValue(null)

      const result = await addStudentIdentifier(valid)

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBe("Unauthorized")
      }
    })

    it("rejects student from a different school", async () => {
      vi.mocked(db.student.findFirst).mockResolvedValue(null)

      const result = await addStudentIdentifier(valid)

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toContain("Student not found")
      }
      expect(db.studentIdentifier.create).not.toHaveBeenCalled()
    })

    it("creates identifier with schoolId scope when student exists", async () => {
      vi.mocked(db.student.findFirst).mockResolvedValue({ id: "s1" } as any)
      vi.mocked(db.studentIdentifier.create).mockResolvedValue({
        id: "i1",
      } as any)

      const result = await addStudentIdentifier(valid)

      expect(result.success).toBe(true)
      expect(db.student.findFirst).toHaveBeenCalledWith({
        where: { id: "s1", schoolId: SCHOOL },
        select: { id: true },
      })
      expect(db.studentIdentifier.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            schoolId: SCHOOL,
            studentId: "s1",
            type: "BARCODE",
            issuedBy: USER,
          }),
        })
      )
    })
  })

  describe("getStudentIdentifiers", () => {
    it("denies non-admin roles", async () => {
      mockAuth("STAFF")

      const result = await getStudentIdentifiers()

      expect(result).toEqual({
        success: false,
        error: "Insufficient permissions",
      })
      expect(db.studentIdentifier.findMany).not.toHaveBeenCalled()
    })

    it("scopes findMany by schoolId, optionally filtered by studentId", async () => {
      vi.mocked(db.studentIdentifier.findMany).mockResolvedValue([] as any)

      await getStudentIdentifiers("s5")

      expect(db.studentIdentifier.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { schoolId: SCHOOL, studentId: "s5" },
        })
      )
    })
  })

  describe("findStudentByIdentifier", () => {
    it("requires scanner role (TEACHER/ADMIN/STAFF/DEVELOPER)", async () => {
      mockAuth("STUDENT")

      const result = await findStudentByIdentifier({
        type: "BARCODE",
        value: "BC1",
      })

      expect(result.found).toBe(false)
    })

    it("looks up by compound (schoolId, type, value)", async () => {
      mockAuth("TEACHER")
      vi.mocked(db.studentIdentifier.findFirst).mockResolvedValue(null)

      await findStudentByIdentifier({ type: "BARCODE", value: "BC1" })

      const call = vi.mocked(db.studentIdentifier.findFirst).mock.calls[0]?.[0]
      expect(call?.where).toMatchObject({
        schoolId: SCHOOL,
        type: "BARCODE",
        value: "BC1",
      })
    })
  })

  describe("deleteStudentIdentifier", () => {
    it("denies non-admin", async () => {
      mockAuth("TEACHER")

      const result = await deleteStudentIdentifier("i1")

      expect(result.success).toBe(false)
    })

    it("scopes delete by schoolId to prevent cross-school deletion", async () => {
      vi.mocked(db.studentIdentifier.findFirst).mockResolvedValue({
        id: "i1",
        schoolId: SCHOOL,
      } as any)
      vi.mocked(db.studentIdentifier.deleteMany).mockResolvedValue({
        count: 1,
      } as any)

      await deleteStudentIdentifier("i1")

      expect(db.studentIdentifier.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "i1", schoolId: SCHOOL },
        })
      )
      expect(db.studentIdentifier.deleteMany).toHaveBeenCalledWith({
        where: { id: "i1", schoolId: SCHOOL },
      })
    })

    it("returns error when identifier not in this school", async () => {
      vi.mocked(db.studentIdentifier.findFirst).mockResolvedValue(null)

      const result = await deleteStudentIdentifier("i999")

      expect(result.success).toBe(false)
      expect(db.studentIdentifier.deleteMany).not.toHaveBeenCalled()
    })
  })
})
