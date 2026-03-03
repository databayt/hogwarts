// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { revalidatePath } from "next/cache"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"

import * as domains from "../actions"

// ============================================================================
// Mocks
// ============================================================================

vi.mock("@/lib/db", () => ({
  db: {
    domainRequest: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
  },
}))

vi.mock("@/components/saas-dashboard/lib/operator-auth", () => ({
  requireOperator: vi.fn().mockResolvedValue({ userId: "u1" }),
  requireNotImpersonating: vi.fn().mockResolvedValue(undefined),
  logOperatorAudit: vi.fn().mockResolvedValue(undefined),
}))

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}))

// ============================================================================
// Tests
// ============================================================================

describe("domains/actions.ts", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ==========================================================================
  // domainCreate
  // ==========================================================================

  describe("domainCreate", () => {
    it("creates a domain request", async () => {
      vi.mocked(db.domainRequest.findFirst).mockResolvedValue(null)
      vi.mocked(db.domainRequest.create).mockResolvedValue({
        id: "d1",
        schoolId: "s1",
        domain: "example.com",
        status: "pending",
      } as any)

      const result = await domains.domainCreate({
        schoolId: "s1",
        domain: "example.com",
        notes: "Test domain",
      })

      expect(result).toEqual({
        success: true,
        data: expect.objectContaining({
          id: "d1",
          domain: "example.com",
          status: "pending",
        }),
      })
      expect(revalidatePath).toHaveBeenCalledWith("/saas-dashboard/domains")
    })

    it("rejects duplicate domain", async () => {
      vi.mocked(db.domainRequest.findFirst).mockResolvedValue({
        id: "existing",
        domain: "example.com",
        status: "approved",
      } as any)

      const result = await domains.domainCreate({
        schoolId: "s1",
        domain: "example.com",
      })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.message).toBe("Domain is already in use")
      }
      expect(db.domainRequest.create).not.toHaveBeenCalled()
    })

    it("rejects invalid domain format", async () => {
      const result = await domains.domainCreate({
        schoolId: "s1",
        domain: "not valid domain!!",
      })

      expect(result.success).toBe(false)
      expect(db.domainRequest.create).not.toHaveBeenCalled()
    })
  })

  // ==========================================================================
  // domainApprove
  // ==========================================================================

  describe("domainApprove", () => {
    it("approves a domain request", async () => {
      vi.mocked(db.domainRequest.update).mockResolvedValue({
        id: "d1",
        schoolId: "s1",
        domain: "example.com",
        status: "approved",
      } as any)

      const result = await domains.domainApprove({
        id: "d1",
        notes: "Approved",
      })

      expect(result).toEqual({
        success: true,
        data: expect.objectContaining({ id: "d1", status: "approved" }),
      })
      expect(db.domainRequest.update).toHaveBeenCalledWith({
        where: { id: "d1" },
        data: { status: "approved", notes: "Approved" },
      })
    })

    it("handles db error", async () => {
      vi.mocked(db.domainRequest.update).mockRejectedValue(
        new Error("Not found")
      )

      const result = await domains.domainApprove({ id: "nope" })
      expect(result.success).toBe(false)
    })
  })

  // ==========================================================================
  // domainReject
  // ==========================================================================

  describe("domainReject", () => {
    it("rejects a domain request with correct status", async () => {
      vi.mocked(db.domainRequest.update).mockResolvedValue({
        id: "d1",
        schoolId: "s1",
        domain: "example.com",
        status: "rejected",
      } as any)

      const result = await domains.domainReject({
        id: "d1",
        notes: "Not allowed",
      })

      expect(result).toEqual({
        success: true,
        data: expect.objectContaining({ id: "d1", status: "rejected" }),
      })
      expect(db.domainRequest.update).toHaveBeenCalledWith({
        where: { id: "d1" },
        data: { status: "rejected", notes: "Not allowed" },
      })
    })

    it("handles db error", async () => {
      vi.mocked(db.domainRequest.update).mockRejectedValue(
        new Error("Not found")
      )

      const result = await domains.domainReject({ id: "nope" })
      expect(result.success).toBe(false)
    })
  })

  // ==========================================================================
  // domainVerify
  // ==========================================================================

  describe("domainVerify", () => {
    it("returns verified false when DNS not configured", async () => {
      vi.mocked(db.domainRequest.findUnique).mockResolvedValue({
        id: "d1",
        schoolId: "s1",
        domain: "example.com",
        status: "approved",
      } as any)

      // No VERCEL_CNAME_TARGET or PLATFORM_IPS env vars
      const result = await domains.domainVerify({ id: "d1" })

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.domainRequest).toEqual(
          expect.objectContaining({ id: "d1", domain: "example.com" })
        )
      }
    })

    it("returns error for non-existent domain", async () => {
      vi.mocked(db.domainRequest.findUnique).mockResolvedValue(null)

      const result = await domains.domainVerify({ id: "nope" })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.message).toBe("Domain request not found")
      }
    })

    it("handles db error", async () => {
      vi.mocked(db.domainRequest.findUnique).mockRejectedValue(
        new Error("Connection lost")
      )

      const result = await domains.domainVerify({ id: "d1" })
      expect(result.success).toBe(false)
    })
  })

  // ==========================================================================
  // getDomains
  // ==========================================================================

  describe("getDomains", () => {
    it("returns paginated domains", async () => {
      vi.mocked(db.domainRequest.findMany).mockResolvedValue([
        {
          id: "d1",
          domain: "test.com",
          status: "pending",
          createdAt: new Date("2026-01-01"),
          notes: null,
          school: { id: "s1", name: "Test School" },
        },
      ] as any)
      vi.mocked(db.domainRequest.count).mockResolvedValue(1)

      const result = await domains.getDomains({
        page: 1,
        perPage: 10,
      })

      expect(result.success).toBe(true)
      expect(result.data).toHaveLength(1)
      expect(result.total).toBe(1)
      expect(result.data[0]).toEqual(
        expect.objectContaining({
          id: "d1",
          domain: "test.com",
          schoolName: "Test School",
          status: "pending",
        })
      )
    })

    it("applies status filter", async () => {
      vi.mocked(db.domainRequest.findMany).mockResolvedValue([])
      vi.mocked(db.domainRequest.count).mockResolvedValue(0)

      await domains.getDomains({
        page: 1,
        perPage: 10,
        status: "approved",
      })

      expect(db.domainRequest.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: "approved" }),
        })
      )
    })

    it("applies search filter", async () => {
      vi.mocked(db.domainRequest.findMany).mockResolvedValue([])
      vi.mocked(db.domainRequest.count).mockResolvedValue(0)

      await domains.getDomains({
        page: 1,
        perPage: 10,
        search: "test",
      })

      expect(db.domainRequest.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.any(Array),
          }),
        })
      )
    })

    it("returns empty on auth error", async () => {
      const { requireOperator } =
        await import("@/components/saas-dashboard/lib/operator-auth")
      vi.mocked(requireOperator).mockRejectedValueOnce(new Error("Forbidden"))

      const result = await domains.getDomains({ page: 1, perPage: 10 })

      expect(result.success).toBe(false)
      expect(result.data).toEqual([])
      expect(result.total).toBe(0)
    })
  })
})
