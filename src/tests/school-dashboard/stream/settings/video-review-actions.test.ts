// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { auth } from "@/auth"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"

import { getPendingVideos, reviewVideo } from "@/components/stream/settings/video-review-actions"

vi.mock("@/lib/tenant-context", () => ({
  getTenantContext: vi.fn(),
}))

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}))

vi.mock("@/lib/db", () => ({
  db: {
    video: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
    },
  },
}))

const mockAuth = auth as unknown as ReturnType<typeof vi.fn>
const mockTenant = getTenantContext as ReturnType<typeof vi.fn>
const mockFindMany = db.video.findMany as ReturnType<typeof vi.fn>
const mockFindFirst = db.video.findFirst as ReturnType<typeof vi.fn>
const mockUpdate = db.video.update as ReturnType<typeof vi.fn>

beforeEach(() => {
  vi.clearAllMocks()
  mockTenant.mockResolvedValue({ schoolId: "school-1", subdomain: "demo" })
  mockFindMany.mockResolvedValue([])
  mockFindFirst.mockResolvedValue({ id: "v-1" })
  mockUpdate.mockResolvedValue({ id: "v-1" })
})

describe("getPendingVideos — auth", () => {
  it("returns [] when unauthenticated", async () => {
    mockAuth.mockResolvedValueOnce(null)
    const result = await getPendingVideos()
    expect(result).toEqual([])
    expect(mockFindMany).not.toHaveBeenCalled()
  })

  it.each(["TEACHER", "STUDENT", "GUARDIAN", "ACCOUNTANT", "STAFF"] as const)(
    "denies role %s",
    async (role) => {
      mockAuth.mockResolvedValueOnce({ user: { id: "u-1", role } })
      const result = await getPendingVideos()
      expect(result).toEqual([])
      expect(mockFindMany).not.toHaveBeenCalled()
    }
  )

  it.each(["ADMIN", "DEVELOPER"] as const)("permits role %s", async (role) => {
    mockAuth.mockResolvedValueOnce({ user: { id: "u-1", role } })
    await getPendingVideos()
    expect(mockFindMany).toHaveBeenCalledOnce()
  })

  it("returns [] without school context", async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: "u-1", role: "ADMIN" } })
    mockTenant.mockResolvedValueOnce({ schoolId: null, subdomain: null })
    const result = await getPendingVideos()
    expect(result).toEqual([])
    expect(mockFindMany).not.toHaveBeenCalled()
  })
})

describe("getPendingVideos — query", () => {
  beforeEach(() => {
    mockAuth.mockResolvedValue({ user: { id: "u-1", role: "ADMIN" } })
  })

  it("scopes by current schoolId AND status PENDING", async () => {
    await getPendingVideos()
    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { schoolId: "school-1", approvalStatus: "PENDING" },
      })
    )
  })

  it("orders by createdAt asc (oldest first)", async () => {
    await getPendingVideos()
    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ orderBy: { createdAt: "asc" } })
    )
  })
})

describe("reviewVideo — auth", () => {
  it.each(["TEACHER", "STUDENT", "GUARDIAN"] as const)(
    "denies role %s",
    async (role) => {
      mockAuth.mockResolvedValueOnce({ user: { id: "u-1", role } })
      const result = await reviewVideo("v-1", "APPROVED")
      expect(result.status).toBe("error")
      expect(mockUpdate).not.toHaveBeenCalled()
    }
  )

  it("rejects when no school context", async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: "u-1", role: "ADMIN" } })
    mockTenant.mockResolvedValueOnce({ schoolId: null, subdomain: null })
    const result = await reviewVideo("v-1", "APPROVED")
    expect(result.status).toBe("error")
  })

  it("rejects when video not in current school", async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: "u-1", role: "ADMIN" } })
    mockFindFirst.mockResolvedValueOnce(null)
    const result = await reviewVideo("v-1", "APPROVED")
    expect(result.status).toBe("error")
    expect(mockUpdate).not.toHaveBeenCalled()
  })
})

describe("reviewVideo — APPROVED path", () => {
  beforeEach(() => {
    mockAuth.mockResolvedValue({ user: { id: "admin-7", role: "ADMIN" } })
  })

  it("scopes findFirst by id AND schoolId", async () => {
    await reviewVideo("v-1", "APPROVED")
    expect(mockFindFirst).toHaveBeenCalledWith({
      where: { id: "v-1", schoolId: "school-1" },
      select: { id: true },
    })
  })

  it("sets approvedBy + approvedAt + nulls rejectionReason", async () => {
    await reviewVideo("v-1", "APPROVED")
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "v-1" },
        data: expect.objectContaining({
          approvalStatus: "APPROVED",
          approvedBy: "admin-7",
          rejectionReason: null,
        }),
      })
    )
  })
})

describe("reviewVideo — REJECTED path", () => {
  beforeEach(() => {
    mockAuth.mockResolvedValue({ user: { id: "admin-7", role: "ADMIN" } })
  })

  it("clears approvedBy/approvedAt and stores rejectionReason", async () => {
    await reviewVideo("v-1", "REJECTED", "Audio quality too low")
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          approvalStatus: "REJECTED",
          approvedBy: null,
          approvedAt: null,
          rejectionReason: "Audio quality too low",
        }),
      })
    )
  })

  it("accepts undefined rejectionReason without throwing", async () => {
    const result = await reviewVideo("v-1", "REJECTED")
    expect(result.status).toBe("success")
  })
})
