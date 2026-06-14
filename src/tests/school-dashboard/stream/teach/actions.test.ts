// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { auth } from "@/auth"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"
import { getMyVideos, getTeacherStats } from "@/components/stream/teach/actions"

vi.mock("@/lib/tenant-context", () => ({
  getTenantContext: vi.fn(),
}))

vi.mock("@/lib/db", () => ({
  db: {
    video: {
      groupBy: vi.fn(),
      aggregate: vi.fn(),
      findMany: vi.fn(),
    },
  },
}))

const mockAuth = auth as unknown as ReturnType<typeof vi.fn>
const mockTenant = getTenantContext as ReturnType<typeof vi.fn>
const mockGroupBy = db.video.groupBy as ReturnType<typeof vi.fn>
const mockAggregate = db.video.aggregate as ReturnType<typeof vi.fn>
const mockFindMany = db.video.findMany as ReturnType<typeof vi.fn>

beforeEach(() => {
  vi.clearAllMocks()
  mockTenant.mockResolvedValue({ schoolId: "school-1", subdomain: "demo" })
  mockGroupBy.mockResolvedValue([])
  mockAggregate.mockResolvedValue({ _sum: { viewCount: 0 } })
  mockFindMany.mockResolvedValue([])
})

describe("getTeacherStats — guards", () => {
  it("returns zeros without session", async () => {
    mockAuth.mockResolvedValueOnce(null)
    const result = await getTeacherStats()
    expect(result).toEqual({
      totalVideos: 0,
      pendingVideos: 0,
      approvedVideos: 0,
      totalViews: 0,
    })
    expect(mockGroupBy).not.toHaveBeenCalled()
  })

  it("returns zeros without school context", async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: "u-1", role: "TEACHER" } })
    mockTenant.mockResolvedValueOnce({ schoolId: null, subdomain: null })
    const result = await getTeacherStats()
    expect(result.totalVideos).toBe(0)
    expect(mockGroupBy).not.toHaveBeenCalled()
  })
})

describe("getTeacherStats — query", () => {
  beforeEach(() => {
    mockAuth.mockResolvedValue({ user: { id: "t-9", role: "TEACHER" } })
  })

  it("scopes the groupBy + aggregate by current userId AND schoolId", async () => {
    await getTeacherStats()
    expect(mockGroupBy).toHaveBeenCalledWith(
      expect.objectContaining({
        by: ["approvalStatus"],
        where: { userId: "t-9", schoolId: "school-1" },
      })
    )
    expect(mockAggregate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: "t-9", schoolId: "school-1" },
      })
    )
  })

  it("aggregates viewCount sum scoped by userId+schoolId", async () => {
    await getTeacherStats()
    expect(mockAggregate).toHaveBeenCalledWith({
      where: { userId: "t-9", schoolId: "school-1" },
      _sum: { viewCount: true },
    })
  })

  it("derives totals from the approvalStatus groupBy + view sum", async () => {
    // total = sum of all group counts (2 PENDING + 3 APPROVED = 5)
    mockGroupBy.mockResolvedValueOnce([
      { approvalStatus: "PENDING", _count: 2 },
      { approvalStatus: "APPROVED", _count: 3 },
    ])
    mockAggregate.mockResolvedValueOnce({ _sum: { viewCount: 999 } })
    const result = await getTeacherStats()
    expect(result).toEqual({
      totalVideos: 5,
      pendingVideos: 2,
      approvedVideos: 3,
      totalViews: 999,
    })
  })

  it("treats null view sum as 0", async () => {
    mockAggregate.mockResolvedValueOnce({ _sum: { viewCount: null } })
    const result = await getTeacherStats()
    expect(result.totalViews).toBe(0)
  })
})

describe("getMyVideos", () => {
  it("returns [] without session", async () => {
    mockAuth.mockResolvedValueOnce(null)
    const result = await getMyVideos()
    expect(result).toEqual([])
    expect(mockFindMany).not.toHaveBeenCalled()
  })

  it("returns [] without school context", async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: "u-1", role: "TEACHER" } })
    mockTenant.mockResolvedValueOnce({ schoolId: null, subdomain: null })
    const result = await getMyVideos()
    expect(result).toEqual([])
  })

  it("scopes findMany by userId AND schoolId", async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: "t-12", role: "TEACHER" } })
    await getMyVideos()
    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: "t-12", schoolId: "school-1" },
      })
    )
  })

  it("orders by createdAt desc (newest first)", async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: "t-1", role: "TEACHER" } })
    await getMyVideos()
    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ orderBy: { createdAt: "desc" } })
    )
  })
})
