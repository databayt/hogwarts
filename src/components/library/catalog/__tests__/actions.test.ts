// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { revalidatePath } from "next/cache"
import { auth } from "@/auth"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"

import {
  deselectCatalogBook,
  selectCatalogBook,
  toggleBookSelection,
  updateBookSelection,
} from "../actions"

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

const mockCatalogBook = {
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
  // selectCatalogBook
  // ==========================================================================

  describe("selectCatalogBook", () => {
    it("creates selection + Book in transaction", async () => {
      mockAdminSession()
      vi.mocked(db.schoolBookSelection.findFirst).mockResolvedValue(null)
      vi.mocked(db.catalogBook.findUnique).mockResolvedValue(
        mockCatalogBook as any
      )
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

      const result = await selectCatalogBook("cat-book-1", 5, "Shelf A")

      expect(result).toEqual({ success: true })
      expect(db.$transaction).toHaveBeenCalledTimes(1)
      expect(revalidatePath).toHaveBeenCalledWith("/library/catalog")
    })

    it("returns error for already-selected book", async () => {
      mockAdminSession()
      vi.mocked(db.schoolBookSelection.findFirst).mockResolvedValue({
        id: "existing",
      } as any)

      const result = await selectCatalogBook("cat-book-1", 5)

      expect(result).toEqual({
        success: false,
        error: "Book already in library",
      })
      expect(db.$transaction).not.toHaveBeenCalled()
    })

    it("returns error for non-existent catalog book", async () => {
      mockAdminSession()
      vi.mocked(db.schoolBookSelection.findFirst).mockResolvedValue(null)
      vi.mocked(db.catalogBook.findUnique).mockResolvedValue(null)

      const result = await selectCatalogBook("nonexistent", 5)

      expect(result).toEqual({
        success: false,
        error: "Catalog book not found",
      })
      expect(db.$transaction).not.toHaveBeenCalled()
    })

    it("requires ADMIN/DEVELOPER role", async () => {
      mockUnauthorizedSession("TEACHER")

      const result = await selectCatalogBook("cat-book-1", 5)

      expect(result).toEqual({
        success: false,
        error: "Unauthorized: ADMIN or DEVELOPER role required",
      })
    })

    it("updates usageCount inside transaction", async () => {
      mockAdminSession()
      vi.mocked(db.schoolBookSelection.findFirst).mockResolvedValue(null)
      vi.mocked(db.catalogBook.findUnique).mockResolvedValue(
        mockCatalogBook as any
      )

      let txCatalogBookUpdate: any
      let txSelectionCount: any
      vi.mocked(db.$transaction).mockImplementation(async (callback: any) => {
        txSelectionCount = vi.fn().mockResolvedValue(3)
        txCatalogBookUpdate = vi.fn().mockResolvedValue({})
        const tx = {
          schoolBookSelection: {
            create: vi.fn().mockResolvedValue({}),
            count: txSelectionCount,
          },
          book: { create: vi.fn().mockResolvedValue({}) },
          catalogBook: { update: txCatalogBookUpdate },
        }
        return callback(tx)
      })

      await selectCatalogBook("cat-book-1", 5)

      expect(txSelectionCount).toHaveBeenCalledWith({
        where: { catalogBookId: "cat-book-1" },
      })
      expect(txCatalogBookUpdate).toHaveBeenCalledWith({
        where: { id: "cat-book-1" },
        data: { usageCount: 3 },
      })
    })
  })

  // ==========================================================================
  // deselectCatalogBook
  // ==========================================================================

  describe("deselectCatalogBook", () => {
    it("removes selection, unlinks books", async () => {
      mockAdminSession()
      vi.mocked(db.schoolBookSelection.findFirst).mockResolvedValue({
        id: "sel-1",
      } as any)
      vi.mocked(db.$transaction).mockImplementation(async (callback: any) => {
        const tx = {
          schoolBookSelection: {
            delete: vi.fn().mockResolvedValue({}),
            count: vi.fn().mockResolvedValue(0),
          },
          book: { updateMany: vi.fn().mockResolvedValue({}) },
          catalogBook: { update: vi.fn().mockResolvedValue({}) },
        }
        return callback(tx)
      })

      const result = await deselectCatalogBook("cat-book-1")

      expect(result).toEqual({ success: true })
      expect(db.$transaction).toHaveBeenCalledTimes(1)
      expect(revalidatePath).toHaveBeenCalledWith("/library/catalog")
    })

    it("returns error for non-existent selection", async () => {
      mockAdminSession()
      vi.mocked(db.schoolBookSelection.findFirst).mockResolvedValue(null)

      const result = await deselectCatalogBook("cat-book-1")

      expect(result).toEqual({
        success: false,
        error: "Selection not found",
      })
      expect(db.$transaction).not.toHaveBeenCalled()
    })

    it("requires ADMIN/DEVELOPER role", async () => {
      mockUnauthorizedSession("STUDENT")

      const result = await deselectCatalogBook("cat-book-1")

      expect(result).toEqual({
        success: false,
        error: "Unauthorized: ADMIN or DEVELOPER role required",
      })
    })
  })

  // ==========================================================================
  // updateBookSelection
  // ==========================================================================

  describe("updateBookSelection", () => {
    it("updates with valid data", async () => {
      mockAdminSession()
      vi.mocked(db.schoolBookSelection.findFirst).mockResolvedValue({
        id: "sel-1",
      } as any)
      vi.mocked(db.schoolBookSelection.update).mockResolvedValue({} as any)

      const result = await updateBookSelection("sel-1", {
        totalCopies: 10,
        shelfLocation: "Shelf B",
      })

      expect(result).toEqual({ success: true })
      expect(db.schoolBookSelection.update).toHaveBeenCalledWith({
        where: { id: "sel-1" },
        data: { totalCopies: 10, shelfLocation: "Shelf B" },
      })
    })

    it("returns error for non-existent selection", async () => {
      mockAdminSession()
      vi.mocked(db.schoolBookSelection.findFirst).mockResolvedValue(null)

      const result = await updateBookSelection("nonexistent", {
        totalCopies: 5,
      })

      expect(result).toEqual({
        success: false,
        error: "Selection not found",
      })
      expect(db.schoolBookSelection.update).not.toHaveBeenCalled()
    })

    it("validates input with Zod (rejects extra fields)", async () => {
      mockAdminSession()

      const result = await updateBookSelection("sel-1", {
        totalCopies: 5,
        maliciousField: "injected",
      } as any)

      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
      expect(db.schoolBookSelection.findFirst).not.toHaveBeenCalled()
    })

    it("requires ADMIN/DEVELOPER role", async () => {
      mockUnauthorizedSession("TEACHER")

      const result = await updateBookSelection("sel-1", { totalCopies: 5 })

      expect(result).toEqual({
        success: false,
        error: "Unauthorized: ADMIN or DEVELOPER role required",
      })
    })
  })

  // ==========================================================================
  // toggleBookSelection
  // ==========================================================================

  describe("toggleBookSelection", () => {
    it("toggles isActive flag", async () => {
      mockAdminSession()
      vi.mocked(db.schoolBookSelection.findFirst).mockResolvedValue({
        id: "sel-1",
        isActive: true,
      } as any)
      vi.mocked(db.schoolBookSelection.update).mockResolvedValue({} as any)

      const result = await toggleBookSelection("cat-book-1", false)

      expect(result).toEqual({ success: true })
      expect(db.schoolBookSelection.update).toHaveBeenCalledWith({
        where: { id: "sel-1" },
        data: { isActive: false },
      })
    })

    it("returns error for non-existent selection", async () => {
      mockAdminSession()
      vi.mocked(db.schoolBookSelection.findFirst).mockResolvedValue(null)

      const result = await toggleBookSelection("cat-book-1", true)

      expect(result).toEqual({
        success: false,
        error: "Selection not found",
      })
      expect(db.schoolBookSelection.update).not.toHaveBeenCalled()
    })

    it("requires ADMIN/DEVELOPER role", async () => {
      mockUnauthorizedSession("STUDENT")

      const result = await toggleBookSelection("cat-book-1", true)

      expect(result).toEqual({
        success: false,
        error: "Unauthorized: ADMIN or DEVELOPER role required",
      })
    })
  })
})
