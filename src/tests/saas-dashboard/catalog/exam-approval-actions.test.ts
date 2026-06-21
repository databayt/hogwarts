// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { revalidatePath } from "next/cache"
import { auth } from "@/auth"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import {
  approveExam,
  approveExamTemplate,
  getPendingExams,
  getPendingExamTemplates,
  rejectExam,
  rejectExamTemplate,
} from "@/components/saas-dashboard/catalog/exam-approval-actions"

// ============================================================================
// Mocks
// ============================================================================

vi.mock("@/auth", () => ({
  auth: vi.fn(),
}))

vi.mock("@/lib/db", () => ({
  db: {
    exam: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      count: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
    examTemplate: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      count: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
    school: {
      findMany: vi.fn(),
    },
  },
}))

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}))

// ============================================================================
// Helpers
// ============================================================================

function mockDeveloperSession() {
  vi.mocked(auth).mockResolvedValue({
    user: { id: "dev-1", role: "DEVELOPER" },
  } as any)
}

function mockNonDeveloperSession(role = "ADMIN") {
  vi.mocked(auth).mockResolvedValue({
    user: { id: "user-1", role },
  } as any)
}

// ============================================================================
// Tests
// ============================================================================

describe("Exam Approval Actions", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ==========================================================================
  // getPendingExams
  // ==========================================================================

  describe("getPendingExams", () => {
    it("returns paginated pending exams", async () => {
      mockDeveloperSession()

      const mockExams = [
        {
          id: "exam-1",
          title: "Math Final",
          examType: "FINAL",
          totalMarks: 100,
          contributedBy: "teacher-1",
          createdAt: new Date("2026-01-01"),
          subject: { name: "Mathematics" },
          contributedSchoolId: "school-1",
          examQuestions: [{ id: "q-1" }, { id: "q-2" }],
        },
      ]

      vi.mocked(db.exam.findMany).mockResolvedValue(mockExams as any)
      vi.mocked(db.exam.count).mockResolvedValue(1)
      vi.mocked(db.school.findMany).mockResolvedValue([
        { id: "school-1", name: "Demo School" },
      ] as any)

      const result = await getPendingExams(1)

      expect(result.items).toHaveLength(1)
      expect(result.items[0].title).toBe("Math Final")
      expect(result.items[0].questionCount).toBe(2)
      expect(result.items[0].contributedSchoolName).toBe("Demo School")
      expect(result.total).toBe(1)
      expect(result.pageSize).toBe(20)
    })

    it("requires DEVELOPER role (returns empty on auth failure)", async () => {
      mockNonDeveloperSession("ADMIN")

      const result = await getPendingExams()

      expect(result.items).toEqual([])
      expect(result.total).toBe(0)
      expect(db.exam.findMany).not.toHaveBeenCalled()
    })
  })

  // ==========================================================================
  // approveExam
  // ==========================================================================

  describe("approveExam", () => {
    it("approves exam with PUBLISHED status", async () => {
      mockDeveloperSession()
      vi.mocked(db.exam.findUnique).mockResolvedValue({
        id: "exam-1",
      } as any)
      vi.mocked(db.exam.updateMany).mockResolvedValue({ count: 1 } as any)

      const result = await approveExam("exam-1")

      expect(result).toEqual({ success: true })
      expect(db.exam.updateMany).toHaveBeenCalledWith({
        where: { id: "exam-1", approvalStatus: "PENDING" },
        data: expect.objectContaining({
          approvalStatus: "APPROVED",
          approvedBy: "dev-1",
          status: "PUBLISHED",
          rejectionReason: null,
        }),
      })
      expect(revalidatePath).toHaveBeenCalledWith("/catalog/approvals")
    })

    it("returns error when already processed (race lost)", async () => {
      mockDeveloperSession()
      vi.mocked(db.exam.findUnique).mockResolvedValue({ id: "exam-1" } as any)
      vi.mocked(db.exam.updateMany).mockResolvedValue({ count: 0 } as any)

      const result = await approveExam("exam-1")

      expect(result).toEqual({
        success: false,
        error: "exam_already_processed",
      })
    })

    it("returns error for non-existent exam", async () => {
      mockDeveloperSession()
      vi.mocked(db.exam.findUnique).mockResolvedValue(null)

      const result = await approveExam("nonexistent")

      expect(result).toEqual({ success: false, error: "exam_not_found" })
      expect(db.exam.updateMany).not.toHaveBeenCalled()
    })

    it("requires DEVELOPER role", async () => {
      mockNonDeveloperSession("ADMIN")

      const result = await approveExam("exam-1")

      expect(result).toEqual({
        success: false,
        error: "Unauthorized: DEVELOPER role required",
      })
    })
  })

  // ==========================================================================
  // rejectExam
  // ==========================================================================

  describe("rejectExam", () => {
    it("rejects exam with reason", async () => {
      mockDeveloperSession()
      vi.mocked(db.exam.findUnique).mockResolvedValue({
        id: "exam-1",
      } as any)
      vi.mocked(db.exam.updateMany).mockResolvedValue({ count: 1 } as any)

      const result = await rejectExam("exam-1", "Low quality")

      expect(result).toEqual({ success: true })
      expect(db.exam.updateMany).toHaveBeenCalledWith({
        where: { id: "exam-1", approvalStatus: "PENDING" },
        data: expect.objectContaining({
          approvalStatus: "REJECTED",
          rejectionReason: "Low quality",
        }),
      })
    })

    it("returns error for empty reason", async () => {
      mockDeveloperSession()

      const result = await rejectExam("exam-1", "")

      expect(result).toEqual({
        success: false,
        error: "rejection_reason_required",
      })
      expect(db.exam.findUnique).not.toHaveBeenCalled()
    })

    it("returns error for non-existent exam", async () => {
      mockDeveloperSession()
      vi.mocked(db.exam.findUnique).mockResolvedValue(null)

      const result = await rejectExam("nonexistent", "Bad content")

      expect(result).toEqual({ success: false, error: "exam_not_found" })
    })

    it("requires DEVELOPER role", async () => {
      mockNonDeveloperSession("TEACHER")

      const result = await rejectExam("exam-1", "Reason")

      expect(result).toEqual({
        success: false,
        error: "Unauthorized: DEVELOPER role required",
      })
    })
  })

  // ==========================================================================
  // getPendingExamTemplates
  // ==========================================================================

  describe("getPendingExamTemplates", () => {
    it("returns paginated pending templates", async () => {
      mockDeveloperSession()

      const mockTemplates = [
        {
          id: "tpl-1",
          name: "Midterm Template",
          examType: "MIDTERM",
          duration: 60,
          totalMarks: 50,
          contributedBy: "teacher-1",
          contributedSchoolId: "school-1",
          createdAt: new Date("2026-01-15"),
          catalogSubject: { name: "Science" },
        },
      ]

      vi.mocked(db.examTemplate.findMany).mockResolvedValue(
        mockTemplates as any
      )
      vi.mocked(db.examTemplate.count).mockResolvedValue(1)
      vi.mocked(db.school.findMany).mockResolvedValue([
        { id: "school-1", name: "Demo School" },
      ] as any)

      const result = await getPendingExamTemplates(1)

      expect(result.items).toHaveLength(1)
      expect(result.items[0].name).toBe("Midterm Template")
      expect(result.items[0].subjectName).toBe("Science")
      expect(result.total).toBe(1)
    })

    it("requires DEVELOPER role (returns empty on auth failure)", async () => {
      mockNonDeveloperSession("ADMIN")

      const result = await getPendingExamTemplates()

      expect(result.items).toEqual([])
      expect(result.total).toBe(0)
    })
  })

  // ==========================================================================
  // approveExamTemplate
  // ==========================================================================

  describe("approveExamTemplate", () => {
    it("approves template", async () => {
      mockDeveloperSession()
      vi.mocked(db.examTemplate.findUnique).mockResolvedValue({
        id: "tpl-1",
      } as any)
      vi.mocked(db.examTemplate.updateMany).mockResolvedValue({
        count: 1,
      } as any)

      const result = await approveExamTemplate("tpl-1")

      expect(result).toEqual({ success: true })
      expect(db.examTemplate.updateMany).toHaveBeenCalledWith({
        where: { id: "tpl-1", approvalStatus: "PENDING" },
        data: expect.objectContaining({
          approvalStatus: "APPROVED",
          status: "PUBLISHED",
        }),
      })
    })

    it("returns error when already processed (race lost)", async () => {
      mockDeveloperSession()
      vi.mocked(db.examTemplate.findUnique).mockResolvedValue({
        id: "tpl-1",
      } as any)
      vi.mocked(db.examTemplate.updateMany).mockResolvedValue({
        count: 0,
      } as any)

      const result = await approveExamTemplate("tpl-1")

      expect(result).toEqual({
        success: false,
        error: "template_already_processed",
      })
    })

    it("returns error for non-existent template", async () => {
      mockDeveloperSession()
      vi.mocked(db.examTemplate.findUnique).mockResolvedValue(null)

      const result = await approveExamTemplate("nonexistent")

      expect(result).toEqual({
        success: false,
        error: "template_not_found",
      })
    })

    it("requires DEVELOPER role", async () => {
      mockNonDeveloperSession("ADMIN")

      const result = await approveExamTemplate("tpl-1")

      expect(result).toEqual({
        success: false,
        error: "Unauthorized: DEVELOPER role required",
      })
    })
  })

  // ==========================================================================
  // rejectExamTemplate
  // ==========================================================================

  describe("rejectExamTemplate", () => {
    it("rejects template with reason", async () => {
      mockDeveloperSession()
      vi.mocked(db.examTemplate.findUnique).mockResolvedValue({
        id: "tpl-1",
      } as any)
      vi.mocked(db.examTemplate.updateMany).mockResolvedValue({
        count: 1,
      } as any)

      const result = await rejectExamTemplate("tpl-1", "Incomplete")

      expect(result).toEqual({ success: true })
      expect(db.examTemplate.updateMany).toHaveBeenCalledWith({
        where: { id: "tpl-1", approvalStatus: "PENDING" },
        data: expect.objectContaining({
          approvalStatus: "REJECTED",
          rejectionReason: "Incomplete",
        }),
      })
    })

    it("returns error for empty reason", async () => {
      mockDeveloperSession()

      const result = await rejectExamTemplate("tpl-1", "")

      expect(result).toEqual({
        success: false,
        error: "rejection_reason_required",
      })
    })

    it("returns error for non-existent template", async () => {
      mockDeveloperSession()
      vi.mocked(db.examTemplate.findUnique).mockResolvedValue(null)

      const result = await rejectExamTemplate("nonexistent", "Bad content")

      expect(result).toEqual({
        success: false,
        error: "template_not_found",
      })
    })

    it("requires DEVELOPER role", async () => {
      mockNonDeveloperSession("TEACHER")

      const result = await rejectExamTemplate("tpl-1", "Reason")

      expect(result).toEqual({
        success: false,
        error: "Unauthorized: DEVELOPER role required",
      })
    })
  })
})
