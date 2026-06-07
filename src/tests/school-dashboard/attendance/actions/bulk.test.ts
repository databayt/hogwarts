// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import * as authModule from "@/auth"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import * as module from "@/lib/tenant-context"

import { bulkUploadAttendance, getAttendanceReport } from "@/components/school-dashboard/attendance/actions/bulk"

// Mock dependencies - explicit inline mock so vi.spyOn finds existing methods
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
      delete: vi.fn(),
      deleteMany: vi.fn(),
      count: vi.fn(),
      groupBy: vi.fn(),
    },
    student: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
    },
    class: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}))

vi.mock("@/lib/tenant-context", () => ({
  getTenantContext: vi.fn(),
}))

vi.mock("@/auth", () => ({
  auth: vi.fn(),
}))

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}))

describe("Bulk Attendance Operations", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("bulkUploadAttendance", () => {
    const mockSchoolId = "school-123"
    const mockUserId = "user-123"
    const mockClassId = "class-123"
    const mockDate = "2024-01-15"

    beforeEach(() => {
      vi.mocked(module.getTenantContext).mockResolvedValue({
        schoolId: mockSchoolId,
        subdomain: "demo",
      })
      vi.mocked(authModule.auth).mockResolvedValue({
        user: {
          id: mockUserId,
          name: "Test User",
          email: "test@example.com",
          role: "ADMIN",
        },
      } as any)
    })

    it("should return error when schoolId is missing", async () => {
      vi.mocked(module.getTenantContext).mockResolvedValueOnce({
        schoolId: "",
        subdomain: "demo",
      })

      const result = await bulkUploadAttendance({
        classId: mockClassId,
        date: mockDate,
        records: [{ studentId: "student-1", status: "PRESENT" }],
      })

      expect(result.successful).toBe(0)
      expect(result.failed).toBe(0)
      expect(result.errors).toHaveLength(1)
      expect(result.errors[0].error).toContain("Missing school context")
    })

    it("should return error when user is not authenticated", async () => {
      vi.mocked(authModule.auth).mockResolvedValueOnce(null)

      const result = await bulkUploadAttendance({
        classId: mockClassId,
        date: mockDate,
        records: [{ studentId: "student-1", status: "PRESENT" }],
      })

      expect(result.successful).toBe(0)
      expect(result.failed).toBe(0)
      expect(result.errors[0].error).toContain("Not authenticated")
    })

    it("should validate that students exist in school", async () => {
      vi.spyOn(db.student, "findMany").mockResolvedValueOnce([])

      const result = await bulkUploadAttendance({
        classId: mockClassId,
        date: mockDate,
        records: [
          { studentId: "nonexistent-1", status: "PRESENT" },
          { studentId: "nonexistent-2", status: "ABSENT" },
        ],
      })

      expect(result.successful).toBe(0)
      expect(result.failed).toBe(2)
      expect(result.errors).toHaveLength(2)
      expect(result.errors[0].error).toContain("Student not found")
      expect(result.rolledBack).toBe(true)
    })

    it("should validate that class exists in school", async () => {
      vi.spyOn(db.student, "findMany").mockResolvedValueOnce([
        { id: "student-1" },
      ])
      vi.spyOn(db.class, "findFirst").mockResolvedValueOnce(null)

      const result = await bulkUploadAttendance({
        classId: "nonexistent-class",
        date: mockDate,
        records: [{ studentId: "student-1", status: "PRESENT" }],
      })

      expect(result.successful).toBe(0)
      expect(result.failed).toBe(1)
      expect(result.errors[0].error).toContain("Class not found")
      expect(result.rolledBack).toBe(true)
    })

    it("should successfully upload valid attendance records", async () => {
      vi.spyOn(db.student, "findMany").mockResolvedValueOnce([
        { id: "student-1" },
        { id: "student-2" },
      ])
      vi.spyOn(db.class, "findFirst").mockResolvedValueOnce({
        id: mockClassId,
        schoolId: mockSchoolId,
        name: "Class 10A",
      })
      // Prefetch of existing attendance rows (N+1 fix in bulk.ts) — none exist.
      vi.spyOn(db.attendance, "findMany").mockResolvedValueOnce([])
      vi.spyOn(db, "$transaction").mockImplementationOnce(async (callback) => {
        await callback(db)
      })

      const result = await bulkUploadAttendance({
        classId: mockClassId,
        date: mockDate,
        method: "BULK_UPLOAD",
        records: [
          { studentId: "student-1", status: "PRESENT" },
          { studentId: "student-2", status: "ABSENT" },
        ],
      })

      expect(result.successful).toBe(2)
      expect(result.failed).toBe(0)
      expect(result.errors).toHaveLength(0)
      expect(result.rolledBack).toBe(false)
    })

    it("should rollback on transaction error", async () => {
      vi.spyOn(db.student, "findMany").mockResolvedValueOnce([
        { id: "student-1" },
      ])
      vi.spyOn(db.class, "findFirst").mockResolvedValueOnce({
        id: mockClassId,
        schoolId: mockSchoolId,
        name: "Class 10A",
      })
      // Prefetch of existing attendance rows (N+1 fix in bulk.ts) — none exist.
      vi.spyOn(db.attendance, "findMany").mockResolvedValueOnce([])
      vi.spyOn(db, "$transaction").mockRejectedValueOnce(
        new Error("Database error")
      )

      const result = await bulkUploadAttendance({
        classId: mockClassId,
        date: mockDate,
        records: [{ studentId: "student-1", status: "PRESENT" }],
      })

      expect(result.successful).toBe(0)
      expect(result.failed).toBe(1)
      expect(result.errors[0].error).toContain("Transaction failed")
      expect(result.rolledBack).toBe(true)
    })
  })

  describe("getAttendanceReport", () => {
    const mockSchoolId = "school-123"
    const mockUserId = "user-456"

    beforeEach(() => {
      vi.mocked(module.getTenantContext).mockResolvedValue({
        schoolId: mockSchoolId,
        subdomain: "demo",
      })
      // ADMIN role passes canViewSchoolAnalytics gate; non-TEACHER avoids teacher-scoping branch
      vi.mocked(authModule.auth).mockResolvedValue({
        user: {
          id: mockUserId,
          schoolId: mockSchoolId,
          role: "ADMIN",
        },
      } as any)
      vi.mocked(db.attendance.findMany).mockResolvedValue([])
      vi.mocked(db.attendance.count).mockResolvedValue(0)
    })

    it("should return error when schoolId is missing", async () => {
      vi.mocked(module.getTenantContext).mockResolvedValueOnce({
        schoolId: "",
        subdomain: "demo",
      })

      const result = await getAttendanceReport({
        limit: 10,
        offset: 0,
      })

      expect(result.success).toBe(false)
      expect(result.error).toContain("Missing school context")
    })

    it("should apply class filter", async () => {
      await getAttendanceReport({
        classId: "class-123",
        limit: 10,
        offset: 0,
      })

      expect(db.attendance.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            classId: "class-123",
          }),
        })
      )
    })

    it("should apply date range filter", async () => {
      const from = "2024-01-01"
      const to = "2024-01-31"

      await getAttendanceReport({
        dateFrom: from,
        dateTo: to,
        limit: 10,
        offset: 0,
      })

      expect(db.attendance.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            date: expect.objectContaining({
              gte: new Date(from),
              lte: new Date(to),
            }),
          }),
        })
      )
    })
  })
})
