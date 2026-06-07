// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { auth } from "@/auth"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"

import {
  getStudentIntentions,
  reviewAbsenceIntention,
  submitAbsenceIntention,
} from "@/components/school-dashboard/attendance/intentions/actions"

// Mock dependencies
vi.mock("@/lib/db", () => ({
  db: {
    student: {
      findFirst: vi.fn(),
    },
    absenceIntention: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    notification: {
      create: vi.fn(),
    },
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

describe("Intentions Actions - schoolId scoping", () => {
  const mockSchoolId = "school-123"
  const mockUserId = "user-456"
  const mockStudentId = "student-789"

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

  describe("notifyIntentionSubmission (via submitAbsenceIntention)", () => {
    it("reads intention with schoolId scope in notification helper", async () => {
      const mockIntentionId = "intention-001"
      vi.mocked(db.student.findFirst).mockResolvedValue({
        id: mockStudentId,
        firstName: "Test",
        lastName: "Student",
      } as any)
      vi.mocked(db.absenceIntention.findFirst).mockResolvedValue(null) // No overlapping
      vi.mocked(db.absenceIntention.create).mockResolvedValue({
        id: mockIntentionId,
      } as any)
      // The notification helper uses findFirst with schoolId
      // We verify the main action succeeds (notification is fire-and-forget)

      const result = await submitAbsenceIntention({
        studentId: mockStudentId,
        dateFrom: new Date("2027-03-10"),
        dateTo: new Date("2027-03-12"),
        reason: "MEDICAL",
        description: "Doctor appointment",
      })

      expect(result.success).toBe(true)
      // Verify intention was created with schoolId
      expect(db.absenceIntention.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            schoolId: mockSchoolId,
            studentId: mockStudentId,
          }),
        })
      )
    })
  })

  describe("notifyIntentionDecision (via reviewAbsenceIntention)", () => {
    it("reads intention with schoolId scope in notification helper", async () => {
      const mockIntentionId = "intention-001"
      vi.mocked(db.absenceIntention.findFirst).mockResolvedValue({
        id: mockIntentionId,
        schoolId: mockSchoolId,
        status: "PENDING",
        student: { firstName: "Test", lastName: "Student" },
      } as any)
      vi.mocked(db.absenceIntention.update).mockResolvedValue({
        id: mockIntentionId,
      } as any)

      const result = await reviewAbsenceIntention({
        intentionId: mockIntentionId,
        status: "APPROVED",
      })

      expect(result.success).toBe(true)
      // Verify the intention lookup includes schoolId
      expect(db.absenceIntention.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            id: mockIntentionId,
            schoolId: mockSchoolId,
          }),
        })
      )
    })
  })

  describe("getStudentIntentions - access control", () => {
    it("denies an unauthenticated caller", async () => {
      vi.mocked(auth).mockResolvedValue(null as any)

      const result = await getStudentIntentions(mockStudentId)

      expect(result.success).toBe(false)
      expect(db.absenceIntention.findMany).not.toHaveBeenCalled()
    })

    it("denies a STUDENT viewing another student's intentions", async () => {
      vi.mocked(getTenantContext).mockResolvedValue({
        schoolId: mockSchoolId,
        subdomain: "test-school",
        role: "STUDENT",
        locale: "en",
      } as any)
      vi.mocked(auth).mockResolvedValue({
        user: { id: mockUserId, schoolId: mockSchoolId, role: "STUDENT" },
      } as any)
      // Target student is owned by a different user and has no matching guardian
      vi.mocked(db.student.findFirst).mockResolvedValue({
        userId: "other-user-999",
        studentGuardians: [{ guardian: { userId: "guardian-aaa" } }],
      } as any)

      const result = await getStudentIntentions(mockStudentId)

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBe("UNAUTHORIZED")
      }
      expect(db.absenceIntention.findMany).not.toHaveBeenCalled()
    })

    it("denies a GUARDIAN not linked to the student", async () => {
      vi.mocked(getTenantContext).mockResolvedValue({
        schoolId: mockSchoolId,
        subdomain: "test-school",
        role: "GUARDIAN",
        locale: "en",
      } as any)
      vi.mocked(auth).mockResolvedValue({
        user: { id: mockUserId, schoolId: mockSchoolId, role: "GUARDIAN" },
      } as any)
      vi.mocked(db.student.findFirst).mockResolvedValue({
        userId: "other-user-999",
        studentGuardians: [{ guardian: { userId: "guardian-aaa" } }],
      } as any)

      const result = await getStudentIntentions(mockStudentId)

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBe("UNAUTHORIZED")
      }
      expect(db.absenceIntention.findMany).not.toHaveBeenCalled()
    })

    it("allows the student to view their own intentions", async () => {
      vi.mocked(getTenantContext).mockResolvedValue({
        schoolId: mockSchoolId,
        subdomain: "test-school",
        role: "STUDENT",
        locale: "en",
      } as any)
      vi.mocked(auth).mockResolvedValue({
        user: { id: mockUserId, schoolId: mockSchoolId, role: "STUDENT" },
      } as any)
      // Student record owned by the caller
      vi.mocked(db.student.findFirst).mockResolvedValue({
        userId: mockUserId,
        studentGuardians: [],
      } as any)
      vi.mocked(db.absenceIntention.findMany).mockResolvedValue([])

      const result = await getStudentIntentions(mockStudentId)

      expect(result.success).toBe(true)
      expect(db.absenceIntention.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            schoolId: mockSchoolId,
            studentId: mockStudentId,
          }),
        })
      )
    })

    it("allows a linked GUARDIAN to view the student's intentions", async () => {
      vi.mocked(getTenantContext).mockResolvedValue({
        schoolId: mockSchoolId,
        subdomain: "test-school",
        role: "GUARDIAN",
        locale: "en",
      } as any)
      vi.mocked(auth).mockResolvedValue({
        user: { id: mockUserId, schoolId: mockSchoolId, role: "GUARDIAN" },
      } as any)
      vi.mocked(db.student.findFirst).mockResolvedValue({
        userId: "other-user-999",
        studentGuardians: [{ guardian: { userId: mockUserId } }],
      } as any)
      vi.mocked(db.absenceIntention.findMany).mockResolvedValue([])

      const result = await getStudentIntentions(mockStudentId)

      expect(result.success).toBe(true)
      expect(db.absenceIntention.findMany).toHaveBeenCalled()
    })

    it("allows a staff role (TEACHER) without an ownership lookup", async () => {
      // beforeEach already sets role TEACHER
      vi.mocked(db.absenceIntention.findMany).mockResolvedValue([])

      const result = await getStudentIntentions(mockStudentId)

      expect(result.success).toBe(true)
      // Staff bypass the per-student ownership query entirely
      expect(db.student.findFirst).not.toHaveBeenCalled()
      expect(db.absenceIntention.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            schoolId: mockSchoolId,
            studentId: mockStudentId,
          }),
        })
      )
    })

    it("allows a staff role (ADMIN) to view any student's intentions", async () => {
      vi.mocked(getTenantContext).mockResolvedValue({
        schoolId: mockSchoolId,
        subdomain: "test-school",
        role: "ADMIN",
        locale: "en",
      } as any)
      vi.mocked(auth).mockResolvedValue({
        user: { id: mockUserId, schoolId: mockSchoolId, role: "ADMIN" },
      } as any)
      vi.mocked(db.absenceIntention.findMany).mockResolvedValue([])

      const result = await getStudentIntentions(mockStudentId)

      expect(result.success).toBe(true)
      expect(db.student.findFirst).not.toHaveBeenCalled()
    })
  })
})
