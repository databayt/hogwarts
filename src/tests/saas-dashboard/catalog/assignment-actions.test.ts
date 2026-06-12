// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { revalidatePath } from "next/cache"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import {
  createAssignment,
  deleteAssignment,
  updateAssignment,
} from "@/components/saas-dashboard/catalog/assignment-actions"
import { requireDeveloper } from "@/components/saas-dashboard/lib/operator-auth"

// ============================================================================
// Mocks
// ============================================================================

vi.mock("@/components/saas-dashboard/lib/operator-auth", () => ({
  requireDeveloper: vi.fn(),
}))

vi.mock("@/lib/db", () => ({
  db: {
    assignment: {
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

function mockDeveloperAuth() {
  vi.mocked(requireDeveloper).mockResolvedValue({
    user: { id: "dev-1", role: "DEVELOPER" },
  } as any)
}

function mockUnauthorized() {
  vi.mocked(requireDeveloper).mockRejectedValue(
    new Error("Unauthorized: DEVELOPER role required")
  )
}

function makeAssignmentFormData(
  overrides: Record<string, string> = {}
): FormData {
  const data = new FormData()
  const defaults: Record<string, string> = {
    title: "Test Assignment",
    slug: "test-assignment",
    type: "HOMEWORK",
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

describe("Assignment Actions", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ==========================================================================
  // createAssignment
  // ==========================================================================

  describe("createAssignment", () => {
    it("creates assignment with valid FormData", async () => {
      mockDeveloperAuth()
      vi.mocked(db.assignment.create).mockResolvedValue({
        id: "assignment-1",
      } as any)

      const formData = makeAssignmentFormData()
      const result = await createAssignment(formData)

      expect(result).toEqual({
        success: true,
        data: { id: "assignment-1" },
      })
      expect(db.assignment.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          title: "Test Assignment",
          approvalStatus: "APPROVED",
          visibility: "PUBLIC",
          status: "PUBLISHED",
        }),
      })
      expect(revalidatePath).toHaveBeenCalledWith("/catalog/assignments")
    })

    it("requires DEVELOPER role", async () => {
      mockUnauthorized()

      const formData = makeAssignmentFormData()
      const result = await createAssignment(formData)

      expect(result).toEqual({
        success: false,
        error: "Unauthorized: DEVELOPER role required",
      })
      expect(db.assignment.create).not.toHaveBeenCalled()
    })

    it("sets approvalStatus to APPROVED regardless of client input", async () => {
      mockDeveloperAuth()
      vi.mocked(db.assignment.create).mockResolvedValue({
        id: "assignment-2",
      } as any)

      const formData = makeAssignmentFormData({ approvalStatus: "PENDING" })
      const result = await createAssignment(formData)

      expect(result.success).toBe(true)
      expect(db.assignment.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          approvalStatus: "APPROVED",
          status: "PUBLISHED",
        }),
      })
    })

    it("handles totalPoints and estimatedTime number conversion", async () => {
      mockDeveloperAuth()
      vi.mocked(db.assignment.create).mockResolvedValue({
        id: "assignment-3",
      } as any)

      const formData = makeAssignmentFormData({
        totalPoints: "100",
        estimatedTime: "45",
      })
      const result = await createAssignment(formData)

      expect(result.success).toBe(true)
      expect(db.assignment.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          totalPoints: 100,
          estimatedTime: 45,
        }),
      })
    })

    it("returns error on Zod validation failure", async () => {
      mockDeveloperAuth()

      // Missing required title
      const formData = new FormData()
      formData.set("title", "")
      const result = await createAssignment(formData)

      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
      expect(db.assignment.create).not.toHaveBeenCalled()
    })

    it("returns error on database failure", async () => {
      mockDeveloperAuth()
      vi.mocked(db.assignment.create).mockRejectedValue(
        new Error("Unique constraint violation")
      )

      const formData = makeAssignmentFormData()
      const result = await createAssignment(formData)

      expect(result).toEqual({
        success: false,
        error: "Unique constraint violation",
      })
    })
  })

  // ==========================================================================
  // updateAssignment
  // ==========================================================================

  describe("updateAssignment", () => {
    it("updates assignment by id", async () => {
      mockDeveloperAuth()
      vi.mocked(db.assignment.findUnique).mockResolvedValue({
        id: "assignment-1",
      } as any)
      vi.mocked(db.assignment.update).mockResolvedValue({
        id: "assignment-1",
      } as any)

      const formData = makeAssignmentFormData({ title: "Updated Title" })
      const result = await updateAssignment("assignment-1", formData)

      expect(result).toEqual({
        success: true,
        data: { id: "assignment-1" },
      })
      expect(db.assignment.update).toHaveBeenCalledWith({
        where: { id: "assignment-1" },
        data: expect.objectContaining({ title: "Updated Title" }),
      })
      expect(revalidatePath).toHaveBeenCalledWith("/catalog/assignments")
    })

    it("returns error for non-existent id", async () => {
      mockDeveloperAuth()
      vi.mocked(db.assignment.findUnique).mockResolvedValue(null)

      const formData = makeAssignmentFormData()
      const result = await updateAssignment("nonexistent", formData)

      expect(result).toEqual({
        success: false,
        error: "assignment_not_found",
      })
      expect(db.assignment.update).not.toHaveBeenCalled()
    })

    it("strips approvalStatus, visibility, and status from update data", async () => {
      mockDeveloperAuth()
      vi.mocked(db.assignment.findUnique).mockResolvedValue({
        id: "assignment-1",
      } as any)
      vi.mocked(db.assignment.update).mockResolvedValue({
        id: "assignment-1",
      } as any)

      const formData = makeAssignmentFormData({
        approvalStatus: "PENDING",
        visibility: "PRIVATE",
        status: "DRAFT",
      })
      const result = await updateAssignment("assignment-1", formData)

      expect(result.success).toBe(true)
      const updateCall = vi.mocked(db.assignment.update).mock.calls[0][0]
      expect(updateCall.data).not.toHaveProperty("approvalStatus")
      expect(updateCall.data).not.toHaveProperty("visibility")
      expect(updateCall.data).not.toHaveProperty("status")
    })

    it("requires DEVELOPER role", async () => {
      mockUnauthorized()

      const formData = makeAssignmentFormData()
      const result = await updateAssignment("assignment-1", formData)

      expect(result).toEqual({
        success: false,
        error: "Unauthorized: DEVELOPER role required",
      })
      expect(db.assignment.findUnique).not.toHaveBeenCalled()
    })

    it("returns error on database failure", async () => {
      mockDeveloperAuth()
      vi.mocked(db.assignment.findUnique).mockResolvedValue({
        id: "assignment-1",
      } as any)
      vi.mocked(db.assignment.update).mockRejectedValue(
        new Error("Database connection lost")
      )

      const formData = makeAssignmentFormData()
      const result = await updateAssignment("assignment-1", formData)

      expect(result).toEqual({
        success: false,
        error: "Database connection lost",
      })
    })
  })

  // ==========================================================================
  // deleteAssignment
  // ==========================================================================

  describe("deleteAssignment", () => {
    it("deletes assignment by id", async () => {
      mockDeveloperAuth()
      vi.mocked(db.assignment.findUnique).mockResolvedValue({
        id: "assignment-1",
      } as any)
      vi.mocked(db.assignment.delete).mockResolvedValue({} as any)

      const result = await deleteAssignment("assignment-1")

      expect(result).toEqual({ success: true })
      expect(db.assignment.delete).toHaveBeenCalledWith({
        where: { id: "assignment-1" },
      })
      expect(revalidatePath).toHaveBeenCalledWith("/catalog/assignments")
    })

    it("returns error for non-existent id", async () => {
      mockDeveloperAuth()
      vi.mocked(db.assignment.findUnique).mockResolvedValue(null)

      const result = await deleteAssignment("nonexistent")

      expect(result).toEqual({
        success: false,
        error: "assignment_not_found",
      })
      expect(db.assignment.delete).not.toHaveBeenCalled()
    })

    it("requires DEVELOPER role", async () => {
      mockUnauthorized()

      const result = await deleteAssignment("assignment-1")

      expect(result).toEqual({
        success: false,
        error: "Unauthorized: DEVELOPER role required",
      })
      expect(db.assignment.findUnique).not.toHaveBeenCalled()
    })

    it("returns error on database failure", async () => {
      mockDeveloperAuth()
      vi.mocked(db.assignment.findUnique).mockResolvedValue({
        id: "assignment-1",
      } as any)
      vi.mocked(db.assignment.delete).mockRejectedValue(
        new Error("Foreign key constraint")
      )

      const result = await deleteAssignment("assignment-1")

      expect(result).toEqual({
        success: false,
        error: "Foreign key constraint",
      })
    })
  })
})
