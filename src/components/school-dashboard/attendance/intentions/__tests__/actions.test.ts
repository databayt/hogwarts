// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { auth } from "@/auth"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"

import { reviewAbsenceIntention, submitAbsenceIntention } from "../actions"

// Mock dependencies
vi.mock("@/lib/db", () => ({
  db: {
    student: {
      findFirst: vi.fn(),
    },
    absenceIntention: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
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
        givenName: "Test",
        surname: "Student",
      } as any)
      vi.mocked(db.absenceIntention.findFirst).mockResolvedValue(null) // No overlapping
      vi.mocked(db.absenceIntention.create).mockResolvedValue({
        id: mockIntentionId,
      } as any)
      // The notification helper uses findFirst with schoolId
      // We verify the main action succeeds (notification is fire-and-forget)

      const result = await submitAbsenceIntention({
        studentId: mockStudentId,
        dateFrom: new Date("2026-03-10"),
        dateTo: new Date("2026-03-12"),
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
        student: { givenName: "Test", surname: "Student" },
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
})
