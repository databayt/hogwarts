// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { auth } from "@/auth"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"
import {
  getPendingVideos,
  reviewVideo,
} from "@/components/stream/settings/video-review-actions"

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
      updateMany: vi.fn(),
    },
    notification: {
      create: vi.fn(),
    },
  },
}))

const mockAuth = auth as unknown as ReturnType<typeof vi.fn>
const mockTenant = getTenantContext as ReturnType<typeof vi.fn>
const mockFindMany = db.video.findMany as ReturnType<typeof vi.fn>
const mockFindFirst = db.video.findFirst as ReturnType<typeof vi.fn>
const mockUpdateMany = db.video.updateMany as ReturnType<typeof vi.fn>
const mockNotify = db.notification.create as ReturnType<typeof vi.fn>

beforeEach(() => {
  vi.clearAllMocks()
  mockTenant.mockResolvedValue({ schoolId: "school-1", subdomain: "demo" })
  mockFindMany.mockResolvedValue([])
  // Default pending video: school-scoped visibility, owned by teacher-1.
  mockFindFirst.mockResolvedValue({
    id: "v-1",
    title: "Algebra intro",
    userId: "teacher-1",
    visibility: "SCHOOL",
  })
  mockUpdateMany.mockResolvedValue({ count: 1 })
  mockNotify.mockResolvedValue({ id: "n-1" })
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
      expect(mockUpdateMany).not.toHaveBeenCalled()
    }
  )

  it("rejects when no school context", async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: "u-1", role: "ADMIN" } })
    mockTenant.mockResolvedValueOnce({ schoolId: null, subdomain: null })
    const result = await reviewVideo("v-1", "APPROVED")
    expect(result.status).toBe("error")
    expect(mockUpdateMany).not.toHaveBeenCalled()
  })

  it("returns error when the tenant-scoped write matches 0 rows", async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: "u-1", role: "ADMIN" } })
    mockUpdateMany.mockResolvedValueOnce({ count: 0 })
    const result = await reviewVideo("v-1", "APPROVED")
    expect(result.status).toBe("error")
  })

  it("returns error when the video isn't in this school (findFirst null)", async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: "u-1", role: "ADMIN" } })
    mockFindFirst.mockResolvedValueOnce(null)
    const result = await reviewVideo("v-other-school", "APPROVED")
    expect(result.status).toBe("error")
    expect(mockUpdateMany).not.toHaveBeenCalled()
  })
})

describe("reviewVideo — platform gate for global surfaces", () => {
  it.each(["PUBLIC", "PAID"] as const)(
    "ADMIN cannot approve a %s video (platform catalog lane)",
    async (visibility) => {
      mockAuth.mockResolvedValueOnce({ user: { id: "u-1", role: "ADMIN" } })
      mockFindFirst.mockResolvedValueOnce({
        id: "v-1",
        title: "Global video",
        userId: "teacher-1",
        visibility,
      })
      const result = await reviewVideo("v-1", "APPROVED")
      expect(result.status).toBe("error")
      expect(result.message).toMatch(/platform/i)
      expect(mockUpdateMany).not.toHaveBeenCalled()
    }
  )

  it("ADMIN can still REJECT a PUBLIC video", async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: "u-1", role: "ADMIN" } })
    mockFindFirst.mockResolvedValueOnce({
      id: "v-1",
      title: "Global video",
      userId: "teacher-1",
      visibility: "PUBLIC",
    })
    const result = await reviewVideo("v-1", "REJECTED", "off-topic")
    expect(result.status).toBe("success")
    expect(mockUpdateMany).toHaveBeenCalledOnce()
  })

  it("DEVELOPER can approve a PUBLIC video", async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: "dev-1", role: "DEVELOPER" } })
    mockFindFirst.mockResolvedValueOnce({
      id: "v-1",
      title: "Global video",
      userId: "teacher-1",
      visibility: "PUBLIC",
    })
    const result = await reviewVideo("v-1", "APPROVED")
    expect(result.status).toBe("success")
    expect(mockUpdateMany).toHaveBeenCalledOnce()
  })

  it("ADMIN can approve a SCHOOL video (in-school surface)", async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: "u-1", role: "ADMIN" } })
    const result = await reviewVideo("v-1", "APPROVED")
    expect(result.status).toBe("success")
    expect(mockUpdateMany).toHaveBeenCalledOnce()
  })
})

describe("reviewVideo — contributor notification", () => {
  beforeEach(() => {
    mockAuth.mockResolvedValue({ user: { id: "admin-7", role: "ADMIN" } })
  })

  it("notifies the owner on approval", async () => {
    await reviewVideo("v-1", "APPROVED")
    expect(mockNotify).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          schoolId: "school-1",
          userId: "teacher-1",
          type: "document_shared",
        }),
      })
    )
  })

  it("notifies the owner on rejection with the reason in the body", async () => {
    await reviewVideo("v-1", "REJECTED", "Audio too low")
    expect(mockNotify).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: "teacher-1",
          type: "system_alert",
          body: expect.stringContaining("Audio too low"),
        }),
      })
    )
  })

  it("a notification failure does not fail the review", async () => {
    mockNotify.mockRejectedValueOnce(new Error("notification table down"))
    const result = await reviewVideo("v-1", "APPROVED")
    expect(result.status).toBe("success")
  })
})

describe("reviewVideo — APPROVED path", () => {
  beforeEach(() => {
    mockAuth.mockResolvedValue({ user: { id: "admin-7", role: "ADMIN" } })
  })

  it("tenant-scopes the write by id AND schoolId (no cross-tenant update)", async () => {
    await reviewVideo("v-1", "APPROVED")
    expect(mockUpdateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "v-1", schoolId: "school-1" },
      })
    )
  })

  it("sets approvedBy + approvedAt + nulls rejectionReason", async () => {
    await reviewVideo("v-1", "APPROVED")
    expect(mockUpdateMany).toHaveBeenCalledWith(
      expect.objectContaining({
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
    expect(mockUpdateMany).toHaveBeenCalledWith(
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
