// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"

import { processKioskCheck } from "../actions"

// Mock dependencies
vi.mock("@/lib/db", () => ({
  db: {
    student: {
      findFirst: vi.fn(),
    },
    attendance: {
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    kioskLog: {
      create: vi.fn(),
    },
    kioskSession: {
      updateMany: vi.fn(),
    },
  },
}))

vi.mock("@/lib/tenant-context", () => ({
  getTenantContext: vi.fn(),
}))

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}))

describe("Kiosk Actions - schoolId scoping", () => {
  const mockSchoolId = "school-123"
  const mockStudentId = "student-789"
  const mockClassId = "class-456"

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getTenantContext).mockResolvedValue({
      schoolId: mockSchoolId,
      subdomain: "test-school",
      role: "TEACHER",
      locale: "en",
    })
  })

  describe("processKioskCheck", () => {
    it("looks up student with schoolId scope (findFirst)", async () => {
      vi.mocked(db.student.findFirst).mockResolvedValue({
        id: mockStudentId,
        studentClasses: [{ classId: mockClassId }],
      } as any)
      vi.mocked(db.attendance.findFirst).mockResolvedValue(null)
      vi.mocked(db.attendance.create).mockResolvedValue({
        id: "att-001",
      } as any)
      vi.mocked(db.kioskLog.create).mockResolvedValue({} as any)
      vi.mocked(db.kioskSession.updateMany).mockResolvedValue({
        count: 1,
      } as any)

      await processKioskCheck({
        kioskId: "kiosk-1",
        studentId: mockStudentId,
        action: "CHECK_IN",
        method: "BARCODE",
      })

      expect(db.student.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: mockStudentId, schoolId: mockSchoolId },
        })
      )
    })

    it("returns error for student not in school", async () => {
      vi.mocked(db.student.findFirst).mockResolvedValue(null)

      const result = await processKioskCheck({
        kioskId: "kiosk-1",
        studentId: "wrong-student",
        action: "CHECK_IN",
        method: "BARCODE",
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe("Student not found")
    })

    it("returns error when missing school context", async () => {
      vi.mocked(getTenantContext).mockResolvedValue({
        schoolId: "",
        subdomain: "",
        role: "TEACHER",
        locale: "en",
      })

      const result = await processKioskCheck({
        kioskId: "kiosk-1",
        studentId: mockStudentId,
        action: "CHECK_IN",
        method: "BARCODE",
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe("Missing school context")
    })
  })
})
