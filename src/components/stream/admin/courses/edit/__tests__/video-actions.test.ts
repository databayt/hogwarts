// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"

import { updateVideoApproval } from "../video-actions"

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock("@/auth", () => ({
  auth: vi.fn().mockResolvedValue({
    user: { id: "user-1", schoolId: "school-123", role: "ADMIN" },
  }),
}))

vi.mock("@/lib/tenant-context", () => ({
  getTenantContext: vi.fn(),
}))

vi.mock("@/lib/db", () => ({
  db: {
    lessonVideo: {
      findFirst: vi.fn(),
      update: vi.fn(),
    },
  },
}))

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}))

const mockGetTenant = getTenantContext as ReturnType<typeof vi.fn>
const mockFindFirst = db.lessonVideo.findFirst as ReturnType<typeof vi.fn>
const mockUpdate = db.lessonVideo.update as ReturnType<typeof vi.fn>

beforeEach(() => {
  vi.clearAllMocks()
  mockGetTenant.mockResolvedValue({ schoolId: "school-123", subdomain: "demo" })
})

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("updateVideoApproval", () => {
  it("verifies video belongs to current school before approval", async () => {
    mockFindFirst.mockResolvedValue({ id: "video-1" })
    mockUpdate.mockResolvedValue({})

    const result = await updateVideoApproval("video-1", "APPROVED")

    expect(result.status).toBe("success")
    expect(mockFindFirst).toHaveBeenCalledWith({
      where: { id: "video-1", schoolId: "school-123" },
      select: { id: true },
    })
    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: "video-1" },
      data: { approvalStatus: "APPROVED" },
    })
  })

  it("returns error when video not in school", async () => {
    mockFindFirst.mockResolvedValue(null)

    const result = await updateVideoApproval("video-other", "APPROVED")

    expect(result.status).toBe("error")
    expect(result.message).toBe("Video not found")
    expect(mockUpdate).not.toHaveBeenCalled()
  })

  it("returns error when no school context", async () => {
    mockGetTenant.mockResolvedValue({ schoolId: null, subdomain: null })

    const result = await updateVideoApproval("video-1", "APPROVED")

    expect(result.status).toBe("error")
    expect(result.message).toBe("Missing school context")
    expect(mockFindFirst).not.toHaveBeenCalled()
  })
})
