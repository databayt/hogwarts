// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import {
  buildProtectedFileUrl,
  buildProtectedVideoUrl,
  denialStatus,
  isExternallyHostedVideo,
  resolveVideoAccess,
} from "@/components/lumos/video/media-access"

vi.mock("@/lib/db", () => ({
  db: {
    video: { findUnique: vi.fn() },
    videoPurchase: { findUnique: vi.fn() },
  },
}))

const mockVideo = db.video.findUnique as ReturnType<typeof vi.fn>
const mockPurchase = db.videoPurchase.findUnique as ReturnType<typeof vi.fn>

const STORAGE_URL =
  "https://hogwarts-databayt.s3.us-east-1.amazonaws.com/stream/school-1/video/123_lesson.mp4"

/** A self-hosted, approved video owned by `owner-1` at `school-1`. */
function video(overrides: Record<string, unknown> = {}) {
  return {
    id: "v-1",
    title: "Photosynthesis",
    userId: "owner-1",
    schoolId: "school-1",
    videoUrl: STORAGE_URL,
    storageKey: "stream/school-1/video/123_lesson.mp4",
    visibility: "SCHOOL",
    approvalStatus: "APPROVED",
    overrides: [],
    ...overrides,
  }
}

beforeEach(() => {
  vi.clearAllMocks()
  process.env.AWS_S3_BUCKET = "hogwarts-databayt"
  mockPurchase.mockResolvedValue(null)
})

describe("isExternallyHostedVideo", () => {
  it.each([
    ["https://www.youtube.com/watch?v=abc", true],
    ["https://youtu.be/abc", true],
    ["https://vimeo.com/123", true],
    [STORAGE_URL, false],
    ["https://cdn.databayt.org/stream/x.mp4", false],
  ])("%s → %s", (url, expected) => {
    expect(isExternallyHostedVideo(url)).toBe(expected)
  })

  it("does not match a lookalike host", () => {
    // Guards against a substring check letting `youtube.com.evil.test` pass.
    expect(isExternallyHostedVideo("https://youtube.com.evil.test/x")).toBe(
      false
    )
  })

  it("is false for null", () => {
    expect(isExternallyHostedVideo(null)).toBe(false)
  })
})

describe("protected URL builders", () => {
  it("keeps the id opaque and the path relative", () => {
    expect(buildProtectedVideoUrl("v-1")).toBe("/api/lumos/video/v-1")
    expect(buildProtectedFileUrl("material", "m-1")).toBe(
      "/api/lumos/file/material/m-1"
    )
  })
})

describe("resolveVideoAccess", () => {
  it("grants the owner regardless of visibility or approval", async () => {
    mockVideo.mockResolvedValue(
      video({ visibility: "PRIVATE", approvalStatus: "PENDING" })
    )

    const result = await resolveVideoAccess({
      videoId: "v-1",
      userId: "owner-1",
      schoolId: null,
    })

    expect(result).toEqual({
      ok: true,
      storageKey: "stream/school-1/video/123_lesson.mp4",
      title: "Photosynthesis",
    })
  })

  it("denies a PRIVATE video to a member of the owning school", async () => {
    // The bug this guards: a bare `{ schoolId }` arm turned PRIVATE into
    // school-wide, and made revoke-to-PRIVATE a paywall bypass.
    mockVideo.mockResolvedValue(video({ visibility: "PRIVATE" }))

    const result = await resolveVideoAccess({
      videoId: "v-1",
      userId: "student-9",
      schoolId: "school-1",
    })

    expect(result).toEqual({ ok: false, reason: "forbidden" })
  })

  it("grants a SCHOOL video only inside the owning school", async () => {
    mockVideo.mockResolvedValue(video())

    await expect(
      resolveVideoAccess({
        videoId: "v-1",
        userId: "student-9",
        schoolId: "school-1",
      })
    ).resolves.toMatchObject({ ok: true })

    mockVideo.mockResolvedValue(video())
    await expect(
      resolveVideoAccess({
        videoId: "v-1",
        userId: "student-9",
        schoolId: "school-2",
      })
    ).resolves.toEqual({ ok: false, reason: "forbidden" })
  })

  it("lets a school ADMIN play their own school's PENDING video", async () => {
    // The review queue is entirely PENDING — refusing reviewers here would
    // make /lumos/review unable to play what it is reviewing.
    mockVideo.mockResolvedValue(
      video({ visibility: "PRIVATE", approvalStatus: "PENDING" })
    )

    await expect(
      resolveVideoAccess({
        videoId: "v-1",
        userId: "admin-1",
        schoolId: "school-1",
        role: "ADMIN",
      })
    ).resolves.toMatchObject({ ok: true })
  })

  it("denies an ADMIN of a DIFFERENT school", async () => {
    mockVideo.mockResolvedValue(
      video({ visibility: "SCHOOL", approvalStatus: "PENDING" })
    )

    await expect(
      resolveVideoAccess({
        videoId: "v-1",
        userId: "admin-2",
        schoolId: "school-2",
        role: "ADMIN",
      })
    ).resolves.toEqual({ ok: false, reason: "not-approved" })
  })

  it("lets a DEVELOPER play a PENDING video from any school", async () => {
    mockVideo.mockResolvedValue(
      video({ visibility: "PAID", approvalStatus: "PENDING" })
    )

    await expect(
      resolveVideoAccess({
        videoId: "v-1",
        userId: "dev-1",
        schoolId: null,
        role: "DEVELOPER",
      })
    ).resolves.toMatchObject({ ok: true })
  })

  it("gives a TEACHER no review privilege", async () => {
    mockVideo.mockResolvedValue(
      video({ visibility: "SCHOOL", approvalStatus: "PENDING" })
    )

    await expect(
      resolveVideoAccess({
        videoId: "v-1",
        userId: "teacher-9",
        schoolId: "school-1",
        role: "TEACHER",
      })
    ).resolves.toEqual({ ok: false, reason: "not-approved" })
  })

  it("denies an unapproved video to everyone but its owner", async () => {
    mockVideo.mockResolvedValue(
      video({ visibility: "PUBLIC", approvalStatus: "PENDING" })
    )

    const result = await resolveVideoAccess({
      videoId: "v-1",
      userId: "student-9",
      schoolId: "school-1",
    })

    expect(result).toEqual({ ok: false, reason: "not-approved" })
  })

  it("denies a PAID video without a SUCCESS purchase", async () => {
    mockVideo.mockResolvedValue(video({ visibility: "PAID" }))
    mockPurchase.mockResolvedValue({ status: "PENDING" })

    const result = await resolveVideoAccess({
      videoId: "v-1",
      userId: "student-9",
      schoolId: "school-1",
    })

    expect(result).toEqual({ ok: false, reason: "payment-required" })
  })

  it("grants a PAID video once the purchase succeeded", async () => {
    mockVideo.mockResolvedValue(video({ visibility: "PAID" }))
    mockPurchase.mockResolvedValue({ status: "SUCCESS" })

    await expect(
      resolveVideoAccess({
        videoId: "v-1",
        userId: "student-9",
        schoolId: "school-1",
      })
    ).resolves.toMatchObject({ ok: true })
  })

  it("honours a school's ContentOverride hide", async () => {
    mockVideo.mockResolvedValue(
      video({ visibility: "PUBLIC", overrides: [{ id: "o-1" }] })
    )

    const result = await resolveVideoAccess({
      videoId: "v-1",
      userId: "student-9",
      schoolId: "school-1",
    })

    expect(result).toEqual({ ok: false, reason: "forbidden" })
  })

  it("refuses to sign an externally hosted video", async () => {
    mockVideo.mockResolvedValue(
      video({
        visibility: "PUBLIC",
        videoUrl: "https://www.youtube.com/watch?v=abc",
        storageKey: null,
      })
    )

    const result = await resolveVideoAccess({
      videoId: "v-1",
      userId: "student-9",
      schoolId: "school-1",
    })

    expect(result).toEqual({ ok: false, reason: "not-found" })
  })

  it("reports not-found for a missing row", async () => {
    mockVideo.mockResolvedValue(null)

    await expect(
      resolveVideoAccess({
        videoId: "nope",
        userId: "student-9",
        schoolId: "school-1",
      })
    ).resolves.toEqual({ ok: false, reason: "not-found" })
  })
})

describe("denialStatus", () => {
  it("maps reasons to statuses without leaking existence", () => {
    expect(denialStatus("not-found")).toBe(404)
    expect(denialStatus("payment-required")).toBe(402)
    expect(denialStatus("forbidden")).toBe(403)
    expect(denialStatus("not-approved")).toBe(403)
  })
})
