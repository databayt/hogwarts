// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { revalidatePath } from "next/cache"
import { auth } from "@/auth"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import {
  createBook,
  deleteBook,
  updateBook,
} from "@/components/saas-dashboard/catalog/book-actions"

// ============================================================================
// Mocks
// ============================================================================

vi.mock("@/auth", () => ({
  auth: vi.fn(),
}))

vi.mock("@/lib/db", () => ({
  db: {
    book: {
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

function makeBookFormData(overrides: Record<string, string> = {}): FormData {
  const data = new FormData()
  const defaults: Record<string, string> = {
    title: "Test Book",
    slug: "test-book",
    author: "Test Author",
    genre: "Fiction",
    ...overrides,
  }
  for (const [key, value] of Object.entries(defaults)) {
    data.set(key, value)
  }
  return data
}

// ============================================================================
// Tests
// ============================================================================

describe("Book Actions", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ==========================================================================
  // createBook
  // ==========================================================================

  describe("createBook", () => {
    it("creates book with valid FormData", async () => {
      mockDeveloperSession()
      vi.mocked(db.book.create).mockResolvedValue({
        id: "book-1",
      } as any)

      const formData = makeBookFormData()
      const result = await createBook(formData)

      expect(result).toEqual({ success: true, data: { id: "book-1" } })
      expect(db.book.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          title: "Test Book",
          slug: "test-book",
          author: "Test Author",
          genre: "Fiction",
          approvalStatus: "APPROVED",
          visibility: "PUBLIC",
          status: "PUBLISHED",
        }),
      })
      expect(revalidatePath).toHaveBeenCalledWith("/catalog/books")
    })

    it("strips client-sent approvalStatus — always sets APPROVED", async () => {
      mockDeveloperSession()
      vi.mocked(db.book.create).mockResolvedValue({
        id: "book-2",
      } as any)

      const formData = makeBookFormData({ approvalStatus: "PENDING" })
      const result = await createBook(formData)

      expect(result.success).toBe(true)
      expect(db.book.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          approvalStatus: "APPROVED",
          status: "PUBLISHED",
        }),
      })
    })

    it("requires DEVELOPER role", async () => {
      mockNonDeveloperSession("ADMIN")

      const formData = makeBookFormData()
      const result = await createBook(formData)

      expect(result).toEqual({
        success: false,
        error: "Unauthorized: DEVELOPER role required",
      })
      expect(db.book.create).not.toHaveBeenCalled()
    })

    it("returns error on Zod validation failure", async () => {
      mockDeveloperSession()

      // Missing required fields
      const formData = new FormData()
      formData.set("title", "")
      const result = await createBook(formData)

      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
      expect(db.book.create).not.toHaveBeenCalled()
    })

    it("returns error on database failure", async () => {
      mockDeveloperSession()
      vi.mocked(db.book.create).mockRejectedValue(
        new Error("Unique constraint violation")
      )

      const formData = makeBookFormData()
      const result = await createBook(formData)

      expect(result).toEqual({
        success: false,
        error: "Unique constraint violation",
      })
    })
  })

  // ==========================================================================
  // updateBook
  // ==========================================================================

  describe("updateBook", () => {
    it("updates book by id", async () => {
      mockDeveloperSession()
      vi.mocked(db.book.findUnique).mockResolvedValue({
        id: "book-1",
      } as any)
      vi.mocked(db.book.update).mockResolvedValue({
        id: "book-1",
      } as any)

      const formData = makeBookFormData({ title: "Updated Title" })
      const result = await updateBook("book-1", formData)

      expect(result).toEqual({ success: true, data: { id: "book-1" } })
      expect(db.book.update).toHaveBeenCalledWith({
        where: { id: "book-1" },
        data: expect.objectContaining({ title: "Updated Title" }),
      })
      expect(revalidatePath).toHaveBeenCalledWith("/catalog/books")
      expect(revalidatePath).toHaveBeenCalledWith("/catalog/books/book-1")
    })

    it("returns error for non-existent id", async () => {
      mockDeveloperSession()
      vi.mocked(db.book.findUnique).mockResolvedValue(null)

      const formData = makeBookFormData()
      const result = await updateBook("nonexistent", formData)

      expect(result).toEqual({
        success: false,
        error: "catalog_book_not_found",
      })
      expect(db.book.update).not.toHaveBeenCalled()
    })

    it("requires DEVELOPER role", async () => {
      mockNonDeveloperSession("TEACHER")

      const formData = makeBookFormData()
      const result = await updateBook("book-1", formData)

      expect(result).toEqual({
        success: false,
        error: "Unauthorized: DEVELOPER role required",
      })
      expect(db.book.findUnique).not.toHaveBeenCalled()
    })
  })

  // ==========================================================================
  // deleteBook
  // ==========================================================================

  describe("deleteBook", () => {
    it("deletes book by id", async () => {
      mockDeveloperSession()
      vi.mocked(db.book.findUnique).mockResolvedValue({
        id: "book-1",
      } as any)
      vi.mocked(db.book.delete).mockResolvedValue({} as any)

      const result = await deleteBook("book-1")

      expect(result).toEqual({ success: true })
      expect(db.book.delete).toHaveBeenCalledWith({
        where: { id: "book-1" },
      })
      expect(revalidatePath).toHaveBeenCalledWith("/catalog/books")
    })

    it("returns error for non-existent id", async () => {
      mockDeveloperSession()
      vi.mocked(db.book.findUnique).mockResolvedValue(null)

      const result = await deleteBook("nonexistent")

      expect(result).toEqual({
        success: false,
        error: "catalog_book_not_found",
      })
      expect(db.book.delete).not.toHaveBeenCalled()
    })

    it("requires DEVELOPER role", async () => {
      mockNonDeveloperSession("STUDENT")

      const result = await deleteBook("book-1")

      expect(result).toEqual({
        success: false,
        error: "Unauthorized: DEVELOPER role required",
      })
      expect(db.book.findUnique).not.toHaveBeenCalled()
    })
  })
})
