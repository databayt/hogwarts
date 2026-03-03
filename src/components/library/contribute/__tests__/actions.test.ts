// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { revalidatePath } from "next/cache"
import { auth } from "@/auth"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"

import { contributeBook } from "../actions"

// ============================================================================
// Mocks
// ============================================================================

vi.mock("@/auth", () => ({
  auth: vi.fn(),
}))

vi.mock("@/lib/db", () => ({
  db: {
    catalogBook: {
      create: vi.fn(),
    },
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

function mockTeacherSession() {
  vi.mocked(auth).mockResolvedValue({
    user: { id: "teacher-1", role: "TEACHER" },
  } as any)
  vi.mocked(getTenantContext).mockResolvedValue({
    schoolId: "school-1",
    subdomain: "demo",
  } as any)
}

function mockAdminSession() {
  vi.mocked(auth).mockResolvedValue({
    user: { id: "admin-1", role: "ADMIN" },
  } as any)
  vi.mocked(getTenantContext).mockResolvedValue({
    schoolId: "school-1",
    subdomain: "demo",
  } as any)
}

const validInput = {
  title: "My Book",
  author: "Author Name",
  genre: "Science",
  description: "A science book",
}

// ============================================================================
// Tests
// ============================================================================

describe("Contribute Actions", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("contributeBook", () => {
    it("creates CatalogBook with PENDING status", async () => {
      mockTeacherSession()
      vi.mocked(db.catalogBook.create).mockResolvedValue({
        id: "book-1",
      } as any)

      const result = await contributeBook(validInput)

      expect(result).toEqual({
        success: true,
        data: { bookId: "book-1" },
      })
      expect(db.catalogBook.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          title: "My Book",
          author: "Author Name",
          genre: "Science",
          approvalStatus: "PENDING",
          status: "DRAFT",
          contributedBy: "teacher-1",
          contributedSchoolId: "school-1",
        }),
      })
      expect(revalidatePath).toHaveBeenCalledWith("/library/contribute")
    })

    it("generates slug from title", async () => {
      mockTeacherSession()
      vi.mocked(db.catalogBook.create).mockResolvedValue({
        id: "book-2",
      } as any)

      await contributeBook(validInput)

      const createCall = vi.mocked(db.catalogBook.create).mock.calls[0][0]
      expect(createCall.data.slug).toMatch(/^my-book-[a-z0-9]+$/)
    })

    it("requires TEACHER/ADMIN/DEVELOPER role", async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: "student-1", role: "STUDENT" },
      } as any)
      vi.mocked(getTenantContext).mockResolvedValue({
        schoolId: "school-1",
        subdomain: "demo",
      } as any)

      const result = await contributeBook(validInput)

      expect(result).toEqual({ success: false, error: "Unauthorized" })
      expect(db.catalogBook.create).not.toHaveBeenCalled()
    })

    it("requires school context", async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: "teacher-1", role: "TEACHER" },
      } as any)
      vi.mocked(getTenantContext).mockResolvedValue({
        schoolId: null,
        subdomain: null,
      } as any)

      const result = await contributeBook(validInput)

      expect(result).toEqual({
        success: false,
        error: "Missing school context",
      })
      expect(db.catalogBook.create).not.toHaveBeenCalled()
    })

    it("returns error for missing title", async () => {
      mockTeacherSession()

      const result = await contributeBook({
        ...validInput,
        title: "",
      })

      expect(result).toEqual({
        success: false,
        error: "Title is required",
      })
      expect(db.catalogBook.create).not.toHaveBeenCalled()
    })

    it("returns error for unauthenticated user", async () => {
      vi.mocked(auth).mockResolvedValue(null)

      const result = await contributeBook(validInput)

      expect(result).toEqual({
        success: false,
        error: "Not authenticated",
      })
      expect(db.catalogBook.create).not.toHaveBeenCalled()
    })

    it("returns error on database failure", async () => {
      mockAdminSession()
      vi.mocked(db.catalogBook.create).mockRejectedValue(
        new Error("Unique constraint violation on isbn")
      )

      const result = await contributeBook({
        ...validInput,
        isbn: "duplicate-isbn",
      })

      expect(result).toEqual({
        success: false,
        error: "Unique constraint violation on isbn",
      })
    })
  })
})
