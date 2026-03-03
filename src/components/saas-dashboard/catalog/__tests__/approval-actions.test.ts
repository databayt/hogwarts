// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { revalidatePath } from "next/cache"
// Import after mocks so the mock wiring is in place
import { auth } from "@/auth"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"

import { approveContent, rejectContent } from "../approval-actions"

// ============================================================================
// Mocks
// ============================================================================

vi.mock("@/auth", () => ({
  auth: vi.fn(),
}))

vi.mock("@/lib/db", () => ({
  db: {
    catalogQuestion: {
      update: vi.fn(),
    },
    catalogMaterial: {
      update: vi.fn(),
    },
    catalogAssignment: {
      update: vi.fn(),
    },
    catalogBook: {
      update: vi.fn(),
    },
    lessonVideo: {
      update: vi.fn(),
    },
    schoolBookSelection: {
      findFirst: vi.fn(),
      create: vi.fn(),
      count: vi.fn(),
    },
    book: {
      create: vi.fn(),
    },
    $transaction: vi.fn(),
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

function mockUnauthenticated() {
  vi.mocked(auth).mockResolvedValue(null)
}

// ============================================================================
// Tests
// ============================================================================

describe("Approval Actions", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ==========================================================================
  // approveContent
  // ==========================================================================

  describe("approveContent", () => {
    it("approves a CatalogQuestion", async () => {
      mockDeveloperSession()
      vi.mocked(db.catalogQuestion.update).mockResolvedValue({} as any)

      const result = await approveContent("CatalogQuestion", "q-1")

      expect(result).toEqual({ success: true })
      expect(db.catalogQuestion.update).toHaveBeenCalledWith({
        where: { id: "q-1" },
        data: expect.objectContaining({
          approvalStatus: "APPROVED",
          approvedBy: "dev-1",
          rejectionReason: null,
        }),
      })
      expect(revalidatePath).toHaveBeenCalledWith("/catalog/approvals")
    })

    it("approves a CatalogMaterial", async () => {
      mockDeveloperSession()
      vi.mocked(db.catalogMaterial.update).mockResolvedValue({} as any)

      const result = await approveContent("CatalogMaterial", "m-1")

      expect(result).toEqual({ success: true })
      expect(db.catalogMaterial.update).toHaveBeenCalledWith({
        where: { id: "m-1" },
        data: expect.objectContaining({
          approvalStatus: "APPROVED",
          approvedBy: "dev-1",
          rejectionReason: null,
        }),
      })
    })

    it("approves a CatalogAssignment", async () => {
      mockDeveloperSession()
      vi.mocked(db.catalogAssignment.update).mockResolvedValue({} as any)

      const result = await approveContent("CatalogAssignment", "a-1")

      expect(result).toEqual({ success: true })
      expect(db.catalogAssignment.update).toHaveBeenCalledWith({
        where: { id: "a-1" },
        data: expect.objectContaining({
          approvalStatus: "APPROVED",
          approvedBy: "dev-1",
          rejectionReason: null,
        }),
      })
    })

    it("approves a CatalogBook with transaction (auto-select into library)", async () => {
      mockDeveloperSession()

      const mockCatalogBook = {
        id: "b-1",
        title: "Test Book",
        author: "Author",
        genre: "Fiction",
        description: "A test book",
        summary: "Summary",
        coverUrl: "https://example.com/cover.jpg",
        coverColor: "#FF0000",
        rating: 4.5,
        videoUrl: "https://example.com/video",
        isbn: "978-3-16-148410-0",
        publisher: "Test Publisher",
        publicationYear: 2025,
        language: "en",
        pageCount: 200,
        gradeLevel: "ELEMENTARY",
        contributedSchoolId: "school-1",
      }

      vi.mocked(db.$transaction).mockImplementation(async (callback: any) => {
        const tx = {
          catalogBook: {
            update: vi
              .fn()
              .mockResolvedValueOnce(mockCatalogBook) // first update (approve)
              .mockResolvedValueOnce({} as any), // second update (usageCount)
          },
          schoolBookSelection: {
            findFirst: vi.fn().mockResolvedValue(null), // no existing selection
            create: vi.fn().mockResolvedValue({} as any),
            count: vi.fn().mockResolvedValue(1),
          },
          book: {
            create: vi.fn().mockResolvedValue({} as any),
          },
        }
        return callback(tx)
      })

      const result = await approveContent("CatalogBook", "b-1")

      expect(result).toEqual({ success: true })
      expect(db.$transaction).toHaveBeenCalledTimes(1)
      expect(revalidatePath).toHaveBeenCalledWith("/catalog/approvals")
    })

    it("approves a CatalogBook without auto-select when no contributedSchoolId", async () => {
      mockDeveloperSession()

      const mockCatalogBook = {
        id: "b-2",
        title: "Orphan Book",
        author: "Author",
        genre: "Non-Fiction",
        description: null,
        summary: null,
        coverUrl: null,
        coverColor: null,
        rating: 3,
        videoUrl: null,
        isbn: null,
        publisher: null,
        publicationYear: null,
        language: null,
        pageCount: null,
        gradeLevel: null,
        contributedSchoolId: null, // no school
      }

      let selectionCreateCalled = false
      vi.mocked(db.$transaction).mockImplementation(async (callback: any) => {
        const tx = {
          catalogBook: {
            update: vi.fn().mockResolvedValue(mockCatalogBook),
          },
          schoolBookSelection: {
            findFirst: vi.fn(),
            create: vi.fn().mockImplementation(async () => {
              selectionCreateCalled = true
            }),
            count: vi.fn(),
          },
          book: {
            create: vi.fn(),
          },
        }
        return callback(tx)
      })

      const result = await approveContent("CatalogBook", "b-2")

      expect(result).toEqual({ success: true })
      expect(selectionCreateCalled).toBe(false)
    })

    it("approves a CatalogBook without creating duplicate selection", async () => {
      mockDeveloperSession()

      const mockCatalogBook = {
        id: "b-3",
        title: "Already Selected Book",
        author: "Author",
        genre: "Science",
        description: "",
        summary: "",
        coverUrl: "",
        coverColor: null,
        rating: 4,
        videoUrl: null,
        isbn: null,
        publisher: null,
        publicationYear: null,
        language: null,
        pageCount: null,
        gradeLevel: null,
        contributedSchoolId: "school-1",
      }

      let selectionCreateCalled = false
      let bookCreateCalled = false
      vi.mocked(db.$transaction).mockImplementation(async (callback: any) => {
        const tx = {
          catalogBook: {
            update: vi.fn().mockResolvedValue(mockCatalogBook),
          },
          schoolBookSelection: {
            findFirst: vi.fn().mockResolvedValue({ id: "existing-sel" }), // already exists
            create: vi.fn().mockImplementation(async () => {
              selectionCreateCalled = true
            }),
            count: vi.fn(),
          },
          book: {
            create: vi.fn().mockImplementation(async () => {
              bookCreateCalled = true
            }),
          },
        }
        return callback(tx)
      })

      const result = await approveContent("CatalogBook", "b-3")

      expect(result).toEqual({ success: true })
      expect(selectionCreateCalled).toBe(false)
      expect(bookCreateCalled).toBe(false)
    })

    it("requires DEVELOPER role", async () => {
      mockNonDeveloperSession("ADMIN")

      const result = await approveContent("CatalogQuestion", "q-1")

      expect(result).toEqual({
        success: false,
        error: "Unauthorized: DEVELOPER role required",
      })
      expect(db.catalogQuestion.update).not.toHaveBeenCalled()
    })

    it("returns error when unauthenticated", async () => {
      mockUnauthenticated()

      const result = await approveContent("CatalogQuestion", "q-1")

      expect(result).toEqual({
        success: false,
        error: "Unauthorized: DEVELOPER role required",
      })
    })

    it("returns error for unknown content type", async () => {
      mockDeveloperSession()

      const result = await approveContent("UnknownType" as any, "x-1")

      expect(result).toEqual({
        success: false,
        error: "Unknown content type: UnknownType",
      })
    })

    it("returns error when database update fails", async () => {
      mockDeveloperSession()
      vi.mocked(db.catalogQuestion.update).mockRejectedValue(
        new Error("Record not found")
      )

      const result = await approveContent("CatalogQuestion", "nonexistent")

      expect(result).toEqual({
        success: false,
        error: "Record not found",
      })
    })
  })

  // ==========================================================================
  // rejectContent
  // ==========================================================================

  describe("rejectContent", () => {
    it("rejects a CatalogQuestion with reason", async () => {
      mockDeveloperSession()
      vi.mocked(db.catalogQuestion.update).mockResolvedValue({} as any)

      const result = await rejectContent(
        "CatalogQuestion",
        "q-1",
        "Low quality content"
      )

      expect(result).toEqual({ success: true })
      expect(db.catalogQuestion.update).toHaveBeenCalledWith({
        where: { id: "q-1" },
        data: expect.objectContaining({
          approvalStatus: "REJECTED",
          approvedBy: "dev-1",
          rejectionReason: "Low quality content",
        }),
      })
      expect(revalidatePath).toHaveBeenCalledWith("/catalog/approvals")
    })

    it("rejects a CatalogMaterial with reason", async () => {
      mockDeveloperSession()
      vi.mocked(db.catalogMaterial.update).mockResolvedValue({} as any)

      const result = await rejectContent(
        "CatalogMaterial",
        "m-1",
        "Incorrect information"
      )

      expect(result).toEqual({ success: true })
      expect(db.catalogMaterial.update).toHaveBeenCalledWith({
        where: { id: "m-1" },
        data: expect.objectContaining({
          approvalStatus: "REJECTED",
          rejectionReason: "Incorrect information",
        }),
      })
    })

    it("rejects a CatalogAssignment with reason", async () => {
      mockDeveloperSession()
      vi.mocked(db.catalogAssignment.update).mockResolvedValue({} as any)

      const result = await rejectContent(
        "CatalogAssignment",
        "a-1",
        "Does not meet standards"
      )

      expect(result).toEqual({ success: true })
      expect(db.catalogAssignment.update).toHaveBeenCalledWith({
        where: { id: "a-1" },
        data: expect.objectContaining({
          approvalStatus: "REJECTED",
          rejectionReason: "Does not meet standards",
        }),
      })
    })

    it("rejects a CatalogBook with reason", async () => {
      mockDeveloperSession()
      vi.mocked(db.catalogBook.update).mockResolvedValue({} as any)

      const result = await rejectContent(
        "CatalogBook",
        "b-1",
        "Copyright issues"
      )

      expect(result).toEqual({ success: true })
      expect(db.catalogBook.update).toHaveBeenCalledWith({
        where: { id: "b-1" },
        data: expect.objectContaining({
          approvalStatus: "REJECTED",
          rejectionReason: "Copyright issues",
        }),
      })
    })

    it("returns error for empty rejection reason", async () => {
      mockDeveloperSession()

      const result = await rejectContent("CatalogQuestion", "q-1", "")

      expect(result).toEqual({
        success: false,
        error: "Rejection reason is required",
      })
      expect(db.catalogQuestion.update).not.toHaveBeenCalled()
    })

    it("returns error for whitespace-only rejection reason", async () => {
      mockDeveloperSession()

      const result = await rejectContent("CatalogQuestion", "q-1", "   ")

      expect(result).toEqual({
        success: false,
        error: "Rejection reason is required",
      })
      expect(db.catalogQuestion.update).not.toHaveBeenCalled()
    })

    it("requires DEVELOPER role", async () => {
      mockNonDeveloperSession("TEACHER")

      const result = await rejectContent(
        "CatalogQuestion",
        "q-1",
        "Some reason"
      )

      expect(result).toEqual({
        success: false,
        error: "Unauthorized: DEVELOPER role required",
      })
      expect(db.catalogQuestion.update).not.toHaveBeenCalled()
    })

    it("returns error when unauthenticated", async () => {
      mockUnauthenticated()

      const result = await rejectContent(
        "CatalogMaterial",
        "m-1",
        "Bad content"
      )

      expect(result).toEqual({
        success: false,
        error: "Unauthorized: DEVELOPER role required",
      })
    })

    it("returns error for unknown content type", async () => {
      mockDeveloperSession()

      const result = await rejectContent(
        "UnknownType" as any,
        "x-1",
        "Some reason"
      )

      expect(result).toEqual({
        success: false,
        error: "Unknown content type: UnknownType",
      })
    })

    it("returns error when database update fails", async () => {
      mockDeveloperSession()
      vi.mocked(db.catalogMaterial.update).mockRejectedValue(
        new Error("Database connection lost")
      )

      const result = await rejectContent(
        "CatalogMaterial",
        "m-1",
        "Bad content"
      )

      expect(result).toEqual({
        success: false,
        error: "Database connection lost",
      })
    })
  })
})
