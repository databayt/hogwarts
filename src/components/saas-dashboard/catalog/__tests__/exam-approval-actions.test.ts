// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { revalidatePath } from "next/cache"
import { auth } from "@/auth"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"

import {
  approveCatalogExam,
  approveCatalogExamTemplate,
  getPendingCatalogExams,
  getPendingCatalogExamTemplates,
  rejectCatalogExam,
  rejectCatalogExamTemplate,
} from "../exam-approval-actions"

// ============================================================================
// Mocks
// ============================================================================

vi.mock("@/auth", () => ({
  auth: vi.fn(),
}))

vi.mock("@/lib/db", () => ({
  db: {
    catalogExam: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      count: vi.fn(),
      update: vi.fn(),
    },
    catalogExamTemplate: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      count: vi.fn(),
      update: vi.fn(),
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
  // getPendingCatalogExams
  // ==========================================================================

  describe("getPendingCatalogExams", () => {
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

      vi.mocked(db.catalogExam.findMany).mockResolvedValue(mockExams as any)
      vi.mocked(db.catalogExam.count).mockResolvedValue(1)
      vi.mocked(db.school.findMany).mockResolvedValue([
        { id: "school-1", name: "Demo School" },
      ] as any)

      const result = await getPendingCatalogExams(1)

      expect(result.items).toHaveLength(1)
      expect(result.items[0].title).toBe("Math Final")
      expect(result.items[0].questionCount).toBe(2)
      expect(result.items[0].contributedSchoolName).toBe("Demo School")
      expect(result.total).toBe(1)
      expect(result.pageSize).toBe(20)
    })

    it("requires DEVELOPER role (returns empty on auth failure)", async () => {
      mockNonDeveloperSession("ADMIN")

      const result = await getPendingCatalogExams()

      expect(result.items).toEqual([])
      expect(result.total).toBe(0)
      expect(db.catalogExam.findMany).not.toHaveBeenCalled()
    })
  })

  // ==========================================================================
  // approveCatalogExam
  // ==========================================================================

  describe("approveCatalogExam", () => {
    it("approves exam with PUBLISHED status", async () => {
      mockDeveloperSession()
      vi.mocked(db.catalogExam.findUnique).mockResolvedValue({
        id: "exam-1",
      } as any)
      vi.mocked(db.catalogExam.update).mockResolvedValue({} as any)

      const result = await approveCatalogExam("exam-1")

      expect(result).toEqual({ success: true })
      expect(db.catalogExam.update).toHaveBeenCalledWith({
        where: { id: "exam-1" },
        data: expect.objectContaining({
          approvalStatus: "APPROVED",
          approvedBy: "dev-1",
          status: "PUBLISHED",
          rejectionReason: null,
        }),
      })
      expect(revalidatePath).toHaveBeenCalledWith("/catalog/approvals")
    })

    it("returns error for non-existent exam", async () => {
      mockDeveloperSession()
      vi.mocked(db.catalogExam.findUnique).mockResolvedValue(null)

      const result = await approveCatalogExam("nonexistent")

      expect(result).toEqual({ success: false, error: "Exam not found" })
      expect(db.catalogExam.update).not.toHaveBeenCalled()
    })

    it("requires DEVELOPER role", async () => {
      mockNonDeveloperSession("ADMIN")

      const result = await approveCatalogExam("exam-1")

      expect(result).toEqual({
        success: false,
        error: "Unauthorized: DEVELOPER role required",
      })
    })
  })

  // ==========================================================================
  // rejectCatalogExam
  // ==========================================================================

  describe("rejectCatalogExam", () => {
    it("rejects exam with reason", async () => {
      mockDeveloperSession()
      vi.mocked(db.catalogExam.findUnique).mockResolvedValue({
        id: "exam-1",
      } as any)
      vi.mocked(db.catalogExam.update).mockResolvedValue({} as any)

      const result = await rejectCatalogExam("exam-1", "Low quality")

      expect(result).toEqual({ success: true })
      expect(db.catalogExam.update).toHaveBeenCalledWith({
        where: { id: "exam-1" },
        data: expect.objectContaining({
          approvalStatus: "REJECTED",
          rejectionReason: "Low quality",
        }),
      })
    })

    it("returns error for empty reason", async () => {
      mockDeveloperSession()

      const result = await rejectCatalogExam("exam-1", "")

      expect(result).toEqual({
        success: false,
        error: "Rejection reason is required",
      })
      expect(db.catalogExam.findUnique).not.toHaveBeenCalled()
    })

    it("returns error for non-existent exam", async () => {
      mockDeveloperSession()
      vi.mocked(db.catalogExam.findUnique).mockResolvedValue(null)

      const result = await rejectCatalogExam("nonexistent", "Bad content")

      expect(result).toEqual({ success: false, error: "Exam not found" })
    })

    it("requires DEVELOPER role", async () => {
      mockNonDeveloperSession("TEACHER")

      const result = await rejectCatalogExam("exam-1", "Reason")

      expect(result).toEqual({
        success: false,
        error: "Unauthorized: DEVELOPER role required",
      })
    })
  })

  // ==========================================================================
  // getPendingCatalogExamTemplates
  // ==========================================================================

  describe("getPendingCatalogExamTemplates", () => {
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

      vi.mocked(db.catalogExamTemplate.findMany).mockResolvedValue(
        mockTemplates as any
      )
      vi.mocked(db.catalogExamTemplate.count).mockResolvedValue(1)
      vi.mocked(db.school.findMany).mockResolvedValue([
        { id: "school-1", name: "Demo School" },
      ] as any)

      const result = await getPendingCatalogExamTemplates(1)

      expect(result.items).toHaveLength(1)
      expect(result.items[0].name).toBe("Midterm Template")
      expect(result.items[0].subjectName).toBe("Science")
      expect(result.total).toBe(1)
    })

    it("requires DEVELOPER role (returns empty on auth failure)", async () => {
      mockNonDeveloperSession("ADMIN")

      const result = await getPendingCatalogExamTemplates()

      expect(result.items).toEqual([])
      expect(result.total).toBe(0)
    })
  })

  // ==========================================================================
  // approveCatalogExamTemplate
  // ==========================================================================

  describe("approveCatalogExamTemplate", () => {
    it("approves template", async () => {
      mockDeveloperSession()
      vi.mocked(db.catalogExamTemplate.findUnique).mockResolvedValue({
        id: "tpl-1",
      } as any)
      vi.mocked(db.catalogExamTemplate.update).mockResolvedValue({} as any)

      const result = await approveCatalogExamTemplate("tpl-1")

      expect(result).toEqual({ success: true })
      expect(db.catalogExamTemplate.update).toHaveBeenCalledWith({
        where: { id: "tpl-1" },
        data: expect.objectContaining({
          approvalStatus: "APPROVED",
          status: "PUBLISHED",
        }),
      })
    })

    it("returns error for non-existent template", async () => {
      mockDeveloperSession()
      vi.mocked(db.catalogExamTemplate.findUnique).mockResolvedValue(null)

      const result = await approveCatalogExamTemplate("nonexistent")

      expect(result).toEqual({
        success: false,
        error: "Template not found",
      })
    })

    it("requires DEVELOPER role", async () => {
      mockNonDeveloperSession("ADMIN")

      const result = await approveCatalogExamTemplate("tpl-1")

      expect(result).toEqual({
        success: false,
        error: "Unauthorized: DEVELOPER role required",
      })
    })
  })

  // ==========================================================================
  // rejectCatalogExamTemplate
  // ==========================================================================

  describe("rejectCatalogExamTemplate", () => {
    it("rejects template with reason", async () => {
      mockDeveloperSession()
      vi.mocked(db.catalogExamTemplate.findUnique).mockResolvedValue({
        id: "tpl-1",
      } as any)
      vi.mocked(db.catalogExamTemplate.update).mockResolvedValue({} as any)

      const result = await rejectCatalogExamTemplate("tpl-1", "Incomplete")

      expect(result).toEqual({ success: true })
      expect(db.catalogExamTemplate.update).toHaveBeenCalledWith({
        where: { id: "tpl-1" },
        data: expect.objectContaining({
          approvalStatus: "REJECTED",
          rejectionReason: "Incomplete",
        }),
      })
    })

    it("returns error for empty reason", async () => {
      mockDeveloperSession()

      const result = await rejectCatalogExamTemplate("tpl-1", "")

      expect(result).toEqual({
        success: false,
        error: "Rejection reason is required",
      })
    })

    it("returns error for non-existent template", async () => {
      mockDeveloperSession()
      vi.mocked(db.catalogExamTemplate.findUnique).mockResolvedValue(null)

      const result = await rejectCatalogExamTemplate(
        "nonexistent",
        "Bad content"
      )

      expect(result).toEqual({
        success: false,
        error: "Template not found",
      })
    })

    it("requires DEVELOPER role", async () => {
      mockNonDeveloperSession("TEACHER")

      const result = await rejectCatalogExamTemplate("tpl-1", "Reason")

      expect(result).toEqual({
        success: false,
        error: "Unauthorized: DEVELOPER role required",
      })
    })
  })
})
