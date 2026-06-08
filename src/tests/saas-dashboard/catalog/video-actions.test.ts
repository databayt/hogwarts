// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { revalidatePath } from "next/cache"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import {
  createVideo,
  deleteVideo,
  getVideos,
  toggleVideoFeatured,
} from "@/components/saas-dashboard/catalog/video-actions"
import { requireDeveloper } from "@/components/saas-dashboard/lib/operator-auth"

// ============================================================================
// Mocks
// ============================================================================

vi.mock("@/components/saas-dashboard/lib/operator-auth", () => ({
  requireDeveloper: vi.fn(),
}))

vi.mock("@/lib/db", () => ({
  db: {
    lessonVideo: {
      create: vi.fn(),
      findMany: vi.fn(),
      findUniqueOrThrow: vi.fn(),
      delete: vi.fn(),
      update: vi.fn(),
    },
  },
}))

const mockSend = vi.fn()
vi.mock("@aws-sdk/client-s3", () => ({
  S3Client: vi.fn().mockImplementation(() => ({ send: mockSend })),
  DeleteObjectCommand: vi.fn(),
}))

vi.mock("@/lib/cloudfront", () => ({
  invalidateCache: vi.fn(),
}))

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }))

// ============================================================================
// Helpers
// ============================================================================

function mockDeveloperSession() {
  vi.mocked(requireDeveloper).mockResolvedValue({
    user: { id: "dev-1", role: "DEVELOPER" },
  } as any)
}

function mockAuthFailure() {
  vi.mocked(requireDeveloper).mockRejectedValue(
    new Error("Unauthorized: DEVELOPER role required")
  )
}

function makeVideoInput(overrides: Record<string, unknown> = {}) {
  return {
    catalogLessonId: "lesson-1",
    title: "Intro Video",
    videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    ...overrides,
  }
}

// ============================================================================
// Tests
// ============================================================================

describe("Video Actions", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Set required env vars for S3 client
    process.env.AWS_ACCESS_KEY_ID = "test-key"
    process.env.AWS_SECRET_ACCESS_KEY = "test-secret"
    process.env.AWS_S3_BUCKET = "test-bucket"
  })

  // ==========================================================================
  // createVideo
  // ==========================================================================

  describe("createVideo", () => {
    it("creates video with YouTube URL — detects provider and extracts ID", async () => {
      mockDeveloperSession()
      vi.mocked(db.video.create).mockResolvedValue({
        id: "vid-1",
        provider: "youtube",
        externalId: "dQw4w9WgXcQ",
      } as any)

      const result = await createVideo(
        makeVideoInput({
          videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        })
      )

      expect(result.success).toBe(true)
      expect(db.video.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          provider: "youtube",
          externalId: "dQw4w9WgXcQ",
          catalogLessonId: "lesson-1",
        }),
      })
      expect(revalidatePath).toHaveBeenCalledWith("/catalog")
    })

    it("creates video with Vimeo URL — detects provider and extracts ID", async () => {
      mockDeveloperSession()
      vi.mocked(db.video.create).mockResolvedValue({
        id: "vid-2",
        provider: "vimeo",
        externalId: "123456789",
      } as any)

      const result = await createVideo(
        makeVideoInput({
          videoUrl: "https://vimeo.com/123456789",
        })
      )

      expect(result.success).toBe(true)
      expect(db.video.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          provider: "vimeo",
          externalId: "123456789",
        }),
      })
    })

    it("creates video with self-hosted URL — provider self-hosted, externalId null", async () => {
      mockDeveloperSession()
      vi.mocked(db.video.create).mockResolvedValue({
        id: "vid-3",
        provider: "self-hosted",
        externalId: null,
      } as any)

      const result = await createVideo(
        makeVideoInput({
          videoUrl: "https://cdn.databayt.org/videos/intro.mp4",
        })
      )

      expect(result.success).toBe(true)
      expect(db.video.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          provider: "self-hosted",
          externalId: null,
        }),
      })
    })

    it("sets isFeatured true and approvalStatus APPROVED", async () => {
      mockDeveloperSession()
      vi.mocked(db.video.create).mockResolvedValue({
        id: "vid-4",
      } as any)

      await createVideo(makeVideoInput())

      expect(db.video.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          isFeatured: true,
          approvalStatus: "APPROVED",
          visibility: "PUBLIC",
        }),
      })
    })

    it("requires DEVELOPER role", async () => {
      mockAuthFailure()

      await expect(createVideo(makeVideoInput())).rejects.toThrow(
        "Unauthorized: DEVELOPER role required"
      )
      expect(db.video.create).not.toHaveBeenCalled()
    })

    it("uses session.user.id for userId field", async () => {
      mockDeveloperSession()
      vi.mocked(db.video.create).mockResolvedValue({
        id: "vid-5",
      } as any)

      await createVideo(makeVideoInput())

      expect(db.video.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: "dev-1",
          schoolId: null,
        }),
      })
    })
  })

  // ==========================================================================
  // getVideos
  // ==========================================================================

  describe("getVideos", () => {
    it("returns videos for a lesson", async () => {
      mockDeveloperSession()
      const mockVideos = [
        { id: "vid-1", title: "Intro", isFeatured: true },
        { id: "vid-2", title: "Part 2", isFeatured: false },
      ]
      vi.mocked(db.video.findMany).mockResolvedValue(mockVideos as any)

      const result = await getVideos("lesson-1")

      expect(result).toEqual(mockVideos)
      expect(db.video.findMany).toHaveBeenCalledWith({
        where: { catalogLessonId: "lesson-1" },
        orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
        select: {
          id: true,
          title: true,
          videoUrl: true,
          provider: true,
          durationSeconds: true,
          isFeatured: true,
          visibility: true,
          approvalStatus: true,
          storageKey: true,
          createdAt: true,
        },
      })
    })

    it("orders by isFeatured desc then createdAt desc", async () => {
      mockDeveloperSession()
      vi.mocked(db.video.findMany).mockResolvedValue([] as any)

      await getVideos("lesson-1")

      expect(db.video.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
        })
      )
    })

    it("requires DEVELOPER role", async () => {
      mockAuthFailure()

      await expect(getVideos("lesson-1")).rejects.toThrow(
        "Unauthorized: DEVELOPER role required"
      )
      expect(db.video.findMany).not.toHaveBeenCalled()
    })
  })

  // ==========================================================================
  // deleteVideo
  // ==========================================================================

  describe("deleteVideo", () => {
    it("deletes video from DB", async () => {
      mockDeveloperSession()
      vi.mocked(db.video.findUniqueOrThrow).mockResolvedValue({
        storageKey: null,
        catalogLessonId: "lesson-1",
      } as any)
      vi.mocked(db.video.delete).mockResolvedValue({} as any)

      const result = await deleteVideo("vid-1")

      expect(result).toEqual({ success: true })
      expect(db.video.delete).toHaveBeenCalledWith({
        where: { id: "vid-1" },
      })
      expect(revalidatePath).toHaveBeenCalledWith("/catalog")
    })

    it("attempts S3 cleanup when storageKey exists", async () => {
      mockDeveloperSession()
      vi.mocked(db.video.findUniqueOrThrow).mockResolvedValue({
        storageKey: "videos/lesson-1/intro.mp4",
        catalogLessonId: "lesson-1",
      } as any)
      vi.mocked(db.video.delete).mockResolvedValue({} as any)
      mockSend.mockResolvedValue({})

      const result = await deleteVideo("vid-1")

      expect(result).toEqual({ success: true })
      expect(db.video.delete).toHaveBeenCalledWith({
        where: { id: "vid-1" },
      })
    })

    it("skips S3 cleanup when no storageKey", async () => {
      mockDeveloperSession()
      vi.mocked(db.video.findUniqueOrThrow).mockResolvedValue({
        storageKey: null,
        catalogLessonId: "lesson-1",
      } as any)
      vi.mocked(db.video.delete).mockResolvedValue({} as any)

      await deleteVideo("vid-1")

      expect(mockSend).not.toHaveBeenCalled()
    })

    it("handles S3 failure gracefully — still deletes DB record", async () => {
      mockDeveloperSession()
      vi.mocked(db.video.findUniqueOrThrow).mockResolvedValue({
        storageKey: "videos/lesson-1/intro.mp4",
        catalogLessonId: "lesson-1",
      } as any)
      vi.mocked(db.video.delete).mockResolvedValue({} as any)
      mockSend.mockRejectedValue(new Error("S3 network error"))

      const result = await deleteVideo("vid-1")

      // Non-critical: DB deletion still happens
      expect(result).toEqual({ success: true })
      expect(db.video.delete).toHaveBeenCalledWith({
        where: { id: "vid-1" },
      })
    })

    it("requires DEVELOPER role", async () => {
      mockAuthFailure()

      await expect(deleteVideo("vid-1")).rejects.toThrow(
        "Unauthorized: DEVELOPER role required"
      )
      expect(db.video.findUniqueOrThrow).not.toHaveBeenCalled()
    })
  })

  // ==========================================================================
  // toggleVideoFeatured
  // ==========================================================================

  describe("toggleVideoFeatured", () => {
    it("toggles true to false", async () => {
      mockDeveloperSession()
      vi.mocked(db.video.findUniqueOrThrow).mockResolvedValue({
        isFeatured: true,
      } as any)
      vi.mocked(db.video.update).mockResolvedValue({
        isFeatured: false,
      } as any)

      const result = await toggleVideoFeatured("vid-1")

      expect(result).toEqual({ success: true, isFeatured: false })
      expect(db.video.update).toHaveBeenCalledWith({
        where: { id: "vid-1" },
        data: { isFeatured: false },
      })
      expect(revalidatePath).toHaveBeenCalledWith("/catalog")
    })

    it("toggles false to true", async () => {
      mockDeveloperSession()
      vi.mocked(db.video.findUniqueOrThrow).mockResolvedValue({
        isFeatured: false,
      } as any)
      vi.mocked(db.video.update).mockResolvedValue({
        isFeatured: true,
      } as any)

      const result = await toggleVideoFeatured("vid-2")

      expect(result).toEqual({ success: true, isFeatured: true })
      expect(db.video.update).toHaveBeenCalledWith({
        where: { id: "vid-2" },
        data: { isFeatured: true },
      })
    })

    it("requires DEVELOPER role", async () => {
      mockAuthFailure()

      await expect(toggleVideoFeatured("vid-1")).rejects.toThrow(
        "Unauthorized: DEVELOPER role required"
      )
      expect(db.video.findUniqueOrThrow).not.toHaveBeenCalled()
    })
  })
})
