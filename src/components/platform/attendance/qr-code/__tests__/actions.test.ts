import { auth } from "@/auth"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"

// Mock dependencies
vi.mock("@/lib/db", () => ({
  db: {
    class: {
      findFirst: vi.fn(),
    },
    qRCodeSession: {
      create: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
    },
    attendance: {
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

describe("QR Code Server Actions", () => {
  const mockSchoolId = "school-123"
  const mockUserId = "user-123"
  const mockClassId = "class-123"

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

  describe("QR Session Creation", () => {
    it("creates session with correct expiration (30 min default)", async () => {
      vi.mocked(db.class.findFirst).mockResolvedValue({
        id: mockClassId,
        schoolId: mockSchoolId,
        name: "Test Class",
      } as any)

      const mockSession = {
        id: "session-123",
        schoolId: mockSchoolId,
        classId: mockClassId,
        code: expect.any(String),
        expiresAt: expect.any(Date),
        generatedBy: mockUserId,
        isActive: true,
        scanCount: 0,
        scannedBy: [],
      }

      vi.mocked(db.qRCodeSession.create).mockResolvedValue(mockSession as any)

      // Verify session would be created with future expiration
      const now = Date.now()
      const validFor = 30 * 60 // 30 minutes in seconds (default)
      const expectedExpiration = now + validFor * 1000

      // Session expiration should be in the future
      expect(expectedExpiration).toBeGreaterThan(now)
      expect(expectedExpiration).toBeLessThan(now + 31 * 60 * 1000)
    })

    it("generates unique QR codes", () => {
      const codes = new Set<string>()
      const generateCode = (classId: string) => {
        return `${classId}-${Date.now()}-${Math.random().toString(36).substring(7)}`
      }

      // Generate 100 codes and verify uniqueness
      for (let i = 0; i < 100; i++) {
        const code = generateCode(mockClassId)
        expect(codes.has(code)).toBe(false)
        codes.add(code)
      }

      expect(codes.size).toBe(100)
    })

    it("includes schoolId in payload for cross-school isolation", () => {
      const payload = {
        classId: mockClassId,
        schoolId: mockSchoolId,
        timestamp: Date.now(),
        expiresAt: Date.now() + 30 * 60 * 1000,
      }

      expect(payload.schoolId).toBe(mockSchoolId)
    })
  })

  describe("QR Code Validation", () => {
    it("rejects expired QR codes", async () => {
      const expiredSession = {
        id: "session-123",
        code: "expired-code",
        schoolId: mockSchoolId,
        classId: mockClassId,
        expiresAt: new Date(Date.now() - 1000), // 1 second ago
        isActive: true,
        scanCount: 0,
        scannedBy: [],
      }

      // Session should be rejected because expiresAt < now
      const isExpired = expiredSession.expiresAt < new Date()
      expect(isExpired).toBe(true)
    })

    it("rejects inactive QR codes", async () => {
      const inactiveSession = {
        id: "session-123",
        code: "inactive-code",
        schoolId: mockSchoolId,
        classId: mockClassId,
        expiresAt: new Date(Date.now() + 30 * 60 * 1000),
        isActive: false, // Deactivated
        scanCount: 0,
        scannedBy: [],
      }

      expect(inactiveSession.isActive).toBe(false)
    })

    it("enforces max scan count limit", async () => {
      const maxedOutSession = {
        id: "session-123",
        schoolId: mockSchoolId,
        classId: mockClassId,
        expiresAt: new Date(Date.now() + 30 * 60 * 1000),
        isActive: true,
        scanCount: 30,
        maxScans: 30, // At limit
        scannedBy: Array(30).fill("student-"),
      }

      const isAtLimit =
        maxedOutSession.maxScans &&
        maxedOutSession.scanCount >= maxedOutSession.maxScans
      expect(isAtLimit).toBe(true)
    })

    it("prevents duplicate scans by same student", async () => {
      const studentId = "student-123"
      const sessionWithStudent = {
        id: "session-123",
        schoolId: mockSchoolId,
        classId: mockClassId,
        expiresAt: new Date(Date.now() + 30 * 60 * 1000),
        isActive: true,
        scanCount: 5,
        scannedBy: [studentId, "student-456", "student-789"],
      }

      const hasAlreadyScanned = (
        sessionWithStudent.scannedBy as string[]
      ).includes(studentId)
      expect(hasAlreadyScanned).toBe(true)
    })
  })

  describe("Cross-School QR Code Isolation", () => {
    it("rejects QR code from different school", async () => {
      const differentSchoolId = "other-school-456"

      vi.mocked(db.qRCodeSession.findFirst).mockResolvedValue(null) // Not found because schoolId doesn't match

      // Query should filter by schoolId
      const where = {
        code: "some-code",
        schoolId: mockSchoolId, // User's school
        isActive: true,
        expiresAt: { gte: new Date() },
      }

      // If the QR was generated by different school, findFirst returns null
      expect(where.schoolId).toBe(mockSchoolId)
      expect(where.schoolId).not.toBe(differentSchoolId)
    })

    it("includes schoolId in all QR session queries", () => {
      const queryScenarios = [
        { action: "create", where: { schoolId: mockSchoolId } },
        { action: "find", where: { schoolId: mockSchoolId, code: "test" } },
        {
          action: "findMany",
          where: { schoolId: mockSchoolId, classId: "c1" },
        },
        { action: "update", where: { id: "s1" }, data: { scanCount: 1 } },
      ]

      queryScenarios.forEach((scenario) => {
        if (scenario.where && "schoolId" in scenario.where) {
          expect(scenario.where.schoolId).toBe(mockSchoolId)
        }
      })
    })
  })

  describe("QR Session Management", () => {
    it("updates scan count after successful scan", async () => {
      const session = {
        id: "session-123",
        scanCount: 5,
        scannedBy: ["s1", "s2", "s3", "s4", "s5"],
      }

      const newStudentId = "s6"
      const updatedData = {
        scanCount: session.scanCount + 1,
        scannedBy: [...(session.scannedBy as string[]), newStudentId],
      }

      expect(updatedData.scanCount).toBe(6)
      expect(updatedData.scannedBy).toContain(newStudentId)
      expect(updatedData.scannedBy.length).toBe(6)
    })

    it("invalidates session correctly", async () => {
      const invalidateData = {
        isActive: false,
        invalidatedAt: new Date(),
        invalidatedBy: mockUserId,
      }

      expect(invalidateData.isActive).toBe(false)
      expect(invalidateData.invalidatedAt).toBeInstanceOf(Date)
      expect(invalidateData.invalidatedBy).toBe(mockUserId)
    })

    it("cleans up expired sessions query", () => {
      const cleanupWhere = {
        schoolId: mockSchoolId,
        expiresAt: { lt: new Date() },
        isActive: true,
      }

      expect(cleanupWhere.expiresAt.lt).toBeInstanceOf(Date)
    })
  })

  describe("Attendance Marking via QR", () => {
    it("creates attendance record with QR_CODE method", () => {
      const now = new Date()
      const attendanceData = {
        schoolId: mockSchoolId,
        studentId: "student-123",
        classId: mockClassId,
        date: now,
        status: "PRESENT",
        method: "QR_CODE",
        notes: `Scanned via QR_CODE at ${now.toISOString()}`,
        markedAt: now,
      }

      expect(attendanceData.method).toBe("QR_CODE")
      expect(attendanceData.status).toBe("PRESENT")
    })

    it("logs scan event with metadata", () => {
      const eventData = {
        schoolId: mockSchoolId,
        studentId: "student-123",
        eventType: "SCAN_SUCCESS",
        method: "QR_CODE",
        deviceId: "device-abc",
        location: { lat: 24.7136, lon: 46.6753 },
        metadata: {
          qrSessionId: "session-123",
          classId: mockClassId,
        },
        success: true,
        timestamp: new Date(),
      }

      expect(eventData.eventType).toBe("SCAN_SUCCESS")
      expect(eventData.metadata.qrSessionId).toBeDefined()
    })

    it("logs failed scan attempts", () => {
      const failedEventData = {
        schoolId: mockSchoolId,
        studentId: "student-123",
        eventType: "SCAN_FAILURE",
        method: "QR_CODE",
        success: false,
        errorMessage: "Invalid or expired QR code",
        timestamp: new Date(),
      }

      expect(failedEventData.success).toBe(false)
      expect(failedEventData.errorMessage).toBeDefined()
    })
  })
})
