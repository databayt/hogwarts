// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { auth } from "@/auth"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"
import { getSubmittedVideos } from "@/components/lumos/settings/video-review-actions"

vi.mock("@/lib/tenant-context", () => ({
  getTenantContext: vi.fn(),
}))

vi.mock("@/lib/db", () => ({
  db: {
    video: {
      findMany: vi.fn(),
    },
  },
}))

const mockAuth = auth as unknown as ReturnType<typeof vi.fn>
const mockTenant = getTenantContext as ReturnType<typeof vi.fn>
const mockFindMany = db.video.findMany as ReturnType<typeof vi.fn>

beforeEach(() => {
  vi.clearAllMocks()
  mockTenant.mockResolvedValue({ schoolId: "school-1", subdomain: "demo" })
  mockFindMany.mockResolvedValue([])
})

describe("getSubmittedVideos — auth", () => {
  it("returns [] when unauthenticated", async () => {
    mockAuth.mockResolvedValueOnce(null)
    const result = await getSubmittedVideos()
    expect(result).toEqual([])
    expect(mockFindMany).not.toHaveBeenCalled()
  })

  it.each(["TEACHER", "STUDENT", "GUARDIAN", "STAFF", "ACCOUNTANT"])(
    "returns [] for %s",
    async (role) => {
      mockAuth.mockResolvedValueOnce({ user: { id: "u-1", role } })
      const result = await getSubmittedVideos()
      expect(result).toEqual([])
      expect(mockFindMany).not.toHaveBeenCalled()
    }
  )

  it("returns [] without school context", async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: "u-1", role: "ADMIN" } })
    mockTenant.mockResolvedValueOnce({ schoolId: null })
    const result = await getSubmittedVideos()
    expect(result).toEqual([])
    expect(mockFindMany).not.toHaveBeenCalled()
  })
})

describe("getSubmittedVideos — query", () => {
  beforeEach(() => {
    mockAuth.mockResolvedValue({ user: { id: "u-1", role: "ADMIN" } })
  })

  it("scopes by the current schoolId", async () => {
    await getSubmittedVideos()
    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { schoolId: "school-1" } })
    )
  })

  it("does NOT filter to PENDING — the feed must show decided rows too", async () => {
    // The platform is the sole approver now, so this surface is a status feed.
    // Filtering to PENDING would hide exactly the REJECTED rows that carry the
    // platform's feedback, which is the one thing the school needs from it.
    await getSubmittedVideos()
    const where = mockFindMany.mock.calls[0][0].where
    expect(where).not.toHaveProperty("approvalStatus")
  })

  it("orders newest first", async () => {
    await getSubmittedVideos()
    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ orderBy: { createdAt: "desc" } })
    )
  })

  it("selects the status fields the feed renders", async () => {
    await getSubmittedVideos()
    const select = mockFindMany.mock.calls[0][0].select
    expect(select.approvalStatus).toBe(true)
    expect(select.rejectionReason).toBe(true)
  })

  it("caps the feed so a prolific school cannot unbound the page", async () => {
    await getSubmittedVideos()
    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 100 })
    )
  })
})

describe("getSubmittedVideos — link safety", () => {
  beforeEach(() => {
    mockAuth.mockResolvedValue({ user: { id: "u-1", role: "ADMIN" } })
  })

  it("routes self-hosted videos through the authorizing route, not storage", async () => {
    // A raw storage URL is a permanent unauthenticated link to the object for
    // anyone it is forwarded to — the role gate covers the page, not the URL.
    mockFindMany.mockResolvedValueOnce([
      {
        id: "v-1",
        videoUrl:
          "https://hogwarts-databayt.s3.amazonaws.com/stream/x/video/a.mp4",
      },
    ])
    const [row] = await getSubmittedVideos()
    expect(row.videoUrl).not.toContain("s3.amazonaws.com")
    expect(row.videoUrl).toContain("v-1")
  })

  it("passes external provider URLs through untouched", async () => {
    mockFindMany.mockResolvedValueOnce([
      { id: "v-2", videoUrl: "https://www.youtube.com/watch?v=abc123" },
    ])
    const [row] = await getSubmittedVideos()
    expect(row.videoUrl).toBe("https://www.youtube.com/watch?v=abc123")
  })
})
