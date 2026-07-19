// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { auth } from "@/auth"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import {
  awardPoints,
  getStudentGamificationStats,
  processAttendancePoints,
} from "@/components/school-dashboard/attendance/gamification/actions"

// Mock dependencies
vi.mock("@/lib/db", () => ({
  db: {
    attendanceStreak: {
      upsert: vi.fn(),
      update: vi.fn(),
      findUnique: vi.fn(),
    },
    attendanceReward: {
      create: vi.fn(),
      findMany: vi.fn(),
      groupBy: vi.fn(),
    },
    studentBadge: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
    },
    attendanceBadge: {
      findFirst: vi.fn(),
      create: vi.fn(),
    },
    student: {
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

vi.mock("@/lib/content-display", () => ({
  getDisplayText: vi.fn((text: string) => Promise.resolve(text)),
}))

describe("Gamification Actions - schoolId scoping", () => {
  const mockSchoolId = "school-123"
  const mockUserId = "user-456"
  const mockStudentId = "student-789"
  const mockAttendanceId = "att-001"

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(auth).mockResolvedValue({
      user: {
        id: mockUserId,
        schoolId: mockSchoolId,
        role: "TEACHER",
      },
    } as any)
    // Badge templates auto-create when missing — give the streak-driven badge
    // grant inside processAttendancePoints a clean path so it doesn't throw
    // (previously the mock omitted these, masking the badge-award path).
    vi.mocked(db.attendanceBadge.create).mockResolvedValue({
      id: "badge-1",
      pointValue: 0,
    } as any)
    vi.mocked(db.studentBadge.create).mockResolvedValue({ id: "sb-1" } as any)
  })

  describe("processAttendancePoints", () => {
    it("uses compound unique schoolId_studentId for streak upsert on absence", async () => {
      vi.mocked(db.attendanceStreak.upsert).mockResolvedValue({
        currentStreak: 0,
        longestStreak: 5,
        monthlyAbsent: 1,
      } as any)

      await processAttendancePoints(mockStudentId, mockAttendanceId, "ABSENT")

      expect(db.attendanceStreak.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            schoolId_studentId: {
              schoolId: mockSchoolId,
              studentId: mockStudentId,
            },
          },
        })
      )
    })

    it("uses compound unique schoolId_studentId for streak upsert on present", async () => {
      vi.mocked(db.attendanceStreak.upsert).mockResolvedValue({
        currentStreak: 3,
        longestStreak: 5,
        monthlyPresent: 3,
        monthlyLate: 0,
        monthlyAbsent: 0,
      } as any)
      vi.mocked(db.attendanceStreak.findUnique).mockResolvedValue({
        currentStreak: 4,
        longestStreak: 5,
        monthlyPresent: 4,
        monthlyLate: 0,
        monthlyAbsent: 0,
      } as any)
      vi.mocked(db.attendanceReward.create).mockResolvedValue({} as any)
      vi.mocked(db.studentBadge.findFirst).mockResolvedValue(null)

      await processAttendancePoints(mockStudentId, mockAttendanceId, "PRESENT")

      expect(db.attendanceStreak.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            schoolId_studentId: {
              schoolId: mockSchoolId,
              studentId: mockStudentId,
            },
          },
        })
      )
    })

    it("uses compound unique for streak update when longest streak exceeded", async () => {
      vi.mocked(db.attendanceStreak.upsert).mockResolvedValue({
        currentStreak: 10,
        longestStreak: 5,
        monthlyPresent: 10,
        monthlyLate: 0,
        monthlyAbsent: 0,
      } as any)
      vi.mocked(db.attendanceStreak.update).mockResolvedValue({} as any)
      vi.mocked(db.attendanceStreak.findUnique).mockResolvedValue({
        currentStreak: 11,
        longestStreak: 11,
        monthlyPresent: 11,
        monthlyLate: 0,
        monthlyAbsent: 0,
      } as any)
      vi.mocked(db.attendanceReward.create).mockResolvedValue({} as any)
      vi.mocked(db.studentBadge.findFirst).mockResolvedValue(null)

      await processAttendancePoints(mockStudentId, mockAttendanceId, "PRESENT")

      expect(db.attendanceStreak.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            schoolId_studentId: {
              schoolId: mockSchoolId,
              studentId: mockStudentId,
            },
          },
        })
      )
    })

    it("uses compound unique for streak read (badge qualification check)", async () => {
      vi.mocked(db.attendanceStreak.upsert).mockResolvedValue({
        currentStreak: 2,
        longestStreak: 5,
        monthlyPresent: 2,
        monthlyLate: 0,
        monthlyAbsent: 0,
      } as any)
      vi.mocked(db.attendanceStreak.findUnique).mockResolvedValue({
        currentStreak: 3,
        longestStreak: 5,
        monthlyPresent: 3,
        monthlyLate: 0,
        monthlyAbsent: 0,
      } as any)
      vi.mocked(db.attendanceReward.create).mockResolvedValue({} as any)
      vi.mocked(db.studentBadge.findFirst).mockResolvedValue(null)

      await processAttendancePoints(mockStudentId, mockAttendanceId, "PRESENT")

      expect(db.attendanceStreak.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            schoolId_studentId: {
              schoolId: mockSchoolId,
              studentId: mockStudentId,
            },
          },
        })
      )
    })

    it("returns unauthorized when no schoolId in session", async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: mockUserId, schoolId: null },
      } as any)

      const result = await processAttendancePoints(
        mockStudentId,
        mockAttendanceId,
        "PRESENT"
      )

      expect(result.success).toBe(false)
      expect(result.error).toBe("UNAUTHORIZED")
    })
  })

  describe("getStudentGamificationStats", () => {
    it("uses compound unique for streak read", async () => {
      vi.mocked(db.attendanceReward.findMany).mockResolvedValue([])
      vi.mocked(db.attendanceStreak.findUnique).mockResolvedValue(null)
      vi.mocked(db.studentBadge.findMany).mockResolvedValue([])
      vi.mocked(db.attendanceReward.groupBy).mockResolvedValue([])

      await getStudentGamificationStats(mockStudentId)

      expect(db.attendanceStreak.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            schoolId_studentId: {
              schoolId: mockSchoolId,
              studentId: mockStudentId,
            },
          },
        })
      )
    })
  })

  describe("staff role gating (mutations)", () => {
    const validAward = {
      studentId: mockStudentId,
      points: 10,
      reason: "MONTHLY_PERFECT", // must be a valid AttendanceRewardReason enum value
    }

    it("awardPoints denies a STUDENT role (cannot self-award)", async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: mockUserId, schoolId: mockSchoolId, role: "STUDENT" },
      } as any)

      const result = await awardPoints(validAward as any)

      expect(result.success).toBe(false)
      expect(result.error).toBe("UNAUTHORIZED")
      expect(db.attendanceReward.create).not.toHaveBeenCalled()
    })

    it("awardPoints denies a GUARDIAN role", async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: mockUserId, schoolId: mockSchoolId, role: "GUARDIAN" },
      } as any)

      const result = await awardPoints(validAward as any)

      expect(result.success).toBe(false)
      expect(result.error).toBe("UNAUTHORIZED")
    })

    it("awardPoints succeeds for a TEACHER and persists the reward (schoolId-scoped)", async () => {
      // beforeEach already sets role TEACHER. Previously this used an invalid
      // `reason`, so it passed only because the swallowed ZodError happened not
      // to equal "UNAUTHORIZED" — it never exercised the create path.
      // The tenant guard now verifies the student belongs to the school.
      vi.mocked(db.student.findFirst).mockResolvedValue({
        id: mockStudentId,
      } as any)
      vi.mocked(db.attendanceReward.create).mockResolvedValue({
        id: "reward-1",
      } as any)

      const result = await awardPoints(validAward as any)

      expect(result.success).toBe(true)
      expect(db.attendanceReward.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            schoolId: mockSchoolId,
            studentId: mockStudentId,
            reason: "MONTHLY_PERFECT",
          }),
        })
      )
      // Tenant guard: the student lookup must be schoolId-scoped.
      expect(db.student.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: mockStudentId, schoolId: mockSchoolId },
        })
      )
    })

    it("awardPoints rejects a studentId from another school (no FK write)", async () => {
      vi.mocked(db.student.findFirst).mockResolvedValue(null)

      const result = await awardPoints(validAward as any)

      expect(result.success).toBe(false)
      expect(result.error).toBe("STUDENT_NOT_FOUND")
      expect(db.attendanceReward.create).not.toHaveBeenCalled()
    })
  })
})
