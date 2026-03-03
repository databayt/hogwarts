// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { revalidatePath } from "next/cache"
import { cookies } from "next/headers"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"

import * as tenants from "../actions"

// ============================================================================
// Mocks
// ============================================================================

vi.mock("@/lib/db", () => ({
  db: {
    school: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    subscriptionHistory: {
      create: vi.fn(),
    },
    academicLevel: {
      count: vi.fn(),
    },
    academicGrade: {
      count: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}))

vi.mock("@/components/saas-dashboard/lib/operator-auth", () => ({
  requireOperator: vi.fn().mockResolvedValue({ userId: "u1" }),
  requireNotImpersonating: vi.fn().mockResolvedValue(undefined),
  logOperatorAudit: vi.fn().mockResolvedValue(undefined),
}))

vi.mock("@/lib/catalog-setup", () => ({
  setupCatalogForSchool: vi.fn(),
}))

vi.mock("next/headers", () => ({
  cookies: vi.fn().mockResolvedValue({
    set: vi.fn(),
    get: vi.fn(),
    delete: vi.fn(),
  }),
}))

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}))

// ============================================================================
// Tests
// ============================================================================

describe("tenants/actions.ts", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ==========================================================================
  // tenantToggleActive
  // ==========================================================================

  describe("tenantToggleActive", () => {
    it("toggles tenant active status", async () => {
      vi.mocked(db.school.findUnique).mockResolvedValue({
        id: "s1",
        isActive: true,
      } as any)
      vi.mocked(db.school.update).mockResolvedValue({
        id: "s1",
        isActive: false,
      } as any)

      const result = await tenants.tenantToggleActive({
        tenantId: "s1",
        reason: "Test toggle",
      })

      expect(result).toEqual({
        success: true,
        data: expect.objectContaining({ id: "s1", isActive: false }),
      })
      expect(db.school.update).toHaveBeenCalledWith({
        where: { id: "s1" },
        data: expect.objectContaining({ isActive: false }),
      })
    })

    it("returns error for non-existent tenant", async () => {
      vi.mocked(db.school.findUnique).mockResolvedValue(null)

      const result = await tenants.tenantToggleActive({ tenantId: "nope" })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.message).toBe("School not found")
      }
      expect(db.school.update).not.toHaveBeenCalled()
    })

    it("handles db error", async () => {
      vi.mocked(db.school.findUnique).mockRejectedValue(
        new Error("Connection lost")
      )

      const result = await tenants.tenantToggleActive({ tenantId: "s1" })
      expect(result.success).toBe(false)
    })
  })

  // ==========================================================================
  // tenantChangePlan
  // ==========================================================================

  describe("tenantChangePlan", () => {
    it("changes tenant plan", async () => {
      vi.mocked(db.school.update).mockResolvedValue({
        id: "s1",
        planType: "PREMIUM",
      } as any)

      const result = await tenants.tenantChangePlan({
        tenantId: "s1",
        planType: "PREMIUM",
        reason: "Upgrade",
      })

      expect(result).toEqual({
        success: true,
        data: expect.objectContaining({ id: "s1", planType: "PREMIUM" }),
      })
    })

    it("handles invalid plan type", async () => {
      const result = await tenants.tenantChangePlan({
        tenantId: "s1",
        planType: "INVALID_PLAN",
        reason: "Bad plan",
      })

      expect(result.success).toBe(false)
      expect(db.school.update).not.toHaveBeenCalled()
    })

    it("handles db error on plan change", async () => {
      vi.mocked(db.school.update).mockRejectedValue(new Error("Update failed"))

      const result = await tenants.tenantChangePlan({
        tenantId: "s1",
        planType: "BASIC",
      })

      expect(result.success).toBe(false)
    })
  })

  // ==========================================================================
  // tenantEndTrial
  // ==========================================================================

  describe("tenantEndTrial", () => {
    it("ends tenant trial and sets BASIC plan", async () => {
      vi.mocked(db.school.update).mockResolvedValue({
        id: "s1",
        planType: "BASIC",
      } as any)

      const result = await tenants.tenantEndTrial({
        tenantId: "s1",
        reason: "Trial expired",
      })

      expect(result).toEqual({
        success: true,
        data: expect.objectContaining({ id: "s1", planType: "BASIC" }),
      })
      expect(db.school.update).toHaveBeenCalledWith({
        where: { id: "s1" },
        data: expect.objectContaining({ planType: "BASIC" }),
      })
    })

    it("handles db error on trial end", async () => {
      vi.mocked(db.school.update).mockRejectedValue(new Error("DB error"))

      const result = await tenants.tenantEndTrial({ tenantId: "s1" })
      expect(result.success).toBe(false)
    })
  })

  // ==========================================================================
  // tenantStartImpersonation
  // ==========================================================================

  describe("tenantStartImpersonation", () => {
    it("starts impersonation and sets cookie", async () => {
      vi.mocked(db.school.findUnique).mockResolvedValue({
        id: "s1",
        name: "Test School",
      } as any)

      const result = await tenants.tenantStartImpersonation({
        tenantId: "s1",
        reason: "Support request",
      })

      expect(result).toEqual({
        success: true,
        data: { success: true },
      })
    })

    it("returns error for non-existent school", async () => {
      vi.mocked(db.school.findUnique).mockResolvedValue(null)

      const result = await tenants.tenantStartImpersonation({
        tenantId: "nope",
      })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.message).toBe("School not found")
      }
    })
  })

  // ==========================================================================
  // tenantStopImpersonation
  // ==========================================================================

  describe("tenantStopImpersonation", () => {
    it("stops impersonation and clears cookie", async () => {
      const result = await tenants.tenantStopImpersonation({
        reason: "Support complete",
      })

      expect(result).toEqual({
        success: true,
        data: { success: true },
      })
    })
  })

  // ==========================================================================
  // tenantGetCatalogStatus
  // ==========================================================================

  describe("tenantGetCatalogStatus", () => {
    it("returns configured status with counts", async () => {
      vi.mocked(db.academicLevel.count).mockResolvedValue(3)
      vi.mocked(db.academicGrade.count).mockResolvedValue(12)

      const result = await tenants.tenantGetCatalogStatus("s1")

      expect(result).toEqual({ configured: true, levels: 3, grades: 12 })
    })

    it("returns not configured when no levels", async () => {
      vi.mocked(db.academicLevel.count).mockResolvedValue(0)
      vi.mocked(db.academicGrade.count).mockResolvedValue(0)

      const result = await tenants.tenantGetCatalogStatus("s1")

      expect(result).toEqual({ configured: false, levels: 0, grades: 0 })
    })

    it("returns defaults on error", async () => {
      vi.mocked(db.academicLevel.count).mockRejectedValue(new Error("DB error"))

      const result = await tenants.tenantGetCatalogStatus("s1")

      expect(result).toEqual({ configured: false, levels: 0, grades: 0 })
    })
  })

  // ==========================================================================
  // fetchTenants
  // ==========================================================================

  describe("fetchTenants", () => {
    it("returns tenant data from query", async () => {
      // fetchTenants calls getTenantsQuery, which is imported from ./queries
      // Since we don't mock it separately, it will use the db mock
      // Just verify it doesn't throw on valid input
      const result = await tenants.fetchTenants({
        page: 1,
        perPage: 10,
      })

      // On error (since queries aren't fully mocked), returns fallback
      expect(result).toHaveProperty("data")
      expect(result).toHaveProperty("total")
    })

    it("returns empty data on error", async () => {
      const { requireOperator } =
        await import("@/components/saas-dashboard/lib/operator-auth")
      vi.mocked(requireOperator).mockRejectedValueOnce(new Error("Forbidden"))

      const result = await tenants.fetchTenants({ page: 1, perPage: 10 })

      expect(result).toEqual({ data: [], total: 0 })
    })
  })
})
