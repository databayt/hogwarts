// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { revalidatePath } from "next/cache"
// Import after mocks so the mock wiring is in place
import { auth } from "@/auth"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import {
  approveContent,
  rejectContent,
} from "@/components/saas-dashboard/catalog/approval-actions"

// ============================================================================
// Mocks
// ============================================================================

vi.mock("@/auth", () => ({
  auth: vi.fn(),
}))

vi.mock("@/lib/db", () => ({
  db: {
    question: {
      update: vi.fn(),
    },
    material: {
      update: vi.fn(),
    },
    assignment: {
      update: vi.fn(),
    },
    book: {
      update: vi.fn(),
    },
    video: {
      update: vi.fn(),
    },
    notification: {
      create: vi.fn(),
      createMany: vi.fn(),
    },
    // Reached by the decision fan-out (uploader + the school's admins).
    user: { findMany: vi.fn() },
    bookSelection: {
      findFirst: vi.fn(),
      create: vi.fn(),
      count: vi.fn(),
    },
    schoolBook: {
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

// after() is fire-and-forget in the next/server test stub, so post-response
// notification work needs a real tick before it can be asserted on.
const flushAfter = () => new Promise((r) => setTimeout(r, 0))

describe("Approval Actions", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(db.user.findMany).mockResolvedValue([{ id: "admin-1" }] as any)
    vi.mocked(db.notification.createMany).mockResolvedValue({ count: 1 } as any)
  })

  // ==========================================================================
  // approveContent
  // ==========================================================================

  describe("approveContent", () => {
    it("approves a Question", async () => {
      mockDeveloperSession()
      vi.mocked(db.question.update).mockResolvedValue({} as any)

      const result = await approveContent("Question", "q-1")

      expect(result).toEqual({ success: true })
      expect(db.question.update).toHaveBeenCalledWith({
        where: { id: "q-1" },
        data: expect.objectContaining({
          approvalStatus: "APPROVED",
          approvedBy: "dev-1",
          rejectionReason: null,
          // Approval must also publish so school browse paths (which filter
          // status=PUBLISHED) can see the approved contribution.
          status: "PUBLISHED",
        }),
      })
      expect(revalidatePath).toHaveBeenCalledWith("/catalog/approvals")
    })

    it("approves a Material", async () => {
      mockDeveloperSession()
      vi.mocked(db.material.update).mockResolvedValue({} as any)

      const result = await approveContent("Material", "m-1")

      expect(result).toEqual({ success: true })
      expect(db.material.update).toHaveBeenCalledWith({
        where: { id: "m-1" },
        data: expect.objectContaining({
          approvalStatus: "APPROVED",
          approvedBy: "dev-1",
          rejectionReason: null,
          status: "PUBLISHED",
        }),
      })
    })

    it("approves a Assignment", async () => {
      mockDeveloperSession()
      vi.mocked(db.assignment.update).mockResolvedValue({} as any)

      const result = await approveContent("Assignment", "a-1")

      expect(result).toEqual({ success: true })
      expect(db.assignment.update).toHaveBeenCalledWith({
        where: { id: "a-1" },
        data: expect.objectContaining({
          approvalStatus: "APPROVED",
          approvedBy: "dev-1",
          rejectionReason: null,
          status: "PUBLISHED",
        }),
      })
    })

    it("applies an explicit visibility option on approval (Question)", async () => {
      mockDeveloperSession()
      vi.mocked(db.question.update).mockResolvedValue({} as any)

      const result = await approveContent("Question", "q-1", {
        visibility: "PUBLIC",
      })

      expect(result).toEqual({ success: true })
      expect(db.question.update).toHaveBeenCalledWith({
        where: { id: "q-1" },
        data: expect.objectContaining({
          approvalStatus: "APPROVED",
          status: "PUBLISHED",
          visibility: "PUBLIC",
        }),
      })
    })

    it("applies an explicit visibility option on approval (Material)", async () => {
      mockDeveloperSession()
      vi.mocked(db.material.update).mockResolvedValue({} as any)

      const result = await approveContent("Material", "m-1", {
        visibility: "SCHOOL",
      })

      expect(result).toEqual({ success: true })
      expect(db.material.update).toHaveBeenCalledWith({
        where: { id: "m-1" },
        data: expect.objectContaining({
          status: "PUBLISHED",
          visibility: "SCHOOL",
        }),
      })
    })

    it("rejects PAID visibility on Material (no price column)", async () => {
      mockDeveloperSession()

      const result = await approveContent("Material", "m-1", {
        visibility: "PAID",
        price: 5,
        currency: "USD",
      })

      expect(result).toEqual({
        success: false,
        error: "paid_visibility_unsupported",
      })
      expect(db.material.update).not.toHaveBeenCalled()
    })

    it("rejects PAID visibility on Assignment (no price column)", async () => {
      mockDeveloperSession()

      const result = await approveContent("Assignment", "a-1", {
        visibility: "PAID",
        price: 5,
        currency: "USD",
      })

      expect(result).toEqual({
        success: false,
        error: "paid_visibility_unsupported",
      })
      expect(db.assignment.update).not.toHaveBeenCalled()
    })

    it("rejects PAID visibility on Book (no price column)", async () => {
      mockDeveloperSession()

      const result = await approveContent("Book", "b-1", {
        visibility: "PAID",
        price: 5,
        currency: "USD",
      })

      expect(result).toEqual({
        success: false,
        error: "paid_visibility_unsupported",
      })
      expect(db.$transaction).not.toHaveBeenCalled()
    })

    it("rejects Question PAID approval without a valid price", async () => {
      mockDeveloperSession()

      const result = await approveContent("Question", "q-1", {
        visibility: "PAID",
      })

      expect(result).toEqual({
        success: false,
        error: "paid_requires_price_and_currency",
      })
      expect(db.question.update).not.toHaveBeenCalled()
    })

    it("writes price + uppercased currency on valid Question PAID approval", async () => {
      mockDeveloperSession()
      vi.mocked(db.question.update).mockResolvedValue({} as any)

      const result = await approveContent("Question", "q-1", {
        visibility: "PAID",
        price: 9.99,
        currency: "usd",
      })

      expect(result).toEqual({ success: true })
      expect(db.question.update).toHaveBeenCalledWith({
        where: { id: "q-1" },
        data: expect.objectContaining({
          approvalStatus: "APPROVED",
          status: "PUBLISHED",
          visibility: "PAID",
          price: 9.99,
          currency: "USD",
        }),
      })
    })

    it("approves a Book with transaction (auto-select into library)", async () => {
      mockDeveloperSession()

      const mockBook = {
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
          book: {
            update: vi
              .fn()
              .mockResolvedValueOnce(mockBook) // first update (approve)
              .mockResolvedValueOnce({} as any), // second update (usageCount)
          },
          bookSelection: {
            findFirst: vi.fn().mockResolvedValue(null), // no existing selection
            create: vi.fn().mockResolvedValue({} as any),
            count: vi.fn().mockResolvedValue(1),
          },
          schoolBook: {
            create: vi.fn().mockResolvedValue({} as any),
          },
        }
        return callback(tx)
      })

      const result = await approveContent("Book", "b-1")

      expect(result).toEqual({ success: true })
      expect(db.$transaction).toHaveBeenCalledTimes(1)
      expect(revalidatePath).toHaveBeenCalledWith("/catalog/approvals")
    })

    it("approves a Book without auto-select when no contributedSchoolId", async () => {
      mockDeveloperSession()

      const mockBook = {
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
          book: {
            update: vi.fn().mockResolvedValue(mockBook),
          },
          bookSelection: {
            findFirst: vi.fn(),
            create: vi.fn().mockImplementation(async () => {
              selectionCreateCalled = true
            }),
            count: vi.fn(),
          },
          schoolBook: {
            create: vi.fn(),
          },
        }
        return callback(tx)
      })

      const result = await approveContent("Book", "b-2")

      expect(result).toEqual({ success: true })
      expect(selectionCreateCalled).toBe(false)
    })

    it("approves a Book without creating duplicate selection", async () => {
      mockDeveloperSession()

      const mockBook = {
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
          book: {
            update: vi.fn().mockResolvedValue(mockBook),
          },
          bookSelection: {
            findFirst: vi.fn().mockResolvedValue({ id: "existing-sel" }), // already exists
            create: vi.fn().mockImplementation(async () => {
              selectionCreateCalled = true
            }),
            count: vi.fn(),
          },
          schoolBook: {
            create: vi.fn().mockImplementation(async () => {
              bookCreateCalled = true
            }),
          },
        }
        return callback(tx)
      })

      const result = await approveContent("Book", "b-3")

      expect(result).toEqual({ success: true })
      expect(selectionCreateCalled).toBe(false)
      expect(bookCreateCalled).toBe(false)
    })

    it("requires DEVELOPER role", async () => {
      mockNonDeveloperSession("ADMIN")

      const result = await approveContent("Question", "q-1")

      expect(result).toEqual({
        success: false,
        error: "Unauthorized: DEVELOPER role required",
      })
      expect(db.question.update).not.toHaveBeenCalled()
    })

    it("returns error when unauthenticated", async () => {
      mockUnauthenticated()

      const result = await approveContent("Question", "q-1")

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
      vi.mocked(db.question.update).mockRejectedValue(
        new Error("Record not found")
      )

      const result = await approveContent("Question", "nonexistent")

      expect(result).toEqual({
        success: false,
        error: "Record not found",
      })
    })
  })

  // ==========================================================================
  // Video decisions — the return leg of the single pipeline
  // ==========================================================================

  describe("Video decisions notify the school", () => {
    const approvedVideo = {
      userId: "teacher-1",
      schoolId: "school-1",
      title: "Algebra intro",
    }

    it("tells the uploader AND the school's admins a video is ready", async () => {
      // Under the single-pipeline model the school has no other surface where
      // this decision appears — /lumos/review is read-only.
      mockDeveloperSession()
      vi.mocked(db.video.update).mockResolvedValue(approvedVideo as any)

      await approveContent("Video", "v-1")
      await flushAfter()

      expect(db.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            schoolId: "school-1",
            role: "ADMIN",
            id: { not: "teacher-1" },
          },
        })
      )
      const rows = vi.mocked(db.notification.createMany).mock.calls[0][0]
        .data as any[]
      expect(rows.map((r) => r.userId).sort()).toEqual(["admin-1", "teacher-1"])
      expect(rows[0].type).toBe("content_approved")
      expect(rows[0].metadata.url).toBe("/lumos/videos")
    })

    it("carries the rejection reason back to the school", async () => {
      mockDeveloperSession()
      vi.mocked(db.video.update).mockResolvedValue(approvedVideo as any)

      await rejectContent("Video", "v-1", "Audio too low")
      await flushAfter()

      const rows = vi.mocked(db.notification.createMany).mock.calls[0][0]
        .data as any[]
      expect(rows[0].type).toBe("content_rejected")
      expect(rows[0].priority).toBe("high")
      expect(rows[0].body).toContain("Audio too low")
    })

    it("skips the fan-out for a platform-scope video with no school", async () => {
      mockDeveloperSession()
      vi.mocked(db.video.update).mockResolvedValue({
        ...approvedVideo,
        schoolId: null,
      } as any)

      await approveContent("Video", "v-1")
      await flushAfter()

      expect(db.notification.createMany).not.toHaveBeenCalled()
    })
  })

  // ==========================================================================
  // rejectContent
  // ==========================================================================

  describe("rejectContent", () => {
    it("rejects a Question with reason", async () => {
      mockDeveloperSession()
      vi.mocked(db.question.update).mockResolvedValue({} as any)

      const result = await rejectContent(
        "Question",
        "q-1",
        "Low quality content"
      )

      expect(result).toEqual({ success: true })
      expect(db.question.update).toHaveBeenCalledWith({
        where: { id: "q-1" },
        data: expect.objectContaining({
          approvalStatus: "REJECTED",
          approvedBy: "dev-1",
          rejectionReason: "Low quality content",
        }),
      })
      expect(revalidatePath).toHaveBeenCalledWith("/catalog/approvals")
    })

    it("rejects a Material with reason", async () => {
      mockDeveloperSession()
      vi.mocked(db.material.update).mockResolvedValue({} as any)

      const result = await rejectContent(
        "Material",
        "m-1",
        "Incorrect information"
      )

      expect(result).toEqual({ success: true })
      expect(db.material.update).toHaveBeenCalledWith({
        where: { id: "m-1" },
        data: expect.objectContaining({
          approvalStatus: "REJECTED",
          rejectionReason: "Incorrect information",
        }),
      })
    })

    it("rejects a Assignment with reason", async () => {
      mockDeveloperSession()
      vi.mocked(db.assignment.update).mockResolvedValue({} as any)

      const result = await rejectContent(
        "Assignment",
        "a-1",
        "Does not meet standards"
      )

      expect(result).toEqual({ success: true })
      expect(db.assignment.update).toHaveBeenCalledWith({
        where: { id: "a-1" },
        data: expect.objectContaining({
          approvalStatus: "REJECTED",
          rejectionReason: "Does not meet standards",
        }),
      })
    })

    it("rejects a Book with reason", async () => {
      mockDeveloperSession()
      vi.mocked(db.book.update).mockResolvedValue({} as any)

      const result = await rejectContent("Book", "b-1", "Copyright issues")

      expect(result).toEqual({ success: true })
      expect(db.book.update).toHaveBeenCalledWith({
        where: { id: "b-1" },
        data: expect.objectContaining({
          approvalStatus: "REJECTED",
          rejectionReason: "Copyright issues",
        }),
      })
    })

    it("returns error for empty rejection reason", async () => {
      mockDeveloperSession()

      const result = await rejectContent("Question", "q-1", "")

      expect(result).toEqual({
        success: false,
        error: "rejection_reason_required",
      })
      expect(db.question.update).not.toHaveBeenCalled()
    })

    it("returns error for whitespace-only rejection reason", async () => {
      mockDeveloperSession()

      const result = await rejectContent("Question", "q-1", "   ")

      expect(result).toEqual({
        success: false,
        error: "rejection_reason_required",
      })
      expect(db.question.update).not.toHaveBeenCalled()
    })

    it("requires DEVELOPER role", async () => {
      mockNonDeveloperSession("TEACHER")

      const result = await rejectContent("Question", "q-1", "Some reason")

      expect(result).toEqual({
        success: false,
        error: "Unauthorized: DEVELOPER role required",
      })
      expect(db.question.update).not.toHaveBeenCalled()
    })

    it("returns error when unauthenticated", async () => {
      mockUnauthenticated()

      const result = await rejectContent("Material", "m-1", "Bad content")

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
      vi.mocked(db.material.update).mockRejectedValue(
        new Error("Database connection lost")
      )

      const result = await rejectContent("Material", "m-1", "Bad content")

      expect(result).toEqual({
        success: false,
        error: "Database connection lost",
      })
    })
  })
})
