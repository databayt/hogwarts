// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { auth } from "@/auth"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"
import {
  checkOutStudent,
  deleteAttendance,
  getAttendanceReportCsv,
  markAttendance,
  restoreAttendance,
} from "@/components/school-dashboard/attendance/actions"

// Mock dependencies - must be inside vi.mock factory to avoid hoisting issues
vi.mock("@/lib/db", () => ({
  db: {
    attendance: {
      create: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      upsert: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
      count: vi.fn(),
    },
    absenceIntention: {
      findMany: vi.fn(),
    },
    student: {
      findFirst: vi.fn(),
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

vi.mock("@/lib/action-errors", () => ({
  ACTION_ERRORS: {
    MISSING_SCHOOL: "Missing school context",
    UNAUTHORIZED: "Unauthorized",
  },
  actionError: (msg: string) => ({ success: false, error: msg }),
}))

vi.mock("@/lib/notifications/sms", () => ({
  isChannelAvailable: vi.fn(() => false),
  sendAttendanceSMS: vi.fn(),
}))

vi.mock("@/lib/content-display", () => ({
  getDisplayText: vi.fn((text: string) => Promise.resolve(text)),
}))

describe("Attendance Actions", () => {
  const mockSchoolId = "school-123"
  const mockUserId = "user-456"

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getTenantContext).mockResolvedValue({
      schoolId: mockSchoolId,
      subdomain: "test-school",
      role: "TEACHER",
      locale: "en",
    })
    vi.mocked(auth).mockResolvedValue({
      user: {
        id: mockUserId,
        schoolId: mockSchoolId,
        role: "TEACHER",
      },
    } as any)
  })

  describe("markAttendance", () => {
    it("creates new attendance with schoolId when no existing record", async () => {
      vi.mocked(db.absenceIntention.findMany).mockResolvedValue([])
      vi.mocked(db.attendance.findFirst).mockResolvedValue(null)
      vi.mocked(db.attendance.create).mockResolvedValue({} as any)

      const result = await markAttendance({
        classId: "c1",
        date: new Date().toISOString(),
        records: [{ studentId: "a", status: "present" }],
      })

      expect(result.success).toBe(true)
      expect(db.attendance.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            schoolId: mockSchoolId,
            status: "PRESENT",
          }),
        })
      )
    })

    it("updates existing attendance with schoolId-scoped updateMany", async () => {
      vi.mocked(db.absenceIntention.findMany).mockResolvedValue([])
      vi.mocked(db.attendance.findFirst).mockResolvedValue({
        id: "existing-att",
        schoolId: mockSchoolId,
      } as any)
      vi.mocked(db.attendance.updateMany).mockResolvedValue({ count: 1 })

      const result = await markAttendance({
        classId: "c1",
        date: new Date().toISOString(),
        records: [{ studentId: "a", status: "late" }],
      })

      expect(result.success).toBe(true)
      expect(db.attendance.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "existing-att", schoolId: mockSchoolId },
          data: expect.objectContaining({ status: "LATE" }),
        })
      )
    })
  })

  describe("getAttendanceReportCsv", () => {
    it("generates CSV string from rows", async () => {
      vi.mocked(db.attendance.findMany).mockResolvedValue([
        {
          date: new Date("2024-01-01"),
          studentId: "stu1",
          classId: "c1",
          status: "PRESENT",
          method: "MANUAL",
          checkInTime: null,
          checkOutTime: null,
          notes: null,
          student: { givenName: "Test", surname: "Student" },
          class: { name: "Math 101" },
        },
      ] as any)

      const csv = await getAttendanceReportCsv({ classId: "c1" })

      expect(csv).toContain("date")
      expect(csv).toContain("studentId")
      expect(csv).toContain("stu1")
    })
  })

  // ================================================================
  // Defense-in-depth tests for core.ts updateMany with schoolId
  // ================================================================

  describe("deleteAttendance - defense-in-depth", () => {
    it("soft-deletes with schoolId-scoped updateMany", async () => {
      vi.mocked(db.attendance.findFirst).mockResolvedValue({
        id: "att-001",
        schoolId: mockSchoolId,
        deletedAt: null,
      } as any)
      vi.mocked(db.attendance.updateMany).mockResolvedValue({ count: 1 })

      const result = await deleteAttendance("att-001")

      expect(result.success).toBe(true)
      expect(result.deletedAt).toBeDefined()
      expect(db.attendance.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "att-001", schoolId: mockSchoolId },
          data: expect.objectContaining({ deletedAt: expect.any(Date) }),
        })
      )
    })

    it("returns error when record not found in school", async () => {
      vi.mocked(db.attendance.findFirst).mockResolvedValue(null)

      const result = await deleteAttendance("att-999")

      expect(result.success).toBe(false)
      expect(result.error).toBe("Attendance record not found")
      expect(db.attendance.updateMany).not.toHaveBeenCalled()
    })
  })

  describe("restoreAttendance - defense-in-depth", () => {
    it("restores with schoolId-scoped updateMany", async () => {
      vi.mocked(db.attendance.findFirst).mockResolvedValue({
        id: "att-002",
        schoolId: mockSchoolId,
        deletedAt: new Date(),
      } as any)
      vi.mocked(db.attendance.updateMany).mockResolvedValue({ count: 1 })

      const result = await restoreAttendance("att-002")

      expect(result.success).toBe(true)
      expect(db.attendance.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "att-002", schoolId: mockSchoolId },
          data: { deletedAt: null },
        })
      )
    })

    it("returns error when deleted record not found", async () => {
      vi.mocked(db.attendance.findFirst).mockResolvedValue(null)

      const result = await restoreAttendance("att-999")

      expect(result.success).toBe(false)
      expect(result.error).toBe("Deleted attendance record not found")
      expect(db.attendance.updateMany).not.toHaveBeenCalled()
    })
  })

  describe("checkOutStudent - defense-in-depth", () => {
    it("updates with schoolId-scoped updateMany", async () => {
      vi.mocked(db.attendance.findFirst).mockResolvedValue({
        id: "att-003",
        schoolId: mockSchoolId,
        checkOutTime: null,
      } as any)
      vi.mocked(db.attendance.updateMany).mockResolvedValue({ count: 1 })

      const result = await checkOutStudent({
        studentId: "student-1",
        classId: "class-1",
        date: new Date().toISOString(),
      })

      expect(result.success).toBe(true)
      expect(db.attendance.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "att-003", schoolId: mockSchoolId },
          data: expect.objectContaining({
            checkOutTime: expect.any(Date),
          }),
        })
      )
    })

    it("returns error when no check-in found", async () => {
      vi.mocked(db.attendance.findFirst).mockResolvedValue(null)

      const result = await checkOutStudent({
        studentId: "student-1",
        classId: "class-1",
        date: new Date().toISOString(),
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe("No check-in record found")
    })
  })
})
