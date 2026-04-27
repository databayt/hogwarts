// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { auth } from "@/auth"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"

import { listVehicles } from "../actions/vehicles"

// Mock dependencies
vi.mock("@/lib/db", () => ({
  db: {
    vehicle: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    driver: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
    },
    route: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
    },
    routeAssignment: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      count: vi.fn(),
    },
  },
}))

vi.mock("@/auth", () => ({
  auth: vi.fn(),
}))

vi.mock("@/lib/tenant-context", () => ({
  getTenantContext: vi.fn(),
}))

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}))

describe("Transportation multi-tenant isolation", () => {
  const SCHOOL_A = "school-A"
  const SCHOOL_B = "school-B"

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("listVehicles", () => {
    it("scopes findMany by schoolId from tenant context", async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: "user-A", role: "ADMIN" },
      } as any)
      vi.mocked(getTenantContext).mockResolvedValue({
        schoolId: SCHOOL_A,
        requestId: null,
        role: "ADMIN",
        isPlatformAdmin: false,
      } as any)
      vi.mocked(db.vehicle.findMany).mockResolvedValue([])

      await listVehicles()

      expect(db.vehicle.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            schoolId: SCHOOL_A,
            deletedAt: null,
          }),
        })
      )
      // Critical: never queries SCHOOL_B
      expect(db.vehicle.findMany).not.toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ schoolId: SCHOOL_B }),
        })
      )
    })

    it("returns MISSING_SCHOOL when no schoolId in context", async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: "user-A", role: "ADMIN" },
      } as any)
      vi.mocked(getTenantContext).mockResolvedValue({
        schoolId: null,
        requestId: null,
        role: "ADMIN",
        isPlatformAdmin: false,
      } as any)

      const result = await listVehicles()

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBe("MISSING_SCHOOL")
      }
      expect(db.vehicle.findMany).not.toHaveBeenCalled()
    })

    it("returns NOT_AUTHENTICATED when no session", async () => {
      vi.mocked(auth).mockResolvedValue(null as any)
      vi.mocked(getTenantContext).mockResolvedValue({
        schoolId: SCHOOL_A,
        requestId: null,
        role: null,
        isPlatformAdmin: false,
      } as any)

      const result = await listVehicles()

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBe("NOT_AUTHENTICATED")
      }
    })

    it("returns UNAUTHORIZED when role lacks read_school permission", async () => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: "user-A", role: "STUDENT" },
      } as any)
      vi.mocked(getTenantContext).mockResolvedValue({
        schoolId: SCHOOL_A,
        requestId: null,
        role: "STUDENT",
        isPlatformAdmin: false,
      } as any)

      const result = await listVehicles()

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBe("UNAUTHORIZED")
      }
      expect(db.vehicle.findMany).not.toHaveBeenCalled()
    })
  })

  describe("DEVELOPER bypass", () => {
    it("DEVELOPER without schoolId is still denied (requireContext returns MISSING_SCHOOL)", async () => {
      // requireContext requires schoolId regardless of role — DEVELOPER bypass
      // happens at the permission-matrix level, not at the schoolId check.
      // This is intentional: DEVELOPER must impersonate a school to query data.
      vi.mocked(auth).mockResolvedValue({
        user: { id: "dev-1", role: "DEVELOPER" },
      } as any)
      vi.mocked(getTenantContext).mockResolvedValue({
        schoolId: null,
        requestId: null,
        role: "DEVELOPER",
        isPlatformAdmin: true,
      } as any)

      const result = await listVehicles()

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBe("MISSING_SCHOOL")
      }
    })
  })
})
