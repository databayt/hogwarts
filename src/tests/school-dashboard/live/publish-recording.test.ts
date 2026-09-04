// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
// @vitest-environment node
//
// Live Class → Recorded Lesson. The bridge must be idempotent, must skip
// sessions with nowhere to publish to, and must never leave a Video row
// behind when the object copy or the race-guard fails.

import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import { copyObject, deleteObject, getObjectSize } from "@/lib/s3"
import {
  checkSchoolVideoQuota,
  incrementSchoolVideoUsage,
} from "@/components/lumos/lib/quota"
import { publishRecordingAsLessonVideo } from "@/components/school-dashboard/live/actions/publish-recording"

vi.mock("@/lib/db", () => ({
  db: {
    conferenceRecording: { findFirst: vi.fn(), updateMany: vi.fn() },
    video: { create: vi.fn(), delete: vi.fn() },
  },
}))
vi.mock("@/lib/s3", () => ({
  copyObject: vi.fn(),
  getObjectSize: vi.fn(),
  deleteObject: vi.fn(),
}))
vi.mock("@/lib/cloudfront-url", () => ({
  toCloudFrontUrl: (url: string) =>
    url.replace(/^https:\/\/[^/]+/, "https://cdn.test"),
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
  // Deliberately a DIFFERENT bucket than AWS_S3_BUCKET ("app-bucket" in
  // spirit, "s1"-prefixed destination keys below) — this is the cross-bucket
  // case (ll-01): egress writes under LIVEKIT_RECORDING_BUCKET, the copy's
  // destination is always the app bucket.
  s3Bucket: "aldar-recordings-me-central-1",
  s3Key: "schools/s1/live-class/c1/1.mp4",
  fileSizeBytes: BigInt(150_000_000),
  durationSeconds: 2700,
  publishedVideoId: null,
  session: {
    id: "c1",
    title: "الرياضيات · الصف العاشر - أ",
    lang: "ar",
    catalogLessonId: "les-1",
    scheduledStart: new Date("2026-08-31T05:00:00Z"),
    teacher: { userId: "u-teacher" },
    school: { conferenceAutoPublishRecordings: true },
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
    vi.mocked(deleteObject).mockResolvedValue(true)
    vi.mocked(checkSchoolVideoQuota).mockResolvedValue({
      allowed: true,
    } as never)
    mockDb.video.create.mockResolvedValue({ id: "vid-1" })
    mockDb.conferenceRecording.updateMany.mockResolvedValue({ count: 1 })
  })

  it("respects the school's auto-publish switch — and, crucially, never touches S3 to get there (ll-03/fl-02 ordering)", async () => {
    mockDb.conferenceRecording.findFirst.mockResolvedValueOnce(
      recording({
        session: {
          ...recording().session,
          school: { conferenceAutoPublishRecordings: false },
        },
      })
    )
    const r = await publishRecordingAsLessonVideo(
      "school-1",
      "sess-1",
      "egress-1"
    )
    expect(r).toEqual({ published: false, reason: "disabled" })
    expect(copyObject).not.toHaveBeenCalled()
    expect(checkSchoolVideoQuota).not.toHaveBeenCalled()
    expect(mockDb.video.create).not.toHaveBeenCalled()
  })

  it("copies the object under the lumos prefix, cross-bucket from the recording's own s3Bucket, and creates an APPROVED, school-visible, downloadable video", async () => {
    mockDb.conferenceRecording.findFirst.mockResolvedValue(recording())
    const out = await publishRecordingAsLessonVideo("s1", "c1", "egr-1")
    expect(out).toEqual({ published: true, videoId: "vid-1" })
    // Quota was answerable from fileSizeBytes alone — no HEAD round-trip.
    expect(getObjectSize).not.toHaveBeenCalled()
    expect(checkSchoolVideoQuota).toHaveBeenCalledWith(
      "s1",
      BigInt(150_000_000)
    )
    expect(copyObject).toHaveBeenCalledWith(
      "aldar-recordings-me-central-1",
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

  it("respects the school's storage quota — checked from fileSizeBytes BEFORE the copy, so nothing is ever written to S3", async () => {
    mockDb.conferenceRecording.findFirst.mockResolvedValue(recording())
    vi.mocked(checkSchoolVideoQuota).mockResolvedValue({
      allowed: false,
    } as never)
    expect(await publishRecordingAsLessonVideo("s1", "c1", "egr-1")).toEqual({
      published: false,
      reason: "quota",
    })
    expect(copyObject).not.toHaveBeenCalled()
    expect(deleteObject).not.toHaveBeenCalled()
    expect(mockDb.video.create).not.toHaveBeenCalled()
  })

  it("falls back to a post-copy HEAD when fileSizeBytes is null, and deletes the copy when quota is exceeded", async () => {
    mockDb.conferenceRecording.findFirst.mockResolvedValue(
      recording({ fileSizeBytes: null })
    )
    vi.mocked(checkSchoolVideoQuota).mockResolvedValue({
      allowed: false,
    } as never)
    expect(await publishRecordingAsLessonVideo("s1", "c1", "egr-1")).toEqual({
      published: false,
      reason: "quota",
    })
    // Unlike the pre-copy path, the size was only knowable after copying —
    // so the copy DID happen, and the leaked object must be cleaned up.
    expect(copyObject).toHaveBeenCalledWith(
      "aldar-recordings-me-central-1",
      "schools/s1/live-class/c1/1.mp4",
      "stream/s1/video/live-rec-1.mp4",
      "video/mp4"
    )
    expect(getObjectSize).toHaveBeenCalledWith("stream/s1/video/live-rec-1.mp4")
    expect(checkSchoolVideoQuota).toHaveBeenCalledWith("s1", 150_000_000)
    expect(deleteObject).toHaveBeenCalledWith("stream/s1/video/live-rec-1.mp4")
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
