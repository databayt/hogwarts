// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { auth } from "@/auth"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import {
  deleteOwnVideo,
  getMyOwnedVideos,
  replaceVideoFile,
  revokeVideoAccess,
  updateVideoVisibility,
} from "@/components/lumos/video/video-owner-actions"

vi.mock("@/lib/cloudfront", () => ({
  invalidateCache: vi.fn().mockResolvedValue(undefined),
}))

vi.mock("@/lib/s3", () => ({
  deleteObject: vi.fn().mockResolvedValue(true),
}))

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}))

vi.mock("@/lib/db", () => ({
  db: {
    video: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}))

const mockAuth = auth as unknown as ReturnType<typeof vi.fn>
const mockFindUnique = db.video.findUnique as ReturnType<typeof vi.fn>
const mockFindFirst = db.video.findFirst as ReturnType<typeof vi.fn>
const mockFindMany = db.video.findMany as ReturnType<typeof vi.fn>
const mockUpdate = db.video.update as ReturnType<typeof vi.fn>
const mockDelete = db.video.delete as ReturnType<typeof vi.fn>

const ownedVideo = {
  id: "v-1",
  userId: "owner-1",
  videoUrl: "https://example.com/v.mp4",
  storageKey: "videos/v-1.mp4",
  visibility: "SCHOOL",
  approvalStatus: "APPROVED",
  catalogLessonId: "lesson-1",
  lesson: { chapter: { subject: { slug: "math" } } },
}

beforeEach(() => {
  vi.clearAllMocks()
  mockFindUnique.mockResolvedValue(ownedVideo)
  // No other row claims the object unless a test says so.
  mockFindFirst.mockResolvedValue(null)
  mockUpdate.mockResolvedValue(ownedVideo)
  mockDelete.mockResolvedValue(ownedVideo)
  mockFindMany.mockResolvedValue([])
})

describe("updateVideoVisibility — auth/ownership", () => {
  it("denies unauthenticated", async () => {
    mockAuth.mockResolvedValueOnce(null)
    const result = await updateVideoVisibility("v-1", "PRIVATE")
    expect(result.status).toBe("error")
    expect(mockUpdate).not.toHaveBeenCalled()
  })

  it("denies non-owner non-DEVELOPER", async () => {
    mockAuth.mockResolvedValueOnce({
      user: { id: "stranger-1", role: "TEACHER" },
    })
    const result = await updateVideoVisibility("v-1", "PRIVATE")
    expect(result.status).toBe("error")
    expect(mockUpdate).not.toHaveBeenCalled()
  })

  it("permits owner", async () => {
    mockAuth.mockResolvedValueOnce({
      user: { id: "owner-1", role: "TEACHER" },
    })
    const result = await updateVideoVisibility("v-1", "PRIVATE")
    expect(result.status).toBe("success")
    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: "v-1" },
      data: { visibility: "PRIVATE" },
    })
  })

  it("permits DEVELOPER on any video (platform admin)", async () => {
    mockAuth.mockResolvedValueOnce({
      user: { id: "dev-1", role: "DEVELOPER" },
    })
    const result = await updateVideoVisibility("v-1", "PUBLIC")
    expect(result.status).toBe("success")
    expect(mockUpdate).toHaveBeenCalled()
  })

  it("returns error when video missing", async () => {
    mockAuth.mockResolvedValueOnce({
      user: { id: "owner-1", role: "TEACHER" },
    })
    mockFindUnique.mockResolvedValueOnce(null)
    const result = await updateVideoVisibility("v-1", "PRIVATE")
    expect(result.status).toBe("error")
  })
})

describe("updateVideoVisibility — paid paywall guard", () => {
  it("refuses to un-paywall a PAID video and does not write", async () => {
    mockAuth.mockResolvedValueOnce({
      user: { id: "owner-1", role: "TEACHER" },
    })
    mockFindUnique.mockResolvedValueOnce({ ...ownedVideo, visibility: "PAID" })
    const result = await updateVideoVisibility("v-1", "PUBLIC")
    expect(result.status).toBe("error")
    expect(mockUpdate).not.toHaveBeenCalled()
  })

  it("blocks PAID even for the DEVELOPER (no silent un-paywall path)", async () => {
    mockAuth.mockResolvedValueOnce({
      user: { id: "dev-1", role: "DEVELOPER" },
    })
    mockFindUnique.mockResolvedValueOnce({ ...ownedVideo, visibility: "PAID" })
    const result = await updateVideoVisibility("v-1", "SCHOOL")
    expect(result.status).toBe("error")
    expect(mockUpdate).not.toHaveBeenCalled()
  })

  it("still allows visibility changes on non-PAID videos", async () => {
    mockAuth.mockResolvedValueOnce({
      user: { id: "owner-1", role: "TEACHER" },
    })
    mockFindUnique.mockResolvedValueOnce({
      ...ownedVideo,
      visibility: "PRIVATE",
    })
    const result = await updateVideoVisibility("v-1", "SCHOOL")
    expect(result.status).toBe("success")
    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: "v-1" },
      data: { visibility: "SCHOOL" },
    })
  })
})

describe("updateVideoVisibility — PUBLIC widening resubmits for platform review", () => {
  it("APPROVED school video → PUBLIC resets approval to PENDING for a non-dev owner", async () => {
    mockAuth.mockResolvedValueOnce({
      user: { id: "owner-1", role: "TEACHER" },
    })
    // ownedVideo default: visibility SCHOOL, approvalStatus APPROVED
    const result = await updateVideoVisibility("v-1", "PUBLIC")
    expect(result.status).toBe("success")
    expect(result.message).toMatch(/review/i)
    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: "v-1" },
      data: {
        visibility: "PUBLIC",
        approvalStatus: "PENDING",
        approvedBy: null,
        approvedAt: null,
      },
    })
  })

  it("narrowing an APPROVED video (SCHOOL → PRIVATE) does NOT reset approval", async () => {
    mockAuth.mockResolvedValueOnce({
      user: { id: "owner-1", role: "TEACHER" },
    })
    await updateVideoVisibility("v-1", "PRIVATE")
    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: "v-1" },
      data: { visibility: "PRIVATE" },
    })
  })

  it("a PENDING video going PUBLIC keeps its pending state untouched", async () => {
    mockAuth.mockResolvedValueOnce({
      user: { id: "owner-1", role: "TEACHER" },
    })
    mockFindUnique.mockResolvedValueOnce({
      ...ownedVideo,
      approvalStatus: "PENDING",
    })
    await updateVideoVisibility("v-1", "PUBLIC")
    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: "v-1" },
      data: { visibility: "PUBLIC" },
    })
  })

  it("DEVELOPER widening to PUBLIC does not reset approval (they are the platform lane)", async () => {
    mockAuth.mockResolvedValueOnce({
      user: { id: "dev-1", role: "DEVELOPER" },
    })
    await updateVideoVisibility("v-1", "PUBLIC")
    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: "v-1" },
      data: { visibility: "PUBLIC" },
    })
  })
})

describe("deleteOwnVideo", () => {
  it("denies stranger", async () => {
    mockAuth.mockResolvedValueOnce({
      user: { id: "stranger", role: "STUDENT" },
    })
    const result = await deleteOwnVideo("v-1")
    expect(result.status).toBe("error")
    expect(mockDelete).not.toHaveBeenCalled()
  })

  it("permits owner and invalidates CDN", async () => {
    mockAuth.mockResolvedValueOnce({
      user: { id: "owner-1", role: "TEACHER" },
    })
    const { invalidateCache } = await import("@/lib/cloudfront")
    const result = await deleteOwnVideo("v-1")
    expect(result.status).toBe("success")
    expect(mockDelete).toHaveBeenCalledWith({ where: { id: "v-1" } })
    expect(invalidateCache).toHaveBeenCalledWith(["/videos/v-1.mp4"])
  })

  it("does not throw when CDN invalidation fails", async () => {
    mockAuth.mockResolvedValueOnce({
      user: { id: "owner-1", role: "TEACHER" },
    })
    const { invalidateCache } = await import("@/lib/cloudfront")
    ;(invalidateCache as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
      new Error("CDN down")
    )
    const result = await deleteOwnVideo("v-1")
    expect(result.status).toBe("success")
  })

  it("deletes the stored object, not just its cached copy", async () => {
    mockAuth.mockResolvedValueOnce({
      user: { id: "owner-1", role: "TEACHER" },
    })
    // A key written by the current upload path, i.e. inside the school prefix.
    mockFindUnique.mockResolvedValueOnce({
      ...ownedVideo,
      schoolId: "school-1",
      storageKey: "stream/school-1/video/123_v.mp4",
    })
    const { deleteObject } = await import("@/lib/s3")
    const result = await deleteOwnVideo("v-1")
    expect(result.status).toBe("success")
    // Without this the quota counter frees the space while the bytes remain.
    expect(deleteObject).toHaveBeenCalledWith("stream/school-1/video/123_v.mp4")
  })

  it("leaves the object alone when the key is outside the school's prefix", async () => {
    mockAuth.mockResolvedValueOnce({
      user: { id: "owner-1", role: "TEACHER" },
    })
    // Legacy row: `storageKey` predates the ownership assert, so it could name
    // anything — including an object this school never uploaded.
    mockFindUnique.mockResolvedValueOnce({
      ...ownedVideo,
      schoolId: "school-1",
      storageKey: "stream/other-school/video/9_v.mp4",
    })
    const { deleteObject } = await import("@/lib/s3")
    const result = await deleteOwnVideo("v-1")
    expect(result.status).toBe("success")
    expect(deleteObject).not.toHaveBeenCalled()
  })

  it("leaves the object alone while another video still references it", async () => {
    mockAuth.mockResolvedValueOnce({
      user: { id: "owner-1", role: "TEACHER" },
    })
    mockFindUnique.mockResolvedValueOnce({
      ...ownedVideo,
      schoolId: "school-1",
      storageKey: "stream/school-1/video/123_v.mp4",
    })
    mockFindFirst.mockResolvedValueOnce({ id: "v-2" })
    const { deleteObject } = await import("@/lib/s3")
    const result = await deleteOwnVideo("v-1")
    expect(result.status).toBe("success")
    expect(deleteObject).not.toHaveBeenCalled()
  })

  it("still succeeds when the storage delete throws", async () => {
    mockAuth.mockResolvedValueOnce({
      user: { id: "owner-1", role: "TEACHER" },
    })
    mockFindUnique.mockResolvedValueOnce({
      ...ownedVideo,
      schoolId: "school-1",
      storageKey: "stream/school-1/video/123_v.mp4",
    })
    const { deleteObject } = await import("@/lib/s3")
    ;(deleteObject as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
      new Error("S3 down")
    )
    // The row is already gone; a storage hiccup must not report failure.
    const result = await deleteOwnVideo("v-1")
    expect(result.status).toBe("success")
  })

  it("skips CDN invalidation when no storageKey", async () => {
    mockAuth.mockResolvedValueOnce({
      user: { id: "owner-1", role: "TEACHER" },
    })
    mockFindUnique.mockResolvedValueOnce({ ...ownedVideo, storageKey: null })
    const { invalidateCache } = await import("@/lib/cloudfront")
    await deleteOwnVideo("v-1")
    expect(invalidateCache).not.toHaveBeenCalled()
  })
})

describe("revokeVideoAccess", () => {
  beforeEach(() => {
    mockAuth.mockResolvedValue({ user: { id: "owner-1", role: "TEACHER" } })
  })

  it("forces visibility to PRIVATE", async () => {
    const result = await revokeVideoAccess("v-1")
    expect(result.status).toBe("success")
    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: "v-1" },
      data: { visibility: "PRIVATE" },
    })
  })

  it("invalidates CDN cache for immediate effect", async () => {
    const { invalidateCache } = await import("@/lib/cloudfront")
    await revokeVideoAccess("v-1")
    expect(invalidateCache).toHaveBeenCalledWith(["/videos/v-1.mp4"])
  })
})

describe("replaceVideoFile", () => {
  beforeEach(() => {
    mockAuth.mockResolvedValue({ user: { id: "owner-1", role: "TEACHER" } })
  })

  it("resets approval to PENDING after replace", async () => {
    await replaceVideoFile("v-1", "https://new.url/v.mp4", "SELF_HOSTED", 300)
    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: "v-1" },
      data: expect.objectContaining({
        videoUrl: "https://new.url/v.mp4",
        provider: "SELF_HOSTED",
        durationSeconds: 300,
        approvalStatus: "PENDING",
        approvedBy: null,
        approvedAt: null,
      }),
    })
  })

  it("nulls duration when not provided", async () => {
    await replaceVideoFile("v-1", "https://new.url/v.mp4", "YOUTUBE")
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ durationSeconds: null }),
      })
    )
  })
})

describe("getMyOwnedVideos", () => {
  it("returns error when unauthenticated", async () => {
    mockAuth.mockResolvedValueOnce(null)
    const result = await getMyOwnedVideos()
    expect(result.status).toBe("error")
  })

  it("scopes findMany by current userId", async () => {
    mockAuth.mockResolvedValueOnce({
      user: { id: "u-77", role: "TEACHER" },
    })
    await getMyOwnedVideos()
    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: "u-77" } })
    )
  })

  it("flattens nested lesson/chapter/subject in output", async () => {
    mockAuth.mockResolvedValueOnce({
      user: { id: "u-1", role: "TEACHER" },
    })
    mockFindMany.mockResolvedValueOnce([
      {
        id: "v-1",
        title: "T",
        visibility: "SCHOOL",
        approvalStatus: "APPROVED",
        viewCount: 0,
        likeCount: 0,
        averageRating: 0,
        ratingCount: 0,
        durationSeconds: 60,
        createdAt: new Date(),
        updatedAt: new Date(),
        lesson: {
          name: "L1",
          chapter: { name: "C1", subject: { name: "Math", slug: "math" } },
        },
      },
    ])
    const result = await getMyOwnedVideos()
    expect(result.status).toBe("success")
    if (result.status === "success") {
      expect(result.data?.[0].lessonName).toBe("L1")
      expect(result.data?.[0].chapterName).toBe("C1")
      expect(result.data?.[0].courseName).toBe("Math")
      expect(result.data?.[0].courseSlug).toBe("math")
    }
  })
})
