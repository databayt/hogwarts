// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { revalidatePath } from "next/cache"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import { requireDeveloper } from "@/components/saas-dashboard/lib/operator-auth"

import {
  createCatalogMaterial,
  deleteCatalogMaterial,
  updateCatalogMaterial,
} from "../material-actions"

// ============================================================================
// Mocks
// ============================================================================

vi.mock("@/components/saas-dashboard/lib/operator-auth", () => ({
  requireDeveloper: vi.fn(),
}))

vi.mock("@/lib/db", () => ({
  db: {
    catalogMaterial: {
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

function makeMaterialFormData(
  overrides: Record<string, string> = {}
): FormData {
  const data = new FormData()
  const defaults: Record<string, string> = {
    title: "Test Material",
    slug: "test-material",
    type: "WORKSHEET",
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

describe("Material Actions", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ==========================================================================
  // createCatalogMaterial
  // ==========================================================================

  describe("createCatalogMaterial", () => {
    it("creates material with valid FormData", async () => {
      mockDeveloperAuth()
      vi.mocked(db.catalogMaterial.create).mockResolvedValue({
        id: "material-1",
      } as any)

      const formData = makeMaterialFormData()
      const result = await createCatalogMaterial(formData)

      expect(result).toEqual({ success: true, data: { id: "material-1" } })
      expect(db.catalogMaterial.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          title: "Test Material",
          type: "WORKSHEET",
          approvalStatus: "APPROVED",
          visibility: "PUBLIC",
          status: "PUBLISHED",
        }),
      })
      expect(revalidatePath).toHaveBeenCalledWith("/catalog/materials")
    })

    it("requires DEVELOPER role", async () => {
      mockUnauthorized()

      const formData = makeMaterialFormData()
      const result = await createCatalogMaterial(formData)

      expect(result).toEqual({
        success: false,
        error: "Unauthorized: DEVELOPER role required",
      })
      expect(db.catalogMaterial.create).not.toHaveBeenCalled()
    })

    it("sets approvalStatus to APPROVED regardless of client input", async () => {
      mockDeveloperAuth()
      vi.mocked(db.catalogMaterial.create).mockResolvedValue({
        id: "material-2",
      } as any)

      const formData = makeMaterialFormData({ approvalStatus: "PENDING" })
      const result = await createCatalogMaterial(formData)

      expect(result.success).toBe(true)
      expect(db.catalogMaterial.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          approvalStatus: "APPROVED",
          status: "PUBLISHED",
        }),
      })
    })

    it("returns error on Zod validation failure", async () => {
      mockDeveloperAuth()

      // Missing required title
      const formData = new FormData()
      formData.set("title", "")
      const result = await createCatalogMaterial(formData)

      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
      expect(db.catalogMaterial.create).not.toHaveBeenCalled()
    })

    it("returns error on database failure", async () => {
      mockDeveloperAuth()
      vi.mocked(db.catalogMaterial.create).mockRejectedValue(
        new Error("Unique constraint violation")
      )

      const formData = makeMaterialFormData()
      const result = await createCatalogMaterial(formData)

      expect(result).toEqual({
        success: false,
        error: "Unique constraint violation",
      })
    })

    it("handles numeric fields (fileSize, pageCount)", async () => {
      mockDeveloperAuth()
      vi.mocked(db.catalogMaterial.create).mockResolvedValue({
        id: "material-3",
      } as any)

      const formData = makeMaterialFormData({
        fileSize: "1024",
        pageCount: "10",
      })
      const result = await createCatalogMaterial(formData)

      expect(result.success).toBe(true)
      expect(db.catalogMaterial.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          fileSize: 1024,
          pageCount: 10,
        }),
      })
    })
  })

  // ==========================================================================
  // updateCatalogMaterial
  // ==========================================================================

  describe("updateCatalogMaterial", () => {
    it("updates material by id", async () => {
      mockDeveloperAuth()
      vi.mocked(db.catalogMaterial.findUnique).mockResolvedValue({
        id: "material-1",
      } as any)
      vi.mocked(db.catalogMaterial.update).mockResolvedValue({
        id: "material-1",
      } as any)

      const formData = makeMaterialFormData({ title: "Updated Title" })
      const result = await updateCatalogMaterial("material-1", formData)

      expect(result).toEqual({ success: true, data: { id: "material-1" } })
      expect(db.catalogMaterial.update).toHaveBeenCalledWith({
        where: { id: "material-1" },
        data: expect.objectContaining({ title: "Updated Title" }),
      })
      expect(revalidatePath).toHaveBeenCalledWith("/catalog/materials")
    })

    it("returns error for non-existent id", async () => {
      mockDeveloperAuth()
      vi.mocked(db.catalogMaterial.findUnique).mockResolvedValue(null)

      const formData = makeMaterialFormData()
      const result = await updateCatalogMaterial("nonexistent", formData)

      expect(result).toEqual({
        success: false,
        error: "Material not found",
      })
      expect(db.catalogMaterial.update).not.toHaveBeenCalled()
    })

    it("strips approvalStatus from update data", async () => {
      mockDeveloperAuth()
      vi.mocked(db.catalogMaterial.findUnique).mockResolvedValue({
        id: "material-1",
      } as any)
      vi.mocked(db.catalogMaterial.update).mockResolvedValue({
        id: "material-1",
      } as any)

      const formData = makeMaterialFormData({
        approvalStatus: "PENDING",
        visibility: "PRIVATE",
        status: "DRAFT",
      })
      const result = await updateCatalogMaterial("material-1", formData)

      expect(result.success).toBe(true)
      const updateCall = vi.mocked(db.catalogMaterial.update).mock.calls[0][0]
      expect(updateCall.data).not.toHaveProperty("approvalStatus")
      expect(updateCall.data).not.toHaveProperty("visibility")
      expect(updateCall.data).not.toHaveProperty("status")
    })

    it("requires DEVELOPER role", async () => {
      mockUnauthorized()

      const formData = makeMaterialFormData()
      const result = await updateCatalogMaterial("material-1", formData)

      expect(result).toEqual({
        success: false,
        error: "Unauthorized: DEVELOPER role required",
      })
      expect(db.catalogMaterial.findUnique).not.toHaveBeenCalled()
    })

    it("returns error on database failure", async () => {
      mockDeveloperAuth()
      vi.mocked(db.catalogMaterial.findUnique).mockResolvedValue({
        id: "material-1",
      } as any)
      vi.mocked(db.catalogMaterial.update).mockRejectedValue(
        new Error("Database connection lost")
      )

      const formData = makeMaterialFormData()
      const result = await updateCatalogMaterial("material-1", formData)

      expect(result).toEqual({
        success: false,
        error: "Database connection lost",
      })
    })
  })

  // ==========================================================================
  // deleteCatalogMaterial
  // ==========================================================================

  describe("deleteCatalogMaterial", () => {
    it("deletes material by id", async () => {
      mockDeveloperAuth()
      vi.mocked(db.catalogMaterial.findUnique).mockResolvedValue({
        id: "material-1",
      } as any)
      vi.mocked(db.catalogMaterial.delete).mockResolvedValue({} as any)

      const result = await deleteCatalogMaterial("material-1")

      expect(result).toEqual({ success: true })
      expect(db.catalogMaterial.delete).toHaveBeenCalledWith({
        where: { id: "material-1" },
      })
      expect(revalidatePath).toHaveBeenCalledWith("/catalog/materials")
    })

    it("returns error for non-existent id", async () => {
      mockDeveloperAuth()
      vi.mocked(db.catalogMaterial.findUnique).mockResolvedValue(null)

      const result = await deleteCatalogMaterial("nonexistent")

      expect(result).toEqual({
        success: false,
        error: "Material not found",
      })
      expect(db.catalogMaterial.delete).not.toHaveBeenCalled()
    })

    it("requires DEVELOPER role", async () => {
      mockUnauthorized()

      const result = await deleteCatalogMaterial("material-1")

      expect(result).toEqual({
        success: false,
        error: "Unauthorized: DEVELOPER role required",
      })
      expect(db.catalogMaterial.findUnique).not.toHaveBeenCalled()
    })

    it("returns error on database failure", async () => {
      mockDeveloperAuth()
      vi.mocked(db.catalogMaterial.findUnique).mockResolvedValue({
        id: "material-1",
      } as any)
      vi.mocked(db.catalogMaterial.delete).mockRejectedValue(
        new Error("Foreign key constraint")
      )

      const result = await deleteCatalogMaterial("material-1")

      expect(result).toEqual({
        success: false,
        error: "Foreign key constraint",
      })
    })
  })
})
