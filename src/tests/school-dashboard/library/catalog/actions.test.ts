// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { revalidatePath } from "next/cache"
import { auth } from "@/auth"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"
import {
  deselectBook,
  selectBook,
  toggleBookSelection,
  updateBookSelection,
} from "@/components/library/catalog/actions"

// ============================================================================
// Mocks
// ============================================================================

vi.mock("@/auth", () => ({
  auth: vi.fn(),
}))

vi.mock("@/lib/db", () => ({
  db: {
    schoolBookSelection: {
      findFirst: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
    catalogBook: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    book: {
      create: vi.fn(),
      updateMany: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}))

vi.mock("@/lib/tenant-context", () => ({
  getTenantContext: vi.fn(),
}))

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}))

// ============================================================================
// Helpers
// ============================================================================

function mockAdminSession() {
  vi.mocked(auth).mockResolvedValue({
    user: { id: "admin-1", role: "ADMIN" },
  } as any)
  vi.mocked(getTenantContext).mockResolvedValue({
    schoolId: "school-1",
    subdomain: "demo",
  } as any)
}

function mockDeveloperSession() {
  vi.mocked(auth).mockResolvedValue({
    user: { id: "dev-1", role: "DEVELOPER" },
  } as any)
  vi.mocked(getTenantContext).mockResolvedValue({
    schoolId: "school-1",
    subdomain: "demo",
  } as any)
}

function mockUnauthorizedSession(role = "STUDENT") {
  vi.mocked(auth).mockResolvedValue({
    user: { id: "user-1", role },
  } as any)
  vi.mocked(getTenantContext).mockResolvedValue({
    schoolId: "school-1",
    subdomain: "demo",
  } as any)
}

function mockNoSchoolContext() {
  vi.mocked(auth).mockResolvedValue({
    user: { id: "admin-1", role: "ADMIN" },
  } as any)
  vi.mocked(getTenantContext).mockResolvedValue({
    schoolId: null,
    subdomain: null,
  } as any)
}

const mockBook = {
  title: "Test Book",
  author: "Author",
  genre: "Fiction",
  description: "A test book",
  summary: "Summary",
  coverUrl: "https://example.com/cover.jpg",
  coverColor: "#FF0000",
  rating: 4.5,
  videoUrl: null,
  isbn: "978-0-123456-78-9",
  publisher: "Publisher",
  publicationYear: 2025,
  language: "en",
  pageCount: 200,
  gradeLevel: "ELEMENTARY",
}

// ============================================================================
// Tests
// ============================================================================

describe("Library Catalog Actions", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ==========================================================================
  // selectBook
  // ==========================================================================

  describe("selectBook", () => {
    it("creates selection + Book in transaction", async () => {
      mockAdminSession()
      vi.mocked(db.bookSelection.findFirst).mockResolvedValue(null)
      vi.mocked(db.schoolBook.findUnique).mockResolvedValue(mockBook as any)

      let txSelectionCreate: ReturnType<typeof vi.fn>
      let txBookCreate: ReturnType<typeof vi.fn>
      vi.mocked(db.$transaction).mockImplementation(async (callback: any) => {
        txSelectionCreate = vi.fn().mockResolvedValue({})
        txBookCreate = vi.fn().mockResolvedValue({})
        const tx = {
          schoolBookSelection: {
            create: txSelectionCreate,
            count: vi.fn().mockResolvedValue(1),
          },
          book: { create: txBookCreate },
          catalogBook: { update: vi.fn().mockResolvedValue({}) },
        }
        return callback(tx)
      })

      const result = await selectBook("cat-book-1", 5, "Shelf A")

      expect(result).toEqual({ success: true })
      expect(db.$transaction).toHaveBeenCalledTimes(1)
      expect(txSelectionCreate!).toHaveBeenCalledWith({
        data: {
          schoolId: "school-1",
          catalogBookId: "cat-book-1",
          totalCopies: 5,
          availableCopies: 5,
          shelfLocation: "Shelf A",
          isActive: true,
        },
      })
      expect(txBookCreate!).toHaveBeenCalledWith({
        data: expect.objectContaining({
          schoolId: "school-1",
          catalogBookId: "cat-book-1",
          title: "Test Book",
          author: "Author",
          genre: "Fiction",
          totalCopies: 5,
          availableCopies: 5,
          rating: 5, // Math.round(4.5) = 5
        }),
      })
      expect(revalidatePath).toHaveBeenCalledWith("/library/catalog")
      expect(revalidatePath).toHaveBeenCalledWith("/library/books")
      expect(revalidatePath).toHaveBeenCalledWith("/library/admin/books")
    })

    it("sets shelfLocation to null when not provided", async () => {
      mockAdminSession()
      vi.mocked(db.bookSelection.findFirst).mockResolvedValue(null)
      vi.mocked(db.schoolBook.findUnique).mockResolvedValue(mockBook as any)

      let txSelectionCreate: ReturnType<typeof vi.fn>
      vi.mocked(db.$transaction).mockImplementation(async (callback: any) => {
        txSelectionCreate = vi.fn().mockResolvedValue({})
        const tx = {
          schoolBookSelection: {
            create: txSelectionCreate,
            count: vi.fn().mockResolvedValue(1),
          },
          book: { create: vi.fn().mockResolvedValue({}) },
          catalogBook: { update: vi.fn().mockResolvedValue({}) },
        }
        return callback(tx)
      })

      await selectBook("cat-book-1", 3)

      expect(txSelectionCreate!).toHaveBeenCalledWith({
        data: expect.objectContaining({
          shelfLocation: null,
        }),
      })
    })

    it("returns error for already-selected book (prevents duplicates)", async () => {
      mockAdminSession()
      vi.mocked(db.bookSelection.findFirst).mockResolvedValue({
        id: "existing",
      } as any)

      const result = await selectBook("cat-book-1", 5)

      expect(result).toEqual({
        success: false,
        error: "Book already in library",
      })
      expect(db.$transaction).not.toHaveBeenCalled()
    })

    it("returns error for non-existent catalog book", async () => {
      mockAdminSession()
      vi.mocked(db.bookSelection.findFirst).mockResolvedValue(null)
      vi.mocked(db.schoolBook.findUnique).mockResolvedValue(null)

      const result = await selectBook("nonexistent", 5)

      expect(result).toEqual({
        success: false,
        error: "Catalog book not found",
      })
      expect(db.$transaction).not.toHaveBeenCalled()
    })

    it("requires ADMIN or DEVELOPER role", async () => {
      mockUnauthorizedSession("TEACHER")

      const result = await selectBook("cat-book-1", 5)

      expect(result).toEqual({
        success: false,
        error: "Unauthorized: ADMIN or DEVELOPER role required",
      })
      expect(db.bookSelection.findFirst).not.toHaveBeenCalled()
    })

    it("rejects STUDENT role", async () => {
      mockUnauthorizedSession("STUDENT")

      const result = await selectBook("cat-book-1", 5)

      expect(result).toEqual({
        success: false,
        error: "Unauthorized: ADMIN or DEVELOPER role required",
      })
    })

    it("rejects STAFF role", async () => {
      mockUnauthorizedSession("STAFF")

      const result = await selectBook("cat-book-1", 5)

      expect(result).toEqual({
        success: false,
        error: "Unauthorized: ADMIN or DEVELOPER role required",
      })
    })

    it("requires school context", async () => {
      mockNoSchoolContext()

      const result = await selectBook("cat-book-1", 5)

      expect(result).toEqual({
        success: false,
        error: "Missing school context",
      })
    })

    it("allows DEVELOPER role", async () => {
      mockDeveloperSession()
      vi.mocked(db.bookSelection.findFirst).mockResolvedValue(null)
      vi.mocked(db.schoolBook.findUnique).mockResolvedValue(mockBook as any)
      vi.mocked(db.$transaction).mockImplementation(async (callback: any) => {
        const tx = {
          schoolBookSelection: {
            create: vi.fn().mockResolvedValue({}),
            count: vi.fn().mockResolvedValue(1),
          },
          book: { create: vi.fn().mockResolvedValue({}) },
          catalogBook: { update: vi.fn().mockResolvedValue({}) },
        }
        return callback(tx)
      })

      const result = await selectBook("cat-book-1", 5)

      expect(result).toEqual({ success: true })
    })

    it("updates usageCount inside transaction", async () => {
      mockAdminSession()
      vi.mocked(db.bookSelection.findFirst).mockResolvedValue(null)
      vi.mocked(db.schoolBook.findUnique).mockResolvedValue(mockBook as any)

      let txBookUpdate: ReturnType<typeof vi.fn>
      let txSelectionCount: ReturnType<typeof vi.fn>
      vi.mocked(db.$transaction).mockImplementation(async (callback: any) => {
        txSelectionCount = vi.fn().mockResolvedValue(3)
        txBookUpdate = vi.fn().mockResolvedValue({})
        const tx = {
          schoolBookSelection: {
            create: vi.fn().mockResolvedValue({}),
            count: txSelectionCount,
          },
          book: { create: vi.fn().mockResolvedValue({}) },
          catalogBook: { update: txBookUpdate },
        }
        return callback(tx)
      })

      await selectBook("cat-book-1", 5)

      expect(txSelectionCount!).toHaveBeenCalledWith({
        where: { catalogBookId: "cat-book-1" },
      })
      expect(txBookUpdate!).toHaveBeenCalledWith({
        where: { id: "cat-book-1" },
        data: { usageCount: 3 },
      })
    })

    it("copies catalog book fields to Book correctly", async () => {
      mockAdminSession()
      vi.mocked(db.bookSelection.findFirst).mockResolvedValue(null)

      const catalogWithNulls = {
        ...mockBook,
        description: null,
        summary: null,
        coverUrl: null,
      }
      vi.mocked(db.schoolBook.findUnique).mockResolvedValue(
        catalogWithNulls as any
      )

      let txBookCreate: ReturnType<typeof vi.fn>
      vi.mocked(db.$transaction).mockImplementation(async (callback: any) => {
        txBookCreate = vi.fn().mockResolvedValue({})
        const tx = {
          schoolBookSelection: {
            create: vi.fn().mockResolvedValue({}),
            count: vi.fn().mockResolvedValue(1),
          },
          book: { create: txBookCreate },
          catalogBook: { update: vi.fn().mockResolvedValue({}) },
        }
        return callback(tx)
      })

      await selectBook("cat-book-1", 2)

      expect(txBookCreate!).toHaveBeenCalledWith({
        data: expect.objectContaining({
          description: "",
          summary: "",
          coverUrl: "",
        }),
      })
    })
  })

  // ==========================================================================
  // deselectBook
  // ==========================================================================

  describe("deselectBook", () => {
    it("removes selection and unlinks books (does not delete books)", async () => {
      mockAdminSession()
      vi.mocked(db.bookSelection.findFirst).mockResolvedValue({
        id: "sel-1",
      } as any)

      let txSelectionDelete: ReturnType<typeof vi.fn>
      let txBookUpdateMany: ReturnType<typeof vi.fn>
      let txBookUpdate: ReturnType<typeof vi.fn>
      let txSelectionCount: ReturnType<typeof vi.fn>
      vi.mocked(db.$transaction).mockImplementation(async (callback: any) => {
        txSelectionDelete = vi.fn().mockResolvedValue({})
        txBookUpdateMany = vi.fn().mockResolvedValue({ count: 1 })
        txBookUpdate = vi.fn().mockResolvedValue({})
        txSelectionCount = vi.fn().mockResolvedValue(0)
        const tx = {
          schoolBookSelection: {
            delete: txSelectionDelete,
            count: txSelectionCount,
          },
          book: { updateMany: txBookUpdateMany },
          catalogBook: { update: txBookUpdate },
        }
        return callback(tx)
      })

      const result = await deselectBook("cat-book-1")

      expect(result).toEqual({ success: true })
      expect(db.$transaction).toHaveBeenCalledTimes(1)

      // Deletes the selection
      expect(txSelectionDelete!).toHaveBeenCalledWith({
        where: { id: "sel-1" },
      })

      // Unlinks books by setting catalogBookId to null, NOT deleting them
      expect(txBookUpdateMany!).toHaveBeenCalledWith({
        where: { schoolId: "school-1", catalogBookId: "cat-book-1" },
        data: { catalogBookId: null },
      })

      // Updates usageCount
      expect(txSelectionCount!).toHaveBeenCalledWith({
        where: { catalogBookId: "cat-book-1" },
      })
      expect(txBookUpdate!).toHaveBeenCalledWith({
        where: { id: "cat-book-1" },
        data: { usageCount: 0 },
      })

      expect(revalidatePath).toHaveBeenCalledWith("/library/catalog")
      expect(revalidatePath).toHaveBeenCalledWith("/library/books")
      expect(revalidatePath).toHaveBeenCalledWith("/library/admin/books")
    })

    it("returns error if selection not found", async () => {
      mockAdminSession()
      vi.mocked(db.bookSelection.findFirst).mockResolvedValue(null)

      const result = await deselectBook("cat-book-1")

      expect(result).toEqual({
        success: false,
        error: "Selection not found",
      })
      expect(db.$transaction).not.toHaveBeenCalled()
    })

    it("requires ADMIN or DEVELOPER role", async () => {
      mockUnauthorizedSession("STUDENT")

      const result = await deselectBook("cat-book-1")

      expect(result).toEqual({
        success: false,
        error: "Unauthorized: ADMIN or DEVELOPER role required",
      })
      expect(db.bookSelection.findFirst).not.toHaveBeenCalled()
    })

    it("requires school context", async () => {
      mockNoSchoolContext()

      const result = await deselectBook("cat-book-1")

      expect(result).toEqual({
        success: false,
        error: "Missing school context",
      })
    })

    it("scopes findFirst query by schoolId", async () => {
      mockAdminSession()
      vi.mocked(db.bookSelection.findFirst).mockResolvedValue(null)

      await deselectBook("cat-book-1")

      expect(db.bookSelection.findFirst).toHaveBeenCalledWith({
        where: { schoolId: "school-1", catalogBookId: "cat-book-1" },
      })
    })
  })

  // ==========================================================================
  // updateBookSelection
  // ==========================================================================

  describe("updateBookSelection", () => {
    it("updates with valid data", async () => {
      mockAdminSession()
      vi.mocked(db.bookSelection.findFirst).mockResolvedValue({
        id: "sel-1",
      } as any)
      vi.mocked(db.bookSelection.update).mockResolvedValue({} as any)

      const result = await updateBookSelection("sel-1", {
        totalCopies: 10,
        shelfLocation: "Shelf B",
      })

      expect(result).toEqual({ success: true })
      expect(db.bookSelection.update).toHaveBeenCalledWith({
        where: { id: "sel-1" },
        data: { totalCopies: 10, shelfLocation: "Shelf B" },
      })
      expect(revalidatePath).toHaveBeenCalledWith("/library/catalog")
      expect(revalidatePath).toHaveBeenCalledWith("/library/books")
      expect(revalidatePath).toHaveBeenCalledWith("/library/admin/books")
    })

    it("returns error if selection not found", async () => {
      mockAdminSession()
      vi.mocked(db.bookSelection.findFirst).mockResolvedValue(null)

      const result = await updateBookSelection("nonexistent", {
        totalCopies: 5,
      })

      expect(result).toEqual({
        success: false,
        error: "Selection not found",
      })
      expect(db.bookSelection.update).not.toHaveBeenCalled()
    })

    it("verifies ownership by scoping findFirst with schoolId", async () => {
      mockAdminSession()
      vi.mocked(db.bookSelection.findFirst).mockResolvedValue({
        id: "sel-1",
      } as any)
      vi.mocked(db.bookSelection.update).mockResolvedValue({} as any)

      await updateBookSelection("sel-1", { totalCopies: 5 })

      expect(db.bookSelection.findFirst).toHaveBeenCalledWith({
        where: { id: "sel-1", schoolId: "school-1" },
      })
    })

    it("validates input with Zod (rejects extra fields)", async () => {
      mockAdminSession()

      const result = await updateBookSelection("sel-1", {
        totalCopies: 5,
        maliciousField: "injected",
      } as any)

      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
      // Zod strict() rejects before findFirst is reached
      expect(db.bookSelection.findFirst).not.toHaveBeenCalled()
    })

    it("validates totalCopies must be a positive integer", async () => {
      mockAdminSession()

      const result = await updateBookSelection("sel-1", {
        totalCopies: -1,
      })

      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })

    it("validates availableCopies must be non-negative", async () => {
      mockAdminSession()

      const result = await updateBookSelection("sel-1", {
        availableCopies: -1,
      })

      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })

    it("accepts all valid optional fields", async () => {
      mockAdminSession()
      vi.mocked(db.bookSelection.findFirst).mockResolvedValue({
        id: "sel-1",
      } as any)
      vi.mocked(db.bookSelection.update).mockResolvedValue({} as any)

      const result = await updateBookSelection("sel-1", {
        totalCopies: 10,
        availableCopies: 8,
        shelfLocation: "Shelf C",
        customName: "Custom Title",
        gradeId: "grade-1",
        isActive: false,
      })

      expect(result).toEqual({ success: true })
      expect(db.bookSelection.update).toHaveBeenCalledWith({
        where: { id: "sel-1" },
        data: {
          totalCopies: 10,
          availableCopies: 8,
          shelfLocation: "Shelf C",
          customName: "Custom Title",
          gradeId: "grade-1",
          isActive: false,
        },
      })
    })

    it("accepts nullable gradeId", async () => {
      mockAdminSession()
      vi.mocked(db.bookSelection.findFirst).mockResolvedValue({
        id: "sel-1",
      } as any)
      vi.mocked(db.bookSelection.update).mockResolvedValue({} as any)

      const result = await updateBookSelection("sel-1", {
        gradeId: null,
      })

      expect(result).toEqual({ success: true })
      expect(db.bookSelection.update).toHaveBeenCalledWith({
        where: { id: "sel-1" },
        data: { gradeId: null },
      })
    })

    it("requires ADMIN or DEVELOPER role", async () => {
      mockUnauthorizedSession("TEACHER")

      const result = await updateBookSelection("sel-1", { totalCopies: 5 })

      expect(result).toEqual({
        success: false,
        error: "Unauthorized: ADMIN or DEVELOPER role required",
      })
    })

    it("requires school context", async () => {
      mockNoSchoolContext()

      const result = await updateBookSelection("sel-1", { totalCopies: 5 })

      expect(result).toEqual({
        success: false,
        error: "Missing school context",
      })
    })
  })

  // ==========================================================================
  // toggleBookSelection
  // ==========================================================================

  describe("toggleBookSelection", () => {
    it("toggles isActive to false", async () => {
      mockAdminSession()
      vi.mocked(db.bookSelection.findFirst).mockResolvedValue({
        id: "sel-1",
        isActive: true,
      } as any)
      vi.mocked(db.bookSelection.update).mockResolvedValue({} as any)

      const result = await toggleBookSelection("cat-book-1", false)

      expect(result).toEqual({ success: true })
      expect(db.bookSelection.update).toHaveBeenCalledWith({
        where: { id: "sel-1" },
        data: { isActive: false },
      })
      expect(revalidatePath).toHaveBeenCalledWith("/library/catalog")
      expect(revalidatePath).toHaveBeenCalledWith("/library/books")
      expect(revalidatePath).toHaveBeenCalledWith("/library/admin/books")
    })

    it("toggles isActive to true", async () => {
      mockAdminSession()
      vi.mocked(db.bookSelection.findFirst).mockResolvedValue({
        id: "sel-1",
        isActive: false,
      } as any)
      vi.mocked(db.bookSelection.update).mockResolvedValue({} as any)

      const result = await toggleBookSelection("cat-book-1", true)

      expect(result).toEqual({ success: true })
      expect(db.bookSelection.update).toHaveBeenCalledWith({
        where: { id: "sel-1" },
        data: { isActive: true },
      })
    })

    it("returns error if selection not found", async () => {
      mockAdminSession()
      vi.mocked(db.bookSelection.findFirst).mockResolvedValue(null)

      const result = await toggleBookSelection("cat-book-1", true)

      expect(result).toEqual({
        success: false,
        error: "Selection not found",
      })
      expect(db.bookSelection.update).not.toHaveBeenCalled()
    })

    it("requires ADMIN or DEVELOPER role", async () => {
      mockUnauthorizedSession("STUDENT")

      const result = await toggleBookSelection("cat-book-1", true)

      expect(result).toEqual({
        success: false,
        error: "Unauthorized: ADMIN or DEVELOPER role required",
      })
      expect(db.bookSelection.findFirst).not.toHaveBeenCalled()
    })

    it("requires school context", async () => {
      mockNoSchoolContext()

      const result = await toggleBookSelection("cat-book-1", true)

      expect(result).toEqual({
        success: false,
        error: "Missing school context",
      })
    })

    it("scopes findFirst query by schoolId and catalogBookId", async () => {
      mockAdminSession()
      vi.mocked(db.bookSelection.findFirst).mockResolvedValue({
        id: "sel-1",
        isActive: true,
      } as any)
      vi.mocked(db.bookSelection.update).mockResolvedValue({} as any)

      await toggleBookSelection("cat-book-1", false)

      expect(db.bookSelection.findFirst).toHaveBeenCalledWith({
        where: { schoolId: "school-1", catalogBookId: "cat-book-1" },
      })
    })

    it("uses selection.id for update, not catalogBookId", async () => {
      mockAdminSession()
      vi.mocked(db.bookSelection.findFirst).mockResolvedValue({
        id: "actual-selection-id",
        isActive: true,
      } as any)
      vi.mocked(db.bookSelection.update).mockResolvedValue({} as any)

      await toggleBookSelection("cat-book-1", false)

      expect(db.bookSelection.update).toHaveBeenCalledWith({
        where: { id: "actual-selection-id" },
        data: { isActive: false },
      })
    })
  })
})
