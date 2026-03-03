// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { revalidatePath } from "next/cache"
import { auth } from "@/auth"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"

import {
  approveProposal,
  getProposalsForReview,
  rejectProposal,
} from "../proposal-actions"

// ============================================================================
// Mocks
// ============================================================================

vi.mock("@/auth", () => ({
  auth: vi.fn(),
}))

vi.mock("@/lib/db", () => ({
  db: {
    catalogProposal: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    catalogSubject: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    catalogChapter: {
      findFirst: vi.fn(),
      create: vi.fn(),
    },
    catalogLesson: {
      findFirst: vi.fn(),
      create: vi.fn(),
    },
    academicGrade: {
      findFirst: vi.fn(),
    },
    schoolSubjectSelection: {
      create: vi.fn(),
    },
    department: {
      findFirst: vi.fn(),
    },
    subject: {
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

// ============================================================================
// Tests
// ============================================================================

describe("Proposal Actions (SaaS)", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ==========================================================================
  // getProposalsForReview
  // ==========================================================================

  describe("getProposalsForReview", () => {
    it("returns proposals list for DEVELOPER", async () => {
      mockDeveloperSession()

      const mockProposals = [
        {
          id: "p-1",
          type: "SUBJECT",
          status: "SUBMITTED",
          data: { name: "Physics" },
          schoolId: "school-1",
          school: { name: "Demo School" },
          proposedBy: "user-1",
          createdAt: new Date("2026-01-01"),
          parentSubjectId: null,
          parentChapterId: null,
        },
      ]
      vi.mocked(db.catalogProposal.findMany).mockResolvedValue(
        mockProposals as any
      )

      const result = await getProposalsForReview()

      expect(result.success).toBe(true)
      expect(result.data).toHaveLength(1)
      expect(result.data![0].schoolName).toBe("Demo School")
      expect(result.data![0].type).toBe("SUBJECT")
    })

    it("filters by status when provided", async () => {
      mockDeveloperSession()
      vi.mocked(db.catalogProposal.findMany).mockResolvedValue([])

      await getProposalsForReview("SUBMITTED")

      expect(db.catalogProposal.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { status: "SUBMITTED" },
        })
      )
    })

    it("requires DEVELOPER role", async () => {
      mockNonDeveloperSession("ADMIN")

      const result = await getProposalsForReview()

      expect(result.success).toBe(false)
      expect(result.error).toBe("Unauthorized: DEVELOPER role required")
    })
  })

  // ==========================================================================
  // approveProposal
  // ==========================================================================

  describe("approveProposal", () => {
    it("approves SUBJECT proposal (creates CatalogSubject + auto-bridges)", async () => {
      mockDeveloperSession()

      vi.mocked(db.catalogProposal.findUnique).mockResolvedValue({
        id: "p-1",
        type: "SUBJECT",
        status: "SUBMITTED",
        schoolId: "school-1",
        data: { name: "Physics", department: "Science" },
      } as any)

      vi.mocked(db.$transaction).mockImplementation(async (callback: any) => {
        const tx = {
          catalogSubject: {
            findUnique: vi.fn().mockResolvedValue(null),
            create: vi.fn().mockResolvedValue({ id: "cs-1" }),
          },
          academicGrade: {
            findFirst: vi.fn().mockResolvedValue({ id: "grade-1" }),
          },
          schoolSubjectSelection: {
            create: vi.fn().mockResolvedValue({}),
          },
          department: {
            findFirst: vi.fn().mockResolvedValue({ id: "dept-1" }),
          },
          subject: {
            create: vi.fn().mockResolvedValue({}),
          },
        }
        return callback(tx)
      })

      vi.mocked(db.catalogProposal.update).mockResolvedValue({} as any)

      const result = await approveProposal("p-1", "Looks good")

      expect(result.success).toBe(true)
      expect(result.data).toEqual({ catalogEntityId: "cs-1" })
      expect(db.$transaction).toHaveBeenCalledTimes(1)
      expect(db.catalogProposal.update).toHaveBeenCalledWith({
        where: { id: "p-1" },
        data: expect.objectContaining({
          status: "PUBLISHED",
          reviewedBy: "dev-1",
          catalogEntityId: "cs-1",
        }),
      })
      expect(revalidatePath).toHaveBeenCalledWith("/catalog/proposals")
    })

    it("approves CHAPTER proposal", async () => {
      mockDeveloperSession()

      vi.mocked(db.catalogProposal.findUnique).mockResolvedValue({
        id: "p-2",
        type: "CHAPTER",
        status: "IN_REVIEW",
        schoolId: "school-1",
        parentSubjectId: "cs-1",
        data: { name: "Mechanics", sequenceOrder: 1 },
      } as any)

      vi.mocked(db.catalogChapter.findFirst).mockResolvedValue(null)
      vi.mocked(db.catalogChapter.create).mockResolvedValue({
        id: "ch-1",
      } as any)
      vi.mocked(db.catalogProposal.update).mockResolvedValue({} as any)

      const result = await approveProposal("p-2")

      expect(result.success).toBe(true)
      expect(result.data).toEqual({ catalogEntityId: "ch-1" })
      expect(db.catalogChapter.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          subjectId: "cs-1",
          name: "Mechanics",
          status: "PUBLISHED",
        }),
      })
    })

    it("approves LESSON proposal", async () => {
      mockDeveloperSession()

      vi.mocked(db.catalogProposal.findUnique).mockResolvedValue({
        id: "p-3",
        type: "LESSON",
        status: "SUBMITTED",
        schoolId: "school-1",
        parentChapterId: "ch-1",
        data: { name: "Newton's Laws", durationMinutes: 45 },
      } as any)

      vi.mocked(db.catalogLesson.findFirst).mockResolvedValue(null)
      vi.mocked(db.catalogLesson.create).mockResolvedValue({
        id: "les-1",
      } as any)
      vi.mocked(db.catalogProposal.update).mockResolvedValue({} as any)

      const result = await approveProposal("p-3")

      expect(result.success).toBe(true)
      expect(result.data).toEqual({ catalogEntityId: "les-1" })
      expect(db.catalogLesson.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          chapterId: "ch-1",
          name: "Newton's Laws",
          durationMinutes: 45,
          status: "PUBLISHED",
        }),
      })
    })

    it("returns error for non-existent proposal", async () => {
      mockDeveloperSession()
      vi.mocked(db.catalogProposal.findUnique).mockResolvedValue(null)

      const result = await approveProposal("nonexistent")

      expect(result).toEqual({ success: false, error: "Proposal not found" })
    })

    it("returns error for already-approved proposal", async () => {
      mockDeveloperSession()
      vi.mocked(db.catalogProposal.findUnique).mockResolvedValue({
        id: "p-1",
        type: "SUBJECT",
        status: "PUBLISHED",
        data: {},
      } as any)

      const result = await approveProposal("p-1")

      expect(result.success).toBe(false)
      expect(result.error).toContain("Cannot approve a proposal with status")
    })

    it("returns error for unknown proposal type", async () => {
      mockDeveloperSession()
      vi.mocked(db.catalogProposal.findUnique).mockResolvedValue({
        id: "p-1",
        type: "UNKNOWN",
        status: "SUBMITTED",
        data: {},
      } as any)

      const result = await approveProposal("p-1")

      expect(result).toEqual({
        success: false,
        error: "Unknown proposal type: UNKNOWN",
      })
    })

    it("requires DEVELOPER role", async () => {
      mockNonDeveloperSession("ADMIN")

      const result = await approveProposal("p-1")

      expect(result).toEqual({
        success: false,
        error: "Unauthorized: DEVELOPER role required",
      })
      expect(db.catalogProposal.findUnique).not.toHaveBeenCalled()
    })
  })

  // ==========================================================================
  // rejectProposal
  // ==========================================================================

  describe("rejectProposal", () => {
    it("rejects proposal with reason", async () => {
      mockDeveloperSession()
      vi.mocked(db.catalogProposal.findUnique).mockResolvedValue({
        status: "SUBMITTED",
      } as any)
      vi.mocked(db.catalogProposal.update).mockResolvedValue({} as any)

      const result = await rejectProposal("p-1", "Duplicate subject")

      expect(result).toEqual({ success: true })
      expect(db.catalogProposal.update).toHaveBeenCalledWith({
        where: { id: "p-1" },
        data: expect.objectContaining({
          status: "REJECTED",
          reviewedBy: "dev-1",
          rejectionReason: "Duplicate subject",
        }),
      })
      expect(revalidatePath).toHaveBeenCalledWith("/catalog/proposals")
    })

    it("returns error for empty rejection reason", async () => {
      mockDeveloperSession()

      const result = await rejectProposal("p-1", "")

      expect(result).toEqual({
        success: false,
        error: "Rejection reason is required",
      })
      expect(db.catalogProposal.findUnique).not.toHaveBeenCalled()
    })

    it("returns error for whitespace-only rejection reason", async () => {
      mockDeveloperSession()

      const result = await rejectProposal("p-1", "   ")

      expect(result).toEqual({
        success: false,
        error: "Rejection reason is required",
      })
    })

    it("returns error for non-existent proposal", async () => {
      mockDeveloperSession()
      vi.mocked(db.catalogProposal.findUnique).mockResolvedValue(null)

      const result = await rejectProposal("nonexistent", "Bad content")

      expect(result).toEqual({ success: false, error: "Proposal not found" })
    })

    it("requires DEVELOPER role", async () => {
      mockNonDeveloperSession("TEACHER")

      const result = await rejectProposal("p-1", "Some reason")

      expect(result).toEqual({
        success: false,
        error: "Unauthorized: DEVELOPER role required",
      })
    })
  })
})
