// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { revalidatePath } from "next/cache"
import { auth } from "@/auth"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"

import {
  getMyProposals,
  submitChapterProposal,
  submitLessonProposal,
  submitSubjectProposal,
  updateProposal,
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
      create: vi.fn(),
      findMany: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
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

function mockAdminSession() {
  vi.mocked(auth).mockResolvedValue({
    user: { id: "admin-1", role: "ADMIN" },
  } as any)
  vi.mocked(getTenantContext).mockResolvedValue({
    schoolId: "school-1",
    subdomain: "demo",
  } as any)
}

function mockUnauthorizedSession(role = "TEACHER") {
  vi.mocked(auth).mockResolvedValue({
    user: { id: "user-1", role },
  } as any)
  vi.mocked(getTenantContext).mockResolvedValue({
    schoolId: "school-1",
    subdomain: "demo",
  } as any)
}

// ============================================================================
// Tests
// ============================================================================

describe("Proposal Actions (School)", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ==========================================================================
  // submitSubjectProposal
  // ==========================================================================

  describe("submitSubjectProposal", () => {
    it("creates proposal with SUBMITTED status", async () => {
      mockAdminSession()
      vi.mocked(db.catalogProposal.create).mockResolvedValue({
        id: "p-1",
      } as any)

      const result = await submitSubjectProposal({
        name: "Physics",
        department: "Science",
        description: "Basic physics",
      })

      expect(result.success).toBe(true)
      expect(result.data).toEqual({ id: "p-1" })
      expect(db.catalogProposal.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          schoolId: "school-1",
          proposedBy: "admin-1",
          type: "SUBJECT",
          status: "SUBMITTED",
        }),
      })
      expect(revalidatePath).toHaveBeenCalledWith("/subjects")
    })

    it("validates with Zod (rejects missing name)", async () => {
      mockAdminSession()

      const result = await submitSubjectProposal({
        name: "",
        department: "Science",
      })

      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
      expect(db.catalogProposal.create).not.toHaveBeenCalled()
    })

    it("requires ADMIN/DEVELOPER role", async () => {
      mockUnauthorizedSession("TEACHER")

      const result = await submitSubjectProposal({
        name: "Physics",
        department: "Science",
      })

      expect(result.success).toBe(false)
      expect(result.error).toContain("ADMIN or DEVELOPER role required")
    })
  })

  // ==========================================================================
  // submitChapterProposal
  // ==========================================================================

  describe("submitChapterProposal", () => {
    it("creates chapter proposal with parentSubjectId", async () => {
      mockAdminSession()
      vi.mocked(db.catalogProposal.create).mockResolvedValue({
        id: "p-2",
      } as any)

      const result = await submitChapterProposal("subject-1", {
        name: "Mechanics",
        sequenceOrder: 1,
      })

      expect(result.success).toBe(true)
      expect(result.data).toEqual({ id: "p-2" })
      expect(db.catalogProposal.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          type: "CHAPTER",
          parentSubjectId: "subject-1",
          status: "SUBMITTED",
        }),
      })
    })

    it("requires ADMIN/DEVELOPER role", async () => {
      mockUnauthorizedSession("STUDENT")

      const result = await submitChapterProposal("subject-1", {
        name: "Chapter 1",
      })

      expect(result.success).toBe(false)
      expect(result.error).toContain("ADMIN or DEVELOPER role required")
    })
  })

  // ==========================================================================
  // submitLessonProposal
  // ==========================================================================

  describe("submitLessonProposal", () => {
    it("creates lesson proposal with parentChapterId", async () => {
      mockAdminSession()
      vi.mocked(db.catalogProposal.create).mockResolvedValue({
        id: "p-3",
      } as any)

      const result = await submitLessonProposal("chapter-1", {
        name: "Newton's Laws",
        durationMinutes: 45,
      })

      expect(result.success).toBe(true)
      expect(result.data).toEqual({ id: "p-3" })
      expect(db.catalogProposal.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          type: "LESSON",
          parentChapterId: "chapter-1",
          status: "SUBMITTED",
        }),
      })
    })

    it("requires ADMIN/DEVELOPER role", async () => {
      mockUnauthorizedSession("STUDENT")

      const result = await submitLessonProposal("chapter-1", {
        name: "Lesson 1",
      })

      expect(result.success).toBe(false)
      expect(result.error).toContain("ADMIN or DEVELOPER role required")
    })
  })

  // ==========================================================================
  // getMyProposals
  // ==========================================================================

  describe("getMyProposals", () => {
    it("returns proposals for current school", async () => {
      mockAdminSession()

      const mockProposals = [
        {
          id: "p-1",
          type: "SUBJECT",
          status: "SUBMITTED",
          data: { name: "Physics" },
          createdAt: new Date("2026-01-01"),
          reviewNotes: null,
          rejectionReason: null,
        },
      ]
      vi.mocked(db.catalogProposal.findMany).mockResolvedValue(
        mockProposals as any
      )

      const result = await getMyProposals()

      expect(result.success).toBe(true)
      expect(result.data).toHaveLength(1)
      expect(result.data![0].createdAt).toBe("2026-01-01T00:00:00.000Z")
      expect(db.catalogProposal.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { schoolId: "school-1" },
        })
      )
    })

    it("requires ADMIN/DEVELOPER role", async () => {
      mockUnauthorizedSession("TEACHER")

      const result = await getMyProposals()

      expect(result.success).toBe(false)
      expect(result.error).toContain("ADMIN or DEVELOPER role required")
    })
  })

  // ==========================================================================
  // updateProposal
  // ==========================================================================

  describe("updateProposal", () => {
    it("updates DRAFT proposal and re-submits", async () => {
      mockAdminSession()
      vi.mocked(db.catalogProposal.findFirst).mockResolvedValue({
        status: "DRAFT",
        type: "SUBJECT",
      } as any)
      vi.mocked(db.catalogProposal.update).mockResolvedValue({} as any)

      const result = await updateProposal("p-1", {
        name: "Updated Physics",
        department: "Natural Sciences",
      })

      expect(result).toEqual({ success: true })
      expect(db.catalogProposal.update).toHaveBeenCalledWith({
        where: { id: "p-1" },
        data: expect.objectContaining({
          status: "SUBMITTED",
          rejectionReason: null,
          reviewNotes: null,
        }),
      })
      expect(revalidatePath).toHaveBeenCalledWith("/subjects")
    })

    it("updates REJECTED proposal and re-submits", async () => {
      mockAdminSession()
      vi.mocked(db.catalogProposal.findFirst).mockResolvedValue({
        status: "REJECTED",
        type: "CHAPTER",
      } as any)
      vi.mocked(db.catalogProposal.update).mockResolvedValue({} as any)

      const result = await updateProposal("p-2", {
        name: "Updated Chapter",
      })

      expect(result).toEqual({ success: true })
    })

    it("validates data against proposal type schema (rejects invalid)", async () => {
      mockAdminSession()
      vi.mocked(db.catalogProposal.findFirst).mockResolvedValue({
        status: "DRAFT",
        type: "SUBJECT",
      } as any)

      // Missing required "department" field for SUBJECT type
      const result = await updateProposal("p-1", {
        name: "Physics",
      })

      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
      expect(db.catalogProposal.update).not.toHaveBeenCalled()
    })

    it("returns error for non-existent proposal", async () => {
      mockAdminSession()
      vi.mocked(db.catalogProposal.findFirst).mockResolvedValue(null)

      const result = await updateProposal("nonexistent", { name: "X" })

      expect(result).toEqual({ success: false, error: "Proposal not found" })
    })

    it("returns error for SUBMITTED proposal (only DRAFT/REJECTED editable)", async () => {
      mockAdminSession()
      vi.mocked(db.catalogProposal.findFirst).mockResolvedValue({
        status: "SUBMITTED",
        type: "SUBJECT",
      } as any)

      const result = await updateProposal("p-1", { name: "X" })

      expect(result).toEqual({
        success: false,
        error: "Only DRAFT or REJECTED proposals can be edited",
      })
      expect(db.catalogProposal.update).not.toHaveBeenCalled()
    })

    it("requires ADMIN/DEVELOPER role", async () => {
      mockUnauthorizedSession("STUDENT")

      const result = await updateProposal("p-1", { name: "X" })

      expect(result.success).toBe(false)
      expect(result.error).toContain("ADMIN or DEVELOPER role required")
    })
  })
})
