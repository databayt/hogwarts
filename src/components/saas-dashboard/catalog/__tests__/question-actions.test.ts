// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { revalidatePath } from "next/cache"
import { auth } from "@/auth"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"

import {
  createCatalogQuestion,
  deleteCatalogQuestion,
  updateCatalogQuestion,
} from "../question-actions"

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock("@/auth", () => ({
  auth: vi.fn(),
}))

vi.mock("@/lib/db", () => ({
  db: {
    catalogQuestion: {
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      findUnique: vi.fn(),
    },
  },
}))

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}))

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Build a FormData instance with sensible defaults for a valid question. */
function buildQuestionFormData(
  overrides: Record<string, string | string[]> = {}
): FormData {
  const defaults: Record<string, string> = {
    questionText: "What is 2 + 2?",
    questionType: "MULTIPLE_CHOICE",
    difficulty: "EASY",
    bloomLevel: "REMEMBER",
    points: "2",
    options: JSON.stringify([
      { label: "A", text: "3" },
      { label: "B", text: "4" },
    ]),
    sampleAnswer: "B",
    explanation: "Basic addition",
  }

  const merged = { ...defaults, ...overrides }
  const fd = new FormData()

  for (const [key, value] of Object.entries(merged)) {
    if (key === "tags" && Array.isArray(value)) {
      for (const tag of value) {
        fd.append("tags", tag)
      }
    } else if (typeof value === "string") {
      fd.append(key, value)
    }
  }

  return fd
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("CatalogQuestion CRUD Actions", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Default: authenticated DEVELOPER
    vi.mocked(auth).mockResolvedValue({
      user: { id: "dev-1", role: "DEVELOPER" },
    } as any)
  })

  // ========================================================================
  // createCatalogQuestion
  // ========================================================================

  describe("createCatalogQuestion", () => {
    it("creates a question with valid FormData and returns success", async () => {
      const mockQuestion = { id: "q-1" }
      vi.mocked(db.catalogQuestion.create).mockResolvedValue(
        mockQuestion as any
      )

      const fd = buildQuestionFormData({ tags: ["math", "addition"] })
      const result = await createCatalogQuestion(fd)

      expect(result).toEqual({ success: true, data: { id: "q-1" } })
      expect(db.catalogQuestion.create).toHaveBeenCalledTimes(1)
      expect(db.catalogQuestion.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          questionText: "What is 2 + 2?",
          questionType: "MULTIPLE_CHOICE",
          difficulty: "EASY",
          bloomLevel: "REMEMBER",
          points: 2,
          tags: ["math", "addition"],
          approvalStatus: "APPROVED",
          visibility: "PUBLIC",
          status: "PUBLISHED",
        }),
      })
      expect(revalidatePath).toHaveBeenCalledWith("/catalog/questions")
    })

    it("strips client approvalStatus and always sets APPROVED", async () => {
      vi.mocked(db.catalogQuestion.create).mockResolvedValue({
        id: "q-2",
      } as any)

      // Client tries to sneak in PENDING approvalStatus
      const fd = buildQuestionFormData({ approvalStatus: "PENDING" })
      const result = await createCatalogQuestion(fd)

      expect(result.success).toBe(true)
      expect(db.catalogQuestion.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          approvalStatus: "APPROVED",
          visibility: "PUBLIC",
          status: "PUBLISHED",
        }),
      })
    })

    it("returns error for malformed options JSON", async () => {
      const fd = buildQuestionFormData({ options: "{invalid json" })
      const result = await createCatalogQuestion(fd)

      expect(result).toEqual({
        success: false,
        error: "Invalid options JSON",
      })
      expect(db.catalogQuestion.create).not.toHaveBeenCalled()
    })

    it("requires DEVELOPER role (returns error for non-developer)", async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: "teacher-1", role: "TEACHER" },
      } as any)

      const fd = buildQuestionFormData()
      const result = await createCatalogQuestion(fd)

      expect(result).toEqual({
        success: false,
        error: "Unauthorized: DEVELOPER role required",
      })
      expect(db.catalogQuestion.create).not.toHaveBeenCalled()
    })

    it("returns error for invalid questionType (Zod validation)", async () => {
      const fd = buildQuestionFormData({ questionType: "INVALID_TYPE" })
      const result = await createCatalogQuestion(fd)

      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
      expect(db.catalogQuestion.create).not.toHaveBeenCalled()
    })

    it("returns error when auth session is null", async () => {
      vi.mocked(auth).mockResolvedValue(null as any)

      const fd = buildQuestionFormData()
      const result = await createCatalogQuestion(fd)

      expect(result.success).toBe(false)
      expect(result.error).toBe("Unauthorized: DEVELOPER role required")
    })

    it("defaults points to 1 when not provided", async () => {
      vi.mocked(db.catalogQuestion.create).mockResolvedValue({
        id: "q-3",
      } as any)

      const fd = buildQuestionFormData()
      fd.delete("points")

      const result = await createCatalogQuestion(fd)

      expect(result.success).toBe(true)
      expect(db.catalogQuestion.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          points: 1,
        }),
      })
    })

    it("handles missing options field gracefully", async () => {
      vi.mocked(db.catalogQuestion.create).mockResolvedValue({
        id: "q-4",
      } as any)

      const fd = buildQuestionFormData()
      fd.delete("options")

      const result = await createCatalogQuestion(fd)

      expect(result.success).toBe(true)
    })
  })

  // ========================================================================
  // updateCatalogQuestion
  // ========================================================================

  describe("updateCatalogQuestion", () => {
    it("updates a question by id", async () => {
      vi.mocked(db.catalogQuestion.findUnique).mockResolvedValue({
        id: "q-1",
        questionText: "Old text",
      } as any)
      vi.mocked(db.catalogQuestion.update).mockResolvedValue({
        id: "q-1",
      } as any)

      const fd = buildQuestionFormData({
        questionText: "Updated question text",
      })
      const result = await updateCatalogQuestion("q-1", fd)

      expect(result).toEqual({ success: true, data: { id: "q-1" } })
      expect(db.catalogQuestion.findUnique).toHaveBeenCalledWith({
        where: { id: "q-1" },
      })
      expect(db.catalogQuestion.update).toHaveBeenCalledWith({
        where: { id: "q-1" },
        data: expect.objectContaining({
          questionText: "Updated question text",
          // approvalStatus should be undefined (stripped on update)
          approvalStatus: undefined,
        }),
      })
      expect(revalidatePath).toHaveBeenCalledWith("/catalog/questions")
    })

    it("returns error for non-existent id", async () => {
      vi.mocked(db.catalogQuestion.findUnique).mockResolvedValue(null)

      const fd = buildQuestionFormData()
      const result = await updateCatalogQuestion("non-existent-id", fd)

      expect(result).toEqual({
        success: false,
        error: "Question not found",
      })
      expect(db.catalogQuestion.update).not.toHaveBeenCalled()
    })

    it("requires DEVELOPER role", async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: "admin-1", role: "ADMIN" },
      } as any)

      const fd = buildQuestionFormData()
      const result = await updateCatalogQuestion("q-1", fd)

      expect(result.success).toBe(false)
      expect(result.error).toBe("Unauthorized: DEVELOPER role required")
      expect(db.catalogQuestion.findUnique).not.toHaveBeenCalled()
    })

    it("returns error for malformed options JSON", async () => {
      vi.mocked(db.catalogQuestion.findUnique).mockResolvedValue({
        id: "q-1",
      } as any)

      const fd = buildQuestionFormData({ options: "not-json{" })
      const result = await updateCatalogQuestion("q-1", fd)

      expect(result).toEqual({
        success: false,
        error: "Invalid options JSON",
      })
      expect(db.catalogQuestion.update).not.toHaveBeenCalled()
    })
  })

  // ========================================================================
  // deleteCatalogQuestion
  // ========================================================================

  describe("deleteCatalogQuestion", () => {
    it("deletes a question by id", async () => {
      vi.mocked(db.catalogQuestion.findUnique).mockResolvedValue({
        id: "q-1",
      } as any)
      vi.mocked(db.catalogQuestion.delete).mockResolvedValue({
        id: "q-1",
      } as any)

      const result = await deleteCatalogQuestion("q-1")

      expect(result).toEqual({ success: true })
      expect(db.catalogQuestion.findUnique).toHaveBeenCalledWith({
        where: { id: "q-1" },
      })
      expect(db.catalogQuestion.delete).toHaveBeenCalledWith({
        where: { id: "q-1" },
      })
      expect(revalidatePath).toHaveBeenCalledWith("/catalog/questions")
    })

    it("returns error for non-existent id", async () => {
      vi.mocked(db.catalogQuestion.findUnique).mockResolvedValue(null)

      const result = await deleteCatalogQuestion("non-existent-id")

      expect(result).toEqual({
        success: false,
        error: "Question not found",
      })
      expect(db.catalogQuestion.delete).not.toHaveBeenCalled()
    })

    it("requires DEVELOPER role", async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: "student-1", role: "STUDENT" },
      } as any)

      const result = await deleteCatalogQuestion("q-1")

      expect(result.success).toBe(false)
      expect(result.error).toBe("Unauthorized: DEVELOPER role required")
      expect(db.catalogQuestion.findUnique).not.toHaveBeenCalled()
    })

    it("returns error message when db.delete throws", async () => {
      vi.mocked(db.catalogQuestion.findUnique).mockResolvedValue({
        id: "q-1",
      } as any)
      vi.mocked(db.catalogQuestion.delete).mockRejectedValue(
        new Error("Foreign key constraint")
      )

      const result = await deleteCatalogQuestion("q-1")

      expect(result).toEqual({
        success: false,
        error: "Foreign key constraint",
      })
    })
  })
})
