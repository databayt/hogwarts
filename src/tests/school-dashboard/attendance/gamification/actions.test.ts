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
    },
    attendanceBadge: {
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
      reason: "PERFECT_ATTENDANCE",
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

    it("awardPoints passes the staff gate for a TEACHER (not UNAUTHORIZED)", async () => {
      // beforeEach already sets role TEACHER.
      vi.mocked(db.attendanceReward.create).mockResolvedValue({
        id: "reward-1",
      } as any)

      const result = await awardPoints(validAward as any)

      expect(result.error).not.toBe("UNAUTHORIZED")
    })
  })
})
