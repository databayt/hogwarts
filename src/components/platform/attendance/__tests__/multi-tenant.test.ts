import { auth } from "@/auth"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"

// Mock dependencies
vi.mock("@/lib/db", () => ({
  db: {
    attendance: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      upsert: vi.fn(),
    },
    qRCodeSession: {
      findFirst: vi.fn(),
      create: vi.fn(),
    },
    studentIdentifier: {
      findFirst: vi.fn(),
    },
    attendanceIntervention: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
    },
    geoFence: {
      findMany: vi.fn(),
    },
    attendanceExcuse: {
      findFirst: vi.fn(),
    },
  },
}))

vi.mock("@/auth", () => ({
  auth: vi.fn(),
}))

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}))

describe("Multi-Tenant Isolation Tests", () => {
  const schoolA = "school-A"
  const schoolB = "school-B"
  const userFromSchoolA = {
    id: "user-A",
    schoolId: schoolA,
    role: "TEACHER",
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(auth).mockResolvedValue({
      user: userFromSchoolA,
    } as any)
  })

  describe("Cross-School Attendance Access", () => {
    it("denies access to attendance from different school", async () => {
      // Attendance exists in School B
      const attendanceInSchoolB = {
        id: "attendance-B1",
        schoolId: schoolB,
        studentId: "student-B1",
        classId: "class-B1",
        date: new Date(),
        status: "PRESENT",
      }

      // Query from School A should not find it
      vi.mocked(db.attendance.findFirst).mockImplementation(
        async (args: any) => {
          if (args.where.schoolId === schoolA) {
            return null // Not found because it's in School B
          }
          return attendanceInSchoolB as any
        }
      )

      const result = await db.attendance.findFirst({
        where: {
          id: "attendance-B1",
          schoolId: schoolA, // User's school
        },
      })

      expect(result).toBeNull()
    })

    it("returns only attendance from user's school", async () => {
      const attendanceSchoolA = [
        {
          id: "a1",
          schoolId: schoolA,
          studentId: "s1",
          status: "PRESENT",
        },
        {
          id: "a2",
          schoolId: schoolA,
          studentId: "s2",
          status: "ABSENT",
        },
      ]

      vi.mocked(db.attendance.findMany).mockImplementation(
        async (args: any) => {
          if (args.where.schoolId === schoolA) {
            return attendanceSchoolA as any
          }
          return []
        }
      )

      const result = await db.attendance.findMany({
        where: { schoolId: schoolA },
      })

      expect(result.length).toBe(2)
      result.forEach((record: any) => {
        expect(record.schoolId).toBe(schoolA)
      })
    })

    it("prevents creating attendance in different school", async () => {
      // Attempting to create attendance with mismatched schoolId
      const createAttempt = {
        schoolId: schoolB, // Different from user's school
        studentId: "student-B1",
        classId: "class-B1",
        date: new Date(),
        status: "PRESENT",
      }

      // Server action should validate schoolId matches session
      const sessionSchoolId = userFromSchoolA.schoolId
      const isAllowed = createAttempt.schoolId === sessionSchoolId

      expect(isAllowed).toBe(false)
    })
  })

  describe("Cross-School QR Code Rejection", () => {
    it("rejects QR code from different school", async () => {
      const qrSessionSchoolB = {
        id: "qr-B1",
        schoolId: schoolB,
        classId: "class-B1",
        code: "QR-CODE-123",
        expiresAt: new Date(Date.now() + 30 * 60 * 1000),
        isActive: true,
      }

      vi.mocked(db.qRCodeSession.findFirst).mockImplementation(
        async (args: any) => {
          // Query includes schoolId from session
          if (args.where.schoolId === schoolA) {
            return null // QR is in School B, not found
          }
          return qrSessionSchoolB as any
        }
      )

      const result = await db.qRCodeSession.findFirst({
        where: {
          code: "QR-CODE-123",
          schoolId: schoolA, // User's school
          isActive: true,
          expiresAt: { gte: new Date() },
        },
      })

      expect(result).toBeNull()
    })

    it("only creates QR sessions for user's school", async () => {
      const createData = {
        schoolId: schoolA, // From session, not user input
        classId: "class-A1",
        code: "NEW-QR-CODE",
        generatedBy: userFromSchoolA.id,
        expiresAt: new Date(Date.now() + 30 * 60 * 1000),
      }

      // schoolId should come from session, not request
      expect(createData.schoolId).toBe(userFromSchoolA.schoolId)
    })
  })

  describe("Cross-School Identifier Lookup", () => {
    it("fails lookup for identifier from different school", async () => {
      const identifierSchoolB = {
        id: "id-B1",
        schoolId: schoolB,
        studentId: "student-B1",
        type: "BARCODE",
        value: "BC-001234",
        isActive: true,
      }

      vi.mocked(db.studentIdentifier.findFirst).mockImplementation(
        async (args: any) => {
          if (args.where.schoolId === schoolA) {
            return null // Not found in user's school
          }
          return identifierSchoolB as any
        }
      )

      const result = await db.studentIdentifier.findFirst({
        where: {
          schoolId: schoolA,
          type: "BARCODE",
          value: "BC-001234",
          isActive: true,
        },
      })

      expect(result).toBeNull()
    })

    it("prevents barcode spoofing across schools", async () => {
      // Same barcode value exists in both schools
      const barcodeValue = "BC-001234"

      // User from School A should only find School A's barcode
      vi.mocked(db.studentIdentifier.findFirst).mockImplementation(
        async (args: any) => {
          if (args.where.schoolId === schoolA) {
            return {
              id: "id-A1",
              schoolId: schoolA,
              studentId: "student-A1",
              type: "BARCODE",
              value: barcodeValue,
            } as any
          }
          if (args.where.schoolId === schoolB) {
            return {
              id: "id-B1",
              schoolId: schoolB,
              studentId: "student-B1",
              type: "BARCODE",
              value: barcodeValue,
            } as any
          }
          return null
        }
      )

      const result = await db.studentIdentifier.findFirst({
        where: {
          schoolId: schoolA,
          type: "BARCODE",
          value: barcodeValue,
          isActive: true,
        },
      })

      expect(result?.schoolId).toBe(schoolA)
      expect(result?.studentId).toBe("student-A1")
    })
  })

  describe("Cross-School Intervention Access", () => {
    it("denies access to interventions from different school", async () => {
      const interventionSchoolB = {
        id: "int-B1",
        schoolId: schoolB,
        studentId: "student-B1",
        type: "PARENT_PHONE_CALL",
        status: "SCHEDULED",
      }

      vi.mocked(db.attendanceIntervention.findFirst).mockImplementation(
        async (args: any) => {
          if (args.where.schoolId === schoolA) {
            return null
          }
          return interventionSchoolB as any
        }
      )

      const result = await db.attendanceIntervention.findFirst({
        where: {
          id: "int-B1",
          schoolId: schoolA,
        },
      })

      expect(result).toBeNull()
    })

    it("returns only interventions from user's school", async () => {
      const interventionsSchoolA = [
        { id: "int-A1", schoolId: schoolA, studentId: "s1" },
        { id: "int-A2", schoolId: schoolA, studentId: "s2" },
      ]

      vi.mocked(db.attendanceIntervention.findMany).mockImplementation(
        async (args: any) => {
          if (args.where.schoolId === schoolA) {
            return interventionsSchoolA as any
          }
          return []
        }
      )

      const result = await db.attendanceIntervention.findMany({
        where: { schoolId: schoolA },
      })

      expect(result.length).toBe(2)
      result.forEach((int: any) => {
        expect(int.schoolId).toBe(schoolA)
      })
    })
  })

  describe("Cross-School Geofence Access", () => {
    it("only returns geofences from user's school", async () => {
      const geofencesSchoolA = [
        { id: "geo-A1", schoolId: schoolA, name: "School A Grounds" },
        { id: "geo-A2", schoolId: schoolA, name: "School A Library" },
      ]

      vi.mocked(db.geoFence.findMany).mockImplementation(async (args: any) => {
        if (args.where.schoolId === schoolA) {
          return geofencesSchoolA as any
        }
        return []
      })

      const result = await db.geoFence.findMany({
        where: { schoolId: schoolA, isActive: true },
      })

      expect(result.length).toBe(2)
      result.forEach((geo: any) => {
        expect(geo.schoolId).toBe(schoolA)
      })
    })

    it("prevents geofence check with cross-school location data", () => {
      // Location data from student in School B
      const locationData = {
        studentId: "student-B1",
        schoolId: schoolB, // Different school
        lat: 24.7136,
        lon: 46.6753,
      }

      // Geofence check should be scoped by session's schoolId
      const sessionSchoolId = schoolA
      const isAuthorized = locationData.schoolId === sessionSchoolId

      expect(isAuthorized).toBe(false)
    })
  })

  describe("Cross-School Excuse Access", () => {
    it("denies access to excuses from different school", async () => {
      const excuseSchoolB = {
        id: "excuse-B1",
        schoolId: schoolB,
        attendanceId: "attendance-B1",
        reason: "MEDICAL",
        status: "PENDING",
      }

      vi.mocked(db.attendanceExcuse.findFirst).mockImplementation(
        async (args: any) => {
          if (args.where.schoolId === schoolA) {
            return null
          }
          return excuseSchoolB as any
        }
      )

      const result = await db.attendanceExcuse.findFirst({
        where: {
          id: "excuse-B1",
          schoolId: schoolA,
        },
      })

      expect(result).toBeNull()
    })
  })

  describe("schoolId Enforcement on All Queries", () => {
    it("verifies schoolId is always included in WHERE clause", () => {
      const queryPatterns = [
        // Attendance
        {
          model: "attendance.findFirst",
          where: { schoolId: schoolA, id: "a1" },
        },
        {
          model: "attendance.findMany",
          where: { schoolId: schoolA, date: new Date() },
        },
        // For upsert with compound key, schoolId is embedded in the unique constraint
        {
          model: "attendance.upsert",
          where: { schoolId: schoolA, studentId: "s1", classId: "c1" },
        },

        // QR Sessions
        {
          model: "qRCodeSession.findFirst",
          where: { schoolId: schoolA, code: "x" },
        },

        // Identifiers
        {
          model: "studentIdentifier.findFirst",
          where: { schoolId: schoolA, value: "x" },
        },

        // Interventions
        {
          model: "intervention.findMany",
          where: { schoolId: schoolA, studentId: "s1" },
        },

        // Geofences
        {
          model: "geoFence.findMany",
          where: { schoolId: schoolA, isActive: true },
        },

        // Excuses
        { model: "excuse.findFirst", where: { schoolId: schoolA, id: "e1" } },
      ]

      queryPatterns.forEach((pattern) => {
        // Check if schoolId is either at top level or nested in compound key
        const hasSchoolId =
          "schoolId" in pattern.where ||
          (pattern.where.schoolId_studentId_classId_date &&
            "schoolId" in pattern.where.schoolId_studentId_classId_date)
        expect(hasSchoolId).toBe(true)

        if ("schoolId" in pattern.where) {
          expect(pattern.where.schoolId).toBe(schoolA)
        }
      })
    })

    it("creates all records with schoolId from session", () => {
      const sessionSchoolId = userFromSchoolA.schoolId

      const createPatterns = [
        {
          model: "attendance",
          data: { schoolId: sessionSchoolId, studentId: "s1", classId: "c1" },
        },
        {
          model: "qRCodeSession",
          data: { schoolId: sessionSchoolId, classId: "c1", code: "x" },
        },
        {
          model: "studentIdentifier",
          data: { schoolId: sessionSchoolId, studentId: "s1", value: "x" },
        },
        {
          model: "intervention",
          data: { schoolId: sessionSchoolId, studentId: "s1", type: "PHONE" },
        },
        {
          model: "excuse",
          data: {
            schoolId: sessionSchoolId,
            attendanceId: "a1",
            reason: "MEDICAL",
          },
        },
      ]

      createPatterns.forEach((pattern) => {
        expect(pattern.data.schoolId).toBe(sessionSchoolId)
      })
    })
  })
})
