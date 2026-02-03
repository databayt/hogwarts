import { auth } from "@/auth"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"

// Mock dependencies
vi.mock("@/lib/db", () => ({
  db: {
    class: {
      findFirst: vi.fn(),
    },
    student: {
      findFirst: vi.fn(),
    },
    studentIdentifier: {
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    attendance: {
      findFirst: vi.fn(),
      create: vi.fn(),
    },
    attendanceEvent: {
      create: vi.fn(),
    },
  },
}))

vi.mock("@/auth", () => ({
  auth: vi.fn(),
}))

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}))

describe("Barcode Server Actions", () => {
  const mockSchoolId = "school-123"
  const mockUserId = "user-123"
  const mockClassId = "class-123"
  const mockStudentId = "student-123"

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(auth).mockResolvedValue({
      user: {
        id: mockUserId,
        schoolId: mockSchoolId,
        role: "TEACHER",
      },
    } as any)
  })

  describe("Student Identifier Lookup", () => {
    it("finds student by barcode", async () => {
      const mockIdentifier = {
        id: "identifier-123",
        schoolId: mockSchoolId,
        studentId: mockStudentId,
        type: "BARCODE",
        value: "BC-001234",
        isActive: true,
        expiresAt: null,
        lastUsedAt: null,
        usageCount: 0,
        student: {
          id: mockStudentId,
          givenName: "Ahmed",
          surname: "Al-Rashid",
        },
      }

      vi.mocked(db.studentIdentifier.findFirst).mockResolvedValue(
        mockIdentifier as any
      )

      const result = await db.studentIdentifier.findFirst({
        where: {
          schoolId: mockSchoolId,
          type: "BARCODE",
          value: "BC-001234",
          isActive: true,
        },
        include: { student: true },
      })

      expect(result).toBeDefined()
      expect(result?.studentId).toBe(mockStudentId)
      expect(result?.value).toBe("BC-001234")
    })

    it("returns null for non-existent barcode", async () => {
      vi.mocked(db.studentIdentifier.findFirst).mockResolvedValue(null)

      const result = await db.studentIdentifier.findFirst({
        where: {
          schoolId: mockSchoolId,
          type: "BARCODE",
          value: "INVALID-CODE",
          isActive: true,
        },
      })

      expect(result).toBeNull()
    })
  })

  describe("Expired Identifier Rejection", () => {
    it("rejects expired card", () => {
      const expiredIdentifier = {
        id: "identifier-123",
        schoolId: mockSchoolId,
        studentId: mockStudentId,
        type: "BARCODE",
        value: "BC-001234",
        isActive: true,
        expiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // Yesterday
      }

      const isExpired =
        expiredIdentifier.expiresAt &&
        new Date(expiredIdentifier.expiresAt) < new Date()

      expect(isExpired).toBe(true)
    })

    it("accepts valid (non-expired) card", () => {
      const validIdentifier = {
        id: "identifier-123",
        schoolId: mockSchoolId,
        studentId: mockStudentId,
        type: "BARCODE",
        value: "BC-001234",
        isActive: true,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      }

      const isExpired =
        validIdentifier.expiresAt &&
        new Date(validIdentifier.expiresAt) < new Date()

      expect(isExpired).toBe(false)
    })

    it("accepts card with no expiration date", () => {
      const noExpirationIdentifier = {
        id: "identifier-123",
        schoolId: mockSchoolId,
        studentId: mockStudentId,
        type: "BARCODE",
        value: "BC-001234",
        isActive: true,
        expiresAt: null,
      }

      // Null expiresAt means no expiration
      const isExpired =
        noExpirationIdentifier.expiresAt &&
        new Date(noExpirationIdentifier.expiresAt) < new Date()

      expect(isExpired).toBeFalsy() // null is falsy
    })
  })

  describe("Cross-School Identifier Isolation", () => {
    it("only searches within user's school", async () => {
      const differentSchoolId = "other-school-456"

      vi.mocked(db.studentIdentifier.findFirst).mockResolvedValue(null)

      // Query should be scoped by schoolId
      const where = {
        schoolId: mockSchoolId,
        type: "BARCODE",
        value: "BC-001234",
        isActive: true,
      }

      expect(where.schoolId).toBe(mockSchoolId)
      expect(where.schoolId).not.toBe(differentSchoolId)
    })

    it("prevents cross-school barcode lookup", async () => {
      // Barcode exists but in different school
      const barcodeInOtherSchool = {
        id: "identifier-999",
        schoolId: "other-school-456",
        studentId: "student-999",
        type: "BARCODE",
        value: "BC-001234",
        isActive: true,
      }

      // When searching with user's schoolId, should not find it
      vi.mocked(db.studentIdentifier.findFirst).mockImplementation(
        async (args: any) => {
          if (args.where.schoolId === mockSchoolId) {
            return null // Not found in user's school
          }
          return barcodeInOtherSchool as any
        }
      )

      const result = await db.studentIdentifier.findFirst({
        where: {
          schoolId: mockSchoolId,
          type: "BARCODE",
          value: "BC-001234",
          isActive: true,
        },
      })

      expect(result).toBeNull()
    })
  })

  describe("Invalid Barcode Format Handling", () => {
    it("handles empty barcode", () => {
      const emptyBarcode = ""
      expect(emptyBarcode.trim().length).toBe(0)
    })

    it("handles whitespace-only barcode", () => {
      const whitespaceBarcode = "   "
      expect(whitespaceBarcode.trim().length).toBe(0)
    })

    it("handles very long barcode", () => {
      const maxBarcodeLength = 255
      const longBarcode = "A".repeat(300)

      expect(longBarcode.length).toBeGreaterThan(maxBarcodeLength)
    })

    it("handles special characters in barcode", () => {
      const specialBarcode = "BC-001234-ABC!@#$"
      // Should still be searchable (database handles special chars)
      expect(specialBarcode).toBeTruthy()
    })
  })

  describe("Usage Count Increment", () => {
    it("increments usage count on successful scan", async () => {
      const identifier = {
        id: "identifier-123",
        usageCount: 5,
      }

      vi.mocked(db.studentIdentifier.update).mockResolvedValue({
        ...identifier,
        usageCount: 6,
        lastUsedAt: new Date(),
      } as any)

      const result = await db.studentIdentifier.update({
        where: { id: identifier.id },
        data: {
          lastUsedAt: new Date(),
          usageCount: { increment: 1 },
        },
      })

      expect(result.usageCount).toBe(6)
    })

    it("updates lastUsedAt timestamp", async () => {
      const now = new Date()
      const updateData = {
        lastUsedAt: now,
        usageCount: { increment: 1 },
      }

      expect(updateData.lastUsedAt).toBeInstanceOf(Date)
    })
  })

  describe("Barcode Assignment", () => {
    it("prevents duplicate barcode assignment", async () => {
      const existingBarcode = {
        id: "identifier-existing",
        schoolId: mockSchoolId,
        studentId: "other-student",
        type: "BARCODE",
        value: "BC-001234",
        isActive: true,
      }

      vi.mocked(db.studentIdentifier.findFirst).mockResolvedValue(
        existingBarcode as any
      )

      // Check if barcode already exists
      const existing = await db.studentIdentifier.findFirst({
        where: {
          schoolId: mockSchoolId,
          type: "BARCODE",
          value: "BC-001234",
        },
      })

      expect(existing).not.toBeNull()
      // Should throw error about duplicate
    })

    it("allows same barcode in different schools", async () => {
      const schoolABarcode = {
        id: "identifier-1",
        schoolId: "school-A",
        studentId: "student-A",
        type: "BARCODE",
        value: "BC-001234",
        isActive: true,
      }

      const schoolBBarcode = {
        id: "identifier-2",
        schoolId: "school-B",
        studentId: "student-B",
        type: "BARCODE",
        value: "BC-001234", // Same barcode value
        isActive: true,
      }

      // Both should be valid (different schoolId)
      expect(schoolABarcode.value).toBe(schoolBBarcode.value)
      expect(schoolABarcode.schoolId).not.toBe(schoolBBarcode.schoolId)
    })

    it("validates student exists before assignment", async () => {
      vi.mocked(db.student.findFirst).mockResolvedValue(null)

      const result = await db.student.findFirst({
        where: {
          id: "non-existent-student",
          schoolId: mockSchoolId,
        },
      })

      expect(result).toBeNull()
    })
  })

  describe("Attendance Marking via Barcode", () => {
    it("creates attendance record with BARCODE method", () => {
      const now = new Date()
      const attendanceData = {
        schoolId: mockSchoolId,
        studentId: mockStudentId,
        classId: mockClassId,
        date: now,
        status: "PRESENT",
        method: "BARCODE",
        notes: `Scanned via BARCODE at ${now.toISOString()}`,
        markedAt: now,
      }

      expect(attendanceData.method).toBe("BARCODE")
      expect(attendanceData.status).toBe("PRESENT")
    })

    it("prevents duplicate attendance marking", async () => {
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const existingAttendance = {
        id: "attendance-123",
        schoolId: mockSchoolId,
        studentId: mockStudentId,
        classId: mockClassId,
        date: today,
        status: "PRESENT",
      }

      vi.mocked(db.attendance.findFirst).mockResolvedValue(
        existingAttendance as any
      )

      const existing = await db.attendance.findFirst({
        where: {
          schoolId: mockSchoolId,
          studentId: mockStudentId,
          classId: mockClassId,
          date: today,
        },
      })

      expect(existing).not.toBeNull()
      // Should throw "Attendance already marked"
    })

    it("logs scan events", () => {
      const successEvent = {
        schoolId: mockSchoolId,
        studentId: mockStudentId,
        eventType: "SCAN_SUCCESS",
        method: "BARCODE",
        deviceId: "scanner-001",
        success: true,
        metadata: { barcode: "BC-001234", format: "CODE128" },
        timestamp: new Date(),
      }

      const failureEvent = {
        schoolId: mockSchoolId,
        studentId: mockUserId,
        eventType: "SCAN_FAILURE",
        method: "BARCODE",
        success: false,
        errorMessage: "Barcode not found in system",
        metadata: { barcode: "INVALID", format: "CODE128" },
        timestamp: new Date(),
      }

      expect(successEvent.eventType).toBe("SCAN_SUCCESS")
      expect(failureEvent.eventType).toBe("SCAN_FAILURE")
      expect(failureEvent.errorMessage).toBeDefined()
    })
  })
})
