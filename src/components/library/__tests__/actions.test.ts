// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { revalidatePath } from "next/cache"
import { auth } from "@/auth"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"

import {
  borrowBook,
  createBook,
  deleteBook,
  markOverdueBooks,
  returnBook,
  updateBook,
} from "../actions"

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
      findFirst: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    borrowRecord: {
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
      updateMany: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
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

vi.mock("@/lib/i18n-format", () => ({
  formatDate: vi.fn(() => "2026-04-04"),
}))

// ============================================================================
// Helpers
// ============================================================================

// CUID-format test IDs (required by Zod validation)
const SCHOOL_ID = "clschool00000000000000001"
const ADMIN_ID = "cladmin000000000000000001"
const STUDENT_ID = "clstudent0000000000000001"
const BOOK_ID = "clbook0000000000000000001"
const BORROW_ID = "clborrow00000000000000001"
const CATALOG_BOOK_ID = "clcatalog0000000000000001"

function mockAdminSession() {
  vi.mocked(auth).mockResolvedValue({
    user: { id: ADMIN_ID, role: "ADMIN", schoolId: SCHOOL_ID },
  } as any)
  vi.mocked(getTenantContext).mockResolvedValue({
    schoolId: SCHOOL_ID,
    subdomain: "demo",
  } as any)
}

function mockStudentSession() {
  vi.mocked(auth).mockResolvedValue({
    user: { id: STUDENT_ID, role: "STUDENT", schoolId: SCHOOL_ID },
  } as any)
  vi.mocked(getTenantContext).mockResolvedValue({
    schoolId: SCHOOL_ID,
    subdomain: "demo",
  } as any)
}

function mockUnauthenticated() {
  vi.mocked(auth).mockResolvedValue(null)
}

function mockNoSchoolContext() {
  vi.mocked(auth).mockResolvedValue({
    user: { id: ADMIN_ID, role: "ADMIN", schoolId: SCHOOL_ID },
  } as any)
  vi.mocked(getTenantContext).mockResolvedValue({
    schoolId: null,
    subdomain: null,
  } as any)
}

const validBookData = {
  title: "The Great Gatsby",
  author: "F. Scott Fitzgerald",
  genre: "Fiction",
  rating: 4.5,
  coverUrl: "https://example.com/cover.jpg",
  coverColor: "#FF5733",
  description: "A classic novel about the American Dream",
  totalCopies: 3,
  summary: "Set in the Jazz Age, this novel tells the story of Jay Gatsby",
  schoolId: SCHOOL_ID,
  catalogBookId: CATALOG_BOOK_ID,
}

const mockBook = {
  id: BOOK_ID,
  title: "The Great Gatsby",
  author: "F. Scott Fitzgerald",
  genre: "Fiction",
  rating: 4.5,
  coverUrl: "https://example.com/cover.jpg",
  coverColor: "#FF5733",
  description: "A classic novel about the American Dream",
  totalCopies: 3,
  availableCopies: 3,
  summary: "Set in the Jazz Age, this novel tells the story of Jay Gatsby",
  schoolId: SCHOOL_ID,
  createdAt: new Date(),
  updatedAt: new Date(),
}

const mockBorrowRecord = {
  id: BORROW_ID,
  bookId: BOOK_ID,
  userId: STUDENT_ID,
  schoolId: SCHOOL_ID,
  dueDate: new Date("2026-04-04"),
  status: "BORROWED",
  book: mockBook,
  createdAt: new Date(),
  updatedAt: new Date(),
}

// ============================================================================
// Tests
// ============================================================================

describe("Library Actions", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ==========================================================================
  // createBook
  // ==========================================================================

  describe("createBook", () => {
    it("creates a book successfully with valid input and catalogBookId", async () => {
      mockAdminSession()
      vi.mocked(db.schoolBook.create).mockResolvedValue(mockBook as any)

      const result = await createBook(validBookData)

      expect(result).toEqual({
        success: true,
        message: "Book created successfully",
        data: mockBook,
      })
      expect(db.schoolBook.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          title: "The Great Gatsby",
          author: "F. Scott Fitzgerald",
          schoolId: SCHOOL_ID,
          availableCopies: 3,
        }),
      })
      expect(revalidatePath).toHaveBeenCalledWith("/library")
      expect(revalidatePath).toHaveBeenCalledWith("/library/admin/books")
    })

    it("rejects creation when no catalogBookId is provided", async () => {
      const dataWithoutCatalog = { ...validBookData, catalogBookId: undefined }

      const result = await createBook(dataWithoutCatalog)

      expect(result).toEqual({
        success: false,
        message:
          "Books must be added from the catalog. Use Browse Catalog or Contribute Book instead.",
      })
      expect(db.schoolBook.create).not.toHaveBeenCalled()
    })

    it("fails without authentication", async () => {
      mockUnauthenticated()

      const result = await createBook(validBookData)

      expect(result).toEqual({
        success: false,
        message: "Not authenticated",
      })
      expect(db.schoolBook.create).not.toHaveBeenCalled()
    })

    it("fails without school context", async () => {
      mockNoSchoolContext()

      const result = await createBook(validBookData)

      expect(result).toEqual({
        success: false,
        message: "School context not found",
      })
      expect(db.schoolBook.create).not.toHaveBeenCalled()
    })

    it("fails when user role lacks create permission", async () => {
      mockStudentSession()

      const result = await createBook(validBookData)

      // assertLibraryPermission throws for STUDENT on "create"
      expect(result.success).toBe(false)
      expect(db.schoolBook.create).not.toHaveBeenCalled()
    })

    it("handles database errors gracefully", async () => {
      mockAdminSession()
      vi.mocked(db.schoolBook.create).mockRejectedValue(
        new Error("Unique constraint violation")
      )

      const result = await createBook(validBookData)

      expect(result).toEqual({
        success: false,
        message: "Unique constraint violation",
      })
    })
  })

  // ==========================================================================
  // updateBook
  // ==========================================================================

  describe("updateBook", () => {
    const updateData = {
      id: "clxxxxxxxxxxxxxxxxxxxxxxxxx",
      schoolId: SCHOOL_ID as any,
      title: "The Great Gatsby - Revised",
    }

    it("updates a book successfully with partial data", async () => {
      mockAdminSession()
      vi.mocked(db.schoolBook.findFirst).mockResolvedValue(mockBook as any)
      const updatedBook = { ...mockBook, title: "The Great Gatsby - Revised" }
      vi.mocked(db.schoolBook.update).mockResolvedValue(updatedBook as any)

      const result = await updateBook(updateData)

      expect(result).toEqual({
        success: true,
        message: "Book updated successfully",
        data: updatedBook,
      })
      expect(db.schoolBook.findFirst).toHaveBeenCalledWith({
        where: { id: updateData.id, schoolId: SCHOOL_ID },
      })
      expect(db.schoolBook.update).toHaveBeenCalledWith({
        where: { id: updateData.id },
        data: expect.objectContaining({
          title: "The Great Gatsby - Revised",
        }),
      })
      expect(revalidatePath).toHaveBeenCalledWith("/library")
      expect(revalidatePath).toHaveBeenCalledWith(
        `/library/books/${updateData.id}`
      )
      expect(revalidatePath).toHaveBeenCalledWith("/library/admin/books")
    })

    it("fails without authentication", async () => {
      mockUnauthenticated()

      const result = await updateBook(updateData)

      expect(result).toEqual({
        success: false,
        message: "Not authenticated",
      })
      expect(db.schoolBook.findFirst).not.toHaveBeenCalled()
    })

    it("fails without school context", async () => {
      mockNoSchoolContext()

      const result = await updateBook(updateData)

      expect(result).toEqual({
        success: false,
        message: "School context not found",
      })
      expect(db.schoolBook.findFirst).not.toHaveBeenCalled()
    })

    it("fails when book does not belong to the school", async () => {
      mockAdminSession()
      vi.mocked(db.schoolBook.findFirst).mockResolvedValue(null)

      const result = await updateBook(updateData)

      expect(result).toEqual({
        success: false,
        message: "Book not found",
      })
      expect(db.schoolBook.update).not.toHaveBeenCalled()
    })

    it("handles database errors gracefully", async () => {
      mockAdminSession()
      vi.mocked(db.schoolBook.findFirst).mockResolvedValue(mockBook as any)
      vi.mocked(db.schoolBook.update).mockRejectedValue(
        new Error("Database connection error")
      )

      const result = await updateBook(updateData)

      expect(result).toEqual({
        success: false,
        message: "Database connection error",
      })
    })
  })

  // ==========================================================================
  // borrowBook
  // ==========================================================================

  describe("borrowBook", () => {
    const borrowData = {
      bookId: "clxxxxxxxxxxxxxxxxxxxxxxxxx",
      userId: STUDENT_ID,
      schoolId: SCHOOL_ID,
    }

    it("borrows a book successfully", async () => {
      mockStudentSession()
      vi.mocked(db.user.findUnique).mockResolvedValue({
        id: STUDENT_ID,
      } as any)
      vi.mocked(db.schoolBook.findFirst).mockResolvedValue({
        ...mockBook,
        availableCopies: 2,
      } as any)
      vi.mocked(db.borrowRecord.findFirst).mockResolvedValue(null)
      // Mock the individual operations that form the transaction array
      vi.mocked(db.borrowRecord.create).mockResolvedValue({} as any)
      vi.mocked(db.schoolBook.update).mockResolvedValue({} as any)
      vi.mocked(db.$transaction).mockResolvedValue([{}, {}] as any)

      const result = await borrowBook(borrowData)

      expect(result.success).toBe(true)
      expect(result.message).toContain("Book borrowed successfully")
      expect(db.user.findUnique).toHaveBeenCalledWith({
        where: { id: STUDENT_ID },
        select: { id: true },
      })
      expect(db.schoolBook.findFirst).toHaveBeenCalledWith({
        where: { id: borrowData.bookId, schoolId: SCHOOL_ID },
      })
      expect(db.borrowRecord.findFirst).toHaveBeenCalledWith({
        where: {
          bookId: borrowData.bookId,
          userId: borrowData.userId,
          schoolId: SCHOOL_ID,
          status: "BORROWED",
        },
      })
      // Verify transaction was called (array form)
      expect(db.$transaction).toHaveBeenCalledTimes(1)
      // Verify borrowRecord.create was called with correct data
      expect(db.borrowRecord.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            bookId: borrowData.bookId,
            userId: borrowData.userId,
            schoolId: SCHOOL_ID,
            status: "BORROWED",
          }),
        })
      )
      expect(revalidatePath).toHaveBeenCalledWith("/library")
    })

    it("fails without authentication", async () => {
      mockUnauthenticated()

      const result = await borrowBook(borrowData)

      expect(result).toEqual({
        success: false,
        message: "Not authenticated",
      })
      expect(db.schoolBook.findFirst).not.toHaveBeenCalled()
    })

    it("fails without school context", async () => {
      mockNoSchoolContext()

      const result = await borrowBook(borrowData)

      expect(result).toEqual({
        success: false,
        message: "School context not found",
      })
      expect(db.schoolBook.findFirst).not.toHaveBeenCalled()
    })

    it("fails when user does not exist", async () => {
      mockStudentSession()
      vi.mocked(db.user.findUnique).mockResolvedValue(null)

      const result = await borrowBook(borrowData)

      expect(result).toEqual({
        success: false,
        message: "User not found. Please log in again.",
      })
      expect(db.schoolBook.findFirst).not.toHaveBeenCalled()
    })

    it("fails when book is not found", async () => {
      mockStudentSession()
      vi.mocked(db.user.findUnique).mockResolvedValue({
        id: STUDENT_ID,
      } as any)
      vi.mocked(db.schoolBook.findFirst).mockResolvedValue(null)

      const result = await borrowBook(borrowData)

      expect(result).toEqual({
        success: false,
        message: "Book not found",
      })
      expect(db.$transaction).not.toHaveBeenCalled()
    })

    it("fails when no copies are available", async () => {
      mockStudentSession()
      vi.mocked(db.user.findUnique).mockResolvedValue({
        id: STUDENT_ID,
      } as any)
      vi.mocked(db.schoolBook.findFirst).mockResolvedValue({
        ...mockBook,
        availableCopies: 0,
      } as any)

      const result = await borrowBook(borrowData)

      expect(result).toEqual({
        success: false,
        message: "No copies available",
      })
      expect(db.$transaction).not.toHaveBeenCalled()
    })

    it("prevents double-borrow by the same user", async () => {
      mockStudentSession()
      vi.mocked(db.user.findUnique).mockResolvedValue({
        id: STUDENT_ID,
      } as any)
      vi.mocked(db.schoolBook.findFirst).mockResolvedValue({
        ...mockBook,
        availableCopies: 2,
      } as any)
      vi.mocked(db.borrowRecord.findFirst).mockResolvedValue(
        mockBorrowRecord as any
      )

      const result = await borrowBook(borrowData)

      expect(result).toEqual({
        success: false,
        message: "You have already borrowed this book",
      })
      expect(db.$transaction).not.toHaveBeenCalled()
    })

    it("handles database transaction errors gracefully", async () => {
      mockStudentSession()
      vi.mocked(db.user.findUnique).mockResolvedValue({
        id: STUDENT_ID,
      } as any)
      vi.mocked(db.schoolBook.findFirst).mockResolvedValue({
        ...mockBook,
        availableCopies: 2,
      } as any)
      vi.mocked(db.borrowRecord.findFirst).mockResolvedValue(null)
      vi.mocked(db.$transaction).mockRejectedValue(
        new Error("Transaction failed")
      )

      const result = await borrowBook(borrowData)

      expect(result).toEqual({
        success: false,
        message: "Transaction failed",
      })
    })
  })

  // ==========================================================================
  // returnBook
  // ==========================================================================

  describe("returnBook", () => {
    const returnData = {
      borrowRecordId: "clyyyyyyyyyyyyyyyyyyyyyyyyy",
      schoolId: SCHOOL_ID,
    }

    it("returns a book successfully", async () => {
      mockStudentSession()
      vi.mocked(db.borrowRecord.findFirst).mockResolvedValue({
        ...mockBorrowRecord,
        status: "BORROWED",
      } as any)
      // Mock the individual operations that form the transaction array
      vi.mocked(db.borrowRecord.update).mockResolvedValue({} as any)
      vi.mocked(db.schoolBook.update).mockResolvedValue({} as any)
      vi.mocked(db.$transaction).mockResolvedValue([{}, {}] as any)

      const result = await returnBook(returnData)

      expect(result).toEqual({
        success: true,
        message: "Book returned successfully",
      })
      expect(db.borrowRecord.findFirst).toHaveBeenCalledWith({
        where: {
          id: returnData.borrowRecordId,
          schoolId: SCHOOL_ID,
        },
        include: { book: true },
      })
      // Verify transaction was called (array form)
      expect(db.$transaction).toHaveBeenCalledTimes(1)
      // Verify borrowRecord.update was called to mark RETURNED
      expect(db.borrowRecord.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: returnData.borrowRecordId },
          data: expect.objectContaining({
            status: "RETURNED",
          }),
        })
      )
      expect(revalidatePath).toHaveBeenCalledWith("/library")
      expect(revalidatePath).toHaveBeenCalledWith(
        `/library/books/${mockBorrowRecord.bookId}`
      )
      expect(revalidatePath).toHaveBeenCalledWith("/library/my-profile")
    })

    it("fails without authentication", async () => {
      mockUnauthenticated()

      const result = await returnBook(returnData)

      expect(result).toEqual({
        success: false,
        message: "Not authenticated",
      })
      expect(db.borrowRecord.findFirst).not.toHaveBeenCalled()
    })

    it("fails without school context", async () => {
      mockNoSchoolContext()

      const result = await returnBook(returnData)

      expect(result).toEqual({
        success: false,
        message: "School context not found",
      })
      expect(db.borrowRecord.findFirst).not.toHaveBeenCalled()
    })

    it("fails when borrow record is not found", async () => {
      mockStudentSession()
      vi.mocked(db.borrowRecord.findFirst).mockResolvedValue(null)

      const result = await returnBook(returnData)

      expect(result).toEqual({
        success: false,
        message: "Borrow record not found",
      })
      expect(db.$transaction).not.toHaveBeenCalled()
    })

    it("prevents double-return of an already returned book", async () => {
      mockStudentSession()
      vi.mocked(db.borrowRecord.findFirst).mockResolvedValue({
        ...mockBorrowRecord,
        status: "RETURNED",
        returnDate: new Date(),
      } as any)

      const result = await returnBook(returnData)

      expect(result).toEqual({
        success: false,
        message: "Book already returned",
      })
      expect(db.$transaction).not.toHaveBeenCalled()
    })

    it("handles database transaction errors gracefully", async () => {
      mockStudentSession()
      vi.mocked(db.borrowRecord.findFirst).mockResolvedValue({
        ...mockBorrowRecord,
        status: "BORROWED",
      } as any)
      vi.mocked(db.$transaction).mockRejectedValue(
        new Error("Transaction failed")
      )

      const result = await returnBook(returnData)

      expect(result).toEqual({
        success: false,
        message: "Transaction failed",
      })
    })
  })

  // ==========================================================================
  // deleteBook
  // ==========================================================================

  describe("deleteBook", () => {
    const deleteData = {
      id: "clxxxxxxxxxxxxxxxxxxxxxxxxx",
      schoolId: SCHOOL_ID,
    }

    it("deletes a book successfully when no active borrows exist", async () => {
      mockAdminSession()
      vi.mocked(db.schoolBook.findFirst).mockResolvedValue(mockBook as any)
      vi.mocked(db.borrowRecord.count).mockResolvedValue(0)
      vi.mocked(db.schoolBook.delete).mockResolvedValue(mockBook as any)

      const result = await deleteBook(deleteData)

      expect(result).toEqual({
        success: true,
        message: "Book deleted successfully",
      })
      expect(db.schoolBook.findFirst).toHaveBeenCalledWith({
        where: { id: deleteData.id, schoolId: SCHOOL_ID },
      })
      expect(db.borrowRecord.count).toHaveBeenCalledWith({
        where: {
          bookId: deleteData.id,
          schoolId: SCHOOL_ID,
          status: "BORROWED",
        },
      })
      expect(db.schoolBook.delete).toHaveBeenCalledWith({
        where: { id: deleteData.id },
      })
      expect(revalidatePath).toHaveBeenCalledWith("/library")
      expect(revalidatePath).toHaveBeenCalledWith("/library/admin/books")
    })

    it("fails without authentication", async () => {
      mockUnauthenticated()

      const result = await deleteBook(deleteData)

      expect(result).toEqual({
        success: false,
        message: "Not authenticated",
      })
      expect(db.schoolBook.findFirst).not.toHaveBeenCalled()
    })

    it("fails without school context", async () => {
      mockNoSchoolContext()

      const result = await deleteBook(deleteData)

      expect(result).toEqual({
        success: false,
        message: "School context not found",
      })
      expect(db.schoolBook.findFirst).not.toHaveBeenCalled()
    })

    it("fails when book does not belong to the school", async () => {
      mockAdminSession()
      vi.mocked(db.schoolBook.findFirst).mockResolvedValue(null)

      const result = await deleteBook(deleteData)

      expect(result).toEqual({
        success: false,
        message: "Book not found",
      })
      expect(db.borrowRecord.count).not.toHaveBeenCalled()
      expect(db.schoolBook.delete).not.toHaveBeenCalled()
    })

    it("blocks deletion when active borrows exist", async () => {
      mockAdminSession()
      vi.mocked(db.schoolBook.findFirst).mockResolvedValue(mockBook as any)
      vi.mocked(db.borrowRecord.count).mockResolvedValue(2)

      const result = await deleteBook(deleteData)

      expect(result).toEqual({
        success: false,
        message: "Cannot delete book with active borrows",
      })
      expect(db.schoolBook.delete).not.toHaveBeenCalled()
    })

    it("fails when user role lacks delete permission", async () => {
      mockStudentSession()

      const result = await deleteBook(deleteData)

      // assertLibraryPermission throws for STUDENT on "delete"
      expect(result.success).toBe(false)
      expect(db.schoolBook.delete).not.toHaveBeenCalled()
    })

    it("handles database errors gracefully", async () => {
      mockAdminSession()
      vi.mocked(db.schoolBook.findFirst).mockResolvedValue(mockBook as any)
      vi.mocked(db.borrowRecord.count).mockResolvedValue(0)
      vi.mocked(db.schoolBook.delete).mockRejectedValue(
        new Error("Foreign key constraint")
      )

      const result = await deleteBook(deleteData)

      expect(result).toEqual({
        success: false,
        message: "Foreign key constraint",
      })
    })
  })

  // ==========================================================================
  // markOverdueBooks
  // ==========================================================================

  describe("markOverdueBooks", () => {
    it("updates BORROWED records past due date to OVERDUE", async () => {
      mockAdminSession()
      vi.mocked(db.borrowRecord.updateMany).mockResolvedValue({
        count: 3,
      } as any)

      const result = await markOverdueBooks()

      expect(result).toEqual({
        success: true,
        message: "Overdue books updated",
      })
      expect(db.borrowRecord.updateMany).toHaveBeenCalledWith({
        where: {
          schoolId: SCHOOL_ID,
          status: "BORROWED",
          dueDate: {
            lt: expect.any(Date),
          },
        },
        data: {
          status: "OVERDUE",
        },
      })
      expect(revalidatePath).toHaveBeenCalledWith("/library/admin")
      expect(revalidatePath).toHaveBeenCalledWith("/library/my-profile")
    })

    it("scopes the query to the current school only", async () => {
      mockAdminSession()
      vi.mocked(db.borrowRecord.updateMany).mockResolvedValue({
        count: 0,
      } as any)

      await markOverdueBooks()

      const call = vi.mocked(db.borrowRecord.updateMany).mock.calls[0][0]
      expect(call.where.schoolId).toBe(SCHOOL_ID)
    })

    it("fails without authentication", async () => {
      mockUnauthenticated()

      const result = await markOverdueBooks()

      expect(result).toEqual({
        success: false,
        message: "Not authenticated",
      })
      expect(db.borrowRecord.updateMany).not.toHaveBeenCalled()
    })

    it("fails without school context", async () => {
      mockNoSchoolContext()

      const result = await markOverdueBooks()

      expect(result).toEqual({
        success: false,
        message: "School context not found",
      })
      expect(db.borrowRecord.updateMany).not.toHaveBeenCalled()
    })

    it("fails when user role lacks admin permission", async () => {
      mockStudentSession()

      const result = await markOverdueBooks()

      // assertLibraryPermission throws for STUDENT on "admin"
      expect(result.success).toBe(false)
      expect(db.borrowRecord.updateMany).not.toHaveBeenCalled()
    })

    it("succeeds even when no records match (zero overdue)", async () => {
      mockAdminSession()
      vi.mocked(db.borrowRecord.updateMany).mockResolvedValue({
        count: 0,
      } as any)

      const result = await markOverdueBooks()

      expect(result).toEqual({
        success: true,
        message: "Overdue books updated",
      })
    })

    it("handles database errors gracefully", async () => {
      mockAdminSession()
      vi.mocked(db.borrowRecord.updateMany).mockRejectedValue(
        new Error("Connection timeout")
      )

      const result = await markOverdueBooks()

      expect(result).toEqual({
        success: false,
        message: "Connection timeout",
      })
    })
  })
})
