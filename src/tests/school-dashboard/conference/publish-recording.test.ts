// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
// @vitest-environment node
//
// Live Class → Recorded Lesson. The bridge must be idempotent, must skip
// sessions with nowhere to publish to, and must never leave a Video row
// behind when the object copy or the race-guard fails.

import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import { copyObject, getObjectSize } from "@/lib/s3"
import {
  checkSchoolVideoQuota,
  incrementSchoolVideoUsage,
} from "@/components/lumos/lib/quota"
import { publishRecordingAsLessonVideo } from "@/components/school-dashboard/conference/actions/publish-recording"

vi.mock("@/lib/db", () => ({
  db: {
    conferenceRecording: { findFirst: vi.fn(), updateMany: vi.fn() },
    video: { create: vi.fn(), delete: vi.fn() },
  },
}))
vi.mock("@/lib/s3", () => ({ copyObject: vi.fn(), getObjectSize: vi.fn() }))
vi.mock("@/lib/cloudfront-url", () => ({
  getCloudFrontUrl: (k: string) => `https://cdn.test/${k}`,
}))
vi.mock("@/components/lumos/lib/quota", () => ({
  checkSchoolVideoQuota: vi.fn(),
  incrementSchoolVideoUsage: vi.fn(),
}))
vi.mock("@/components/translation/prewarm", () => ({
  prewarm: vi.fn(async () => undefined),
}))
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }))

const mockDb = db as unknown as {
  conferenceRecording: {
    findFirst: ReturnType<typeof vi.fn>
    updateMany: ReturnType<typeof vi.fn>
  }
  video: { create: ReturnType<typeof vi.fn>; delete: ReturnType<typeof vi.fn> }
}

const recording = (over: Record<string, unknown> = {}) => ({
  id: "rec-1",
  status: "ready",
  s3Key: "schools/s1/live-class/c1/1.mp4",
  durationSeconds: 2700,
  publishedVideoId: null,
  session: {
    id: "c1",
    title: "الرياضيات · الصف العاشر - أ",
    lang: "ar",
    catalogLessonId: "les-1",
    scheduledStart: new Date("2026-08-31T05:00:00Z"),
    teacher: { userId: "u-teacher" },
    subject: { name: "الرياضيات" },
    section: { name: "الصف العاشر - أ" },
  },
  ...over,
})

describe("publishRecordingAsLessonVideo", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(copyObject).mockResolvedValue(true)
    vi.mocked(getObjectSize).mockResolvedValue(150_000_000)
    vi.mocked(checkSchoolVideoQuota).mockResolvedValue({
      allowed: true,
    } as never)
    mockDb.video.create.mockResolvedValue({ id: "vid-1" })
    mockDb.conferenceRecording.updateMany.mockResolvedValue({ count: 1 })
  })

  it("copies the object under the lumos prefix and creates an APPROVED, school-visible, downloadable video", async () => {
    mockDb.conferenceRecording.findFirst.mockResolvedValue(recording())
    const out = await publishRecordingAsLessonVideo("s1", "c1", "egr-1")
    expect(out).toEqual({ published: true, videoId: "vid-1" })
    expect(copyObject).toHaveBeenCalledWith(
      "schools/s1/live-class/c1/1.mp4",
      "stream/s1/video/live-rec-1.mp4",
      "video/mp4"
    )
    const data = mockDb.video.create.mock.calls[0][0].data
    expect(data.catalogLessonId).toBe("les-1")
    expect(data.userId).toBe("u-teacher")
    expect(data.approvalStatus).toBe("APPROVED")
    expect(data.visibility).toBe("SCHOOL")
    expect(data.allowDownload).toBe(false)
    expect(data.storageKey).toBe("stream/s1/video/live-rec-1.mp4")
    expect(data.durationSeconds).toBe(2700)
    expect(data.title).toBe("الرياضيات · الصف العاشر - أ — 2026-08-31")
    expect(incrementSchoolVideoUsage).toHaveBeenCalledWith("s1", 150_000_000)
    // The recording remembers its video → the next call is a no-op.
    expect(mockDb.conferenceRecording.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "rec-1", publishedVideoId: null },
      })
    )
  })

  it("is a no-op when already published", async () => {
    mockDb.conferenceRecording.findFirst.mockResolvedValue(
      recording({ publishedVideoId: "vid-0" })
    )
    expect(await publishRecordingAsLessonVideo("s1", "c1", "egr-1")).toEqual({
      published: false,
      reason: "already_published",
    })
    expect(copyObject).not.toHaveBeenCalled()
    expect(mockDb.video.create).not.toHaveBeenCalled()
  })

  it("skips a session with no catalog lesson (assemblies, PD) without copying", async () => {
    mockDb.conferenceRecording.findFirst.mockResolvedValue(
      recording({ session: { ...recording().session, catalogLessonId: null } })
    )
    expect(await publishRecordingAsLessonVideo("s1", "c1", "egr-1")).toEqual({
      published: false,
      reason: "no_lesson",
    })
    expect(copyObject).not.toHaveBeenCalled()
  })

  it("refuses a recording that is not ready", async () => {
    mockDb.conferenceRecording.findFirst.mockResolvedValue(
      recording({ status: "processing", s3Key: "" })
    )
    expect(await publishRecordingAsLessonVideo("s1", "c1", "egr-1")).toEqual({
      published: false,
      reason: "not_ready",
    })
  })

  it("creates no Video row when the S3 copy fails", async () => {
    mockDb.conferenceRecording.findFirst.mockResolvedValue(recording())
    vi.mocked(copyObject).mockResolvedValue(false)
    expect(await publishRecordingAsLessonVideo("s1", "c1", "egr-1")).toEqual({
      published: false,
      reason: "copy_failed",
    })
    expect(mockDb.video.create).not.toHaveBeenCalled()
  })

  it("respects the school's storage quota", async () => {
    mockDb.conferenceRecording.findFirst.mockResolvedValue(recording())
    vi.mocked(checkSchoolVideoQuota).mockResolvedValue({
      allowed: false,
    } as never)
    expect(await publishRecordingAsLessonVideo("s1", "c1", "egr-1")).toEqual({
      published: false,
      reason: "quota",
    })
    expect(mockDb.video.create).not.toHaveBeenCalled()
  })

  it("loses the race gracefully: deletes its own video when another publish claimed the recording first", async () => {
    mockDb.conferenceRecording.findFirst.mockResolvedValue(recording())
    mockDb.conferenceRecording.updateMany.mockResolvedValue({ count: 0 })
    mockDb.video.delete.mockResolvedValue({})
    expect(await publishRecordingAsLessonVideo("s1", "c1", "egr-1")).toEqual({
      published: false,
      reason: "already_published",
    })
    expect(mockDb.video.delete).toHaveBeenCalledWith({ where: { id: "vid-1" } })
    expect(incrementSchoolVideoUsage).not.toHaveBeenCalled()
  })
})
