import * as authModule from "@/auth"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import * as module from "@/lib/tenant-context"

import {
  bulkUploadAttendance,
  getAttendanceReport,
  getClassAttendanceStats,
  getStudentAttendanceStats,
} from "../bulk"

// Mock dependencies
vi.mock("@/lib/tenant-context")
vi.mock("@/auth")
vi.mock("@/lib/db", { spy: true })
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
        user: { id: mockUserId, name: "Test User", email: "test@example.com" },
      })
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

    beforeEach(() => {
      vi.mocked(module.getTenantContext).mockResolvedValue({
        schoolId: mockSchoolId,
        subdomain: "demo",
      })
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
      const findManySpy = vi.spyOn(db.attendance, "findMany")
      vi.spyOn(db.attendance, "count").mockResolvedValue(0)

      await getAttendanceReport({
        classId: "class-123",
        limit: 10,
        offset: 0,
      })

      expect(findManySpy).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            classId: "class-123",
          }),
        })
      )
    })

    it("should apply date range filter", async () => {
      const findManySpy = vi.spyOn(db.attendance, "findMany")
      vi.spyOn(db.attendance, "count").mockResolvedValue(0)

      const from = "2024-01-01"
      const to = "2024-01-31"

      await getAttendanceReport({
        dateFrom: from,
        dateTo: to,
        limit: 10,
        offset: 0,
      })

      expect(findManySpy).toHaveBeenCalledWith(
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

  describe("getClassAttendanceStats", () => {
    const mockSchoolId = "school-123"
    const mockClassId = "class-123"

    beforeEach(() => {
      vi.mocked(module.getTenantContext).mockResolvedValue({
        schoolId: mockSchoolId,
        subdomain: "demo",
      })
    })

    it("should return error when schoolId is missing", async () => {
      vi.mocked(module.getTenantContext).mockResolvedValueOnce({
        schoolId: "",
        subdomain: "demo",
      })

      const result = await getClassAttendanceStats({
        classId: mockClassId,
      })

      expect(result.error).toContain("Missing school context")
    })

    it("should calculate attendance statistics correctly", async () => {
      vi.spyOn(db.attendance, "count")
        .mockResolvedValueOnce(90) // present
        .mockResolvedValueOnce(5) // absent
        .mockResolvedValueOnce(3) // late
        .mockResolvedValueOnce(1) // excused
        .mockResolvedValueOnce(1) // sick
        .mockResolvedValueOnce(0) // holiday
        .mockResolvedValueOnce(100) // total

      const result = await getClassAttendanceStats({
        classId: mockClassId,
      })

      expect(result.success).toBe(true)
      expect(result.stats.present).toBe(90)
      expect(result.stats.absent).toBe(5)
      expect(result.stats.total).toBe(100)
      expect(result.stats.attendanceRate).toBe(90)
    })
  })

  describe("getStudentAttendanceStats", () => {
    const mockSchoolId = "school-123"
    const mockStudentId = "student-123"

    beforeEach(() => {
      vi.mocked(module.getTenantContext).mockResolvedValue({
        schoolId: mockSchoolId,
        subdomain: "demo",
      })
    })

    it("should calculate student attendance statistics", async () => {
      vi.spyOn(db.attendance, "count")
        .mockResolvedValueOnce(45) // present
        .mockResolvedValueOnce(2) // absent
        .mockResolvedValueOnce(1) // late
        .mockResolvedValueOnce(0) // excused
        .mockResolvedValueOnce(0) // sick
        .mockResolvedValueOnce(0) // holiday
        .mockResolvedValueOnce(48) // total

      const result = await getStudentAttendanceStats({
        studentId: mockStudentId,
      })

      expect(result.success).toBe(true)
      expect(result.stats.present).toBe(45)
      expect(result.stats.absent).toBe(2)
      expect(result.stats.total).toBe(48)
      expect(result.stats.attendanceRate).toBe(93.75)
    })
  })
})
