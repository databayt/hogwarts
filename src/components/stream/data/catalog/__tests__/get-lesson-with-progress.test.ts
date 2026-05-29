// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { auth } from "@/auth"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"

import { getLessonWithProgress } from "../get-lesson-with-progress"

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock("@/auth", () => ({ auth: vi.fn() }))
vi.mock("@/lib/tenant-context", () => ({ getTenantContext: vi.fn() }))
vi.mock("@/lib/asset-url", () => ({ asset: (p: string) => p }))
vi.mock("@/lib/catalog-image-url", () => ({
  getCatalogImageUrl: (v: string | null) => v,
}))
// getVideoUrl is the boundary the paywall fix turns on. Encode isFree so tests
// can distinguish a SIGNED (paid, isFree:false) from an UNSIGNED (free) URL.
vi.mock("@/lib/cloudfront", () => ({
  getVideoUrl: (url: string, opts?: { isFree?: boolean }) =>
    opts?.isFree ? `unsigned:${url}` : `signed:${url}`,
}))

vi.mock("@/lib/db", () => ({
  db: {
    lesson: { findFirst: vi.fn(), findMany: vi.fn() },
    enrollment: { findFirst: vi.fn() },
    subject: { findUnique: vi.fn() },
    lessonProgress: { findUnique: vi.fn(), findMany: vi.fn() },
    attachment: { findMany: vi.fn() },
    video: { findMany: vi.fn() },
    videoPurchase: { findMany: vi.fn() },
    instructorPreference: { findUnique: vi.fn() },
  },
}))

const mockAuth = auth as unknown as ReturnType<typeof vi.fn>
const mockTenant = getTenantContext as ReturnType<typeof vi.fn>
const mLesson = db.lesson.findFirst as ReturnType<typeof vi.fn>
const mLessons = db.lesson.findMany as ReturnType<typeof vi.fn>
const mEnroll = db.enrollment.findFirst as ReturnType<typeof vi.fn>
const mSubject = db.subject.findUnique as ReturnType<typeof vi.fn>
const mProgress = db.lessonProgress.findUnique as ReturnType<typeof vi.fn>
const mSiblingProgress = db.lessonProgress.findMany as ReturnType<typeof vi.fn>
const mAttachments = db.attachment.findMany as ReturnType<typeof vi.fn>
const mVideos = db.video.findMany as ReturnType<typeof vi.fn>
const mPurchases = db.videoPurchase.findMany as ReturnType<typeof vi.fn>

const LESSON = {
  id: "lesson-1",
  name: "Algebra Basics",
  description: "desc",
  thumbnail: null,
  color: null,
  sequenceOrder: 1,
  durationMinutes: 10,
  videoCount: 1,
  createdAt: new Date("2026-01-01"),
  chapter: {
    id: "ch-1",
    name: "Chapter 1",
    sequenceOrder: 1,
    color: null,
    subject: {
      id: "subj-1",
      name: "Math",
      slug: "math",
      color: null,
      levels: [],
      grades: [],
      description: null,
      objectives: [],
      prerequisites: null,
      targetAudience: null,
    },
  },
}

function videoRow(over: Record<string, unknown> = {}) {
  return {
    id: "vid-free",
    videoUrl: "s3://v.mp4",
    thumbnailUrl: null,
    durationSeconds: 100,
    isFeatured: false,
    schoolId: "school-1",
    visibility: "SCHOOL",
    price: null,
    currency: null,
    user: { id: "u-t", username: "teacher", image: null, role: "TEACHER" },
    school: { id: "school-1", name: "School One" },
    ...over,
  }
}

beforeEach(() => {
  vi.clearAllMocks()
  mockAuth.mockResolvedValue({
    user: { id: "student-1", role: "STUDENT" },
  })
  mockTenant.mockResolvedValue({ schoolId: "school-1", subdomain: "demo" })
  mLesson.mockResolvedValue(LESSON)
  mEnroll.mockResolvedValue({ id: "enr-1" }) // enrolled by default
  mSubject.mockResolvedValue({ price: 0 })
  mProgress.mockResolvedValue(null)
  mAttachments.mockResolvedValue([])
  mVideos.mockResolvedValue([videoRow()])
  mPurchases.mockResolvedValue([])
  mLessons.mockResolvedValue([
    {
      id: "lesson-1",
      name: "Algebra Basics",
      sequenceOrder: 1,
      thumbnail: null,
      color: null,
      durationMinutes: 10,
      chapter: { sequenceOrder: 1, name: "Chapter 1", color: null },
    },
  ])
  mSiblingProgress.mockResolvedValue([])
})

describe("getLessonWithProgress — access", () => {
  it("returns null when unauthenticated", async () => {
    mockAuth.mockResolvedValueOnce(null)
    expect(await getLessonWithProgress("lesson-1")).toBeNull()
  })

  it("returns null when the lesson is not published / not found", async () => {
    mLesson.mockResolvedValueOnce(null)
    expect(await getLessonWithProgress("lesson-1")).toBeNull()
  })

  it("blocks a non-enrolled, non-admin user on a PAID subject", async () => {
    mEnroll.mockResolvedValueOnce(null) // not enrolled
    mSubject.mockResolvedValueOnce({ price: 50 }) // paid subject
    expect(await getLessonWithProgress("lesson-1")).toBeNull()
  })

  it("allows a non-enrolled, non-admin user on a FREE subject", async () => {
    mEnroll.mockResolvedValueOnce(null)
    mSubject.mockResolvedValueOnce({ price: 0 })
    const result = await getLessonWithProgress("lesson-1")
    expect(result).not.toBeNull()
  })

  it("allows admin/teacher without an enrollment check", async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: "admin-1", role: "ADMIN" } })
    const result = await getLessonWithProgress("lesson-1")
    expect(result).not.toBeNull()
    expect(mEnroll).not.toHaveBeenCalled()
  })
})

describe("getLessonWithProgress — PAID paywall (the P0)", () => {
  it("emits NO playable URL for a PAID video the user has not purchased", async () => {
    mVideos.mockResolvedValueOnce([
      videoRow({
        id: "vid-paid",
        visibility: "PAID",
        price: 19.99,
        currency: "USD",
      }),
    ])
    mPurchases.mockResolvedValueOnce([]) // not purchased

    const result = await getLessonWithProgress("lesson-1")
    expect(result).not.toBeNull()
    const paid = result!.availableVideos.find((v) => v.id === "vid-paid")!
    expect(paid.requiresPayment).toBe(true)
    expect(paid.hasPurchased).toBe(false)
    // The critical assertion: the server must NOT leak a playable URL.
    expect(paid.videoUrl).toBeNull()
    // And the default/top-level URL is likewise withheld.
    expect(result!.videoUrl).toBeNull()
  })

  it("emits a SIGNED URL for a PAID video the user HAS purchased", async () => {
    mVideos.mockResolvedValueOnce([
      videoRow({
        id: "vid-paid",
        visibility: "PAID",
        price: 19.99,
        currency: "USD",
      }),
    ])
    mPurchases.mockResolvedValueOnce([{ videoId: "vid-paid" }]) // SUCCESS purchase

    const result = await getLessonWithProgress("lesson-1")
    const paid = result!.availableVideos.find((v) => v.id === "vid-paid")!
    expect(paid.hasPurchased).toBe(true)
    // isFree:false → signed URL (the dead signing branch is now reached).
    expect(paid.videoUrl).toBe("signed:s3://v.mp4")
    expect(result!.videoUrl).toBe("signed:s3://v.mp4")
  })

  it("only counts SUCCESS purchases (query is status-scoped)", async () => {
    mVideos.mockResolvedValueOnce([
      videoRow({
        id: "vid-paid",
        visibility: "PAID",
        price: 5,
        currency: "USD",
      }),
    ])
    mPurchases.mockResolvedValueOnce([])
    await getLessonWithProgress("lesson-1")
    expect(mPurchases).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          userId: "student-1",
          status: "SUCCESS",
        }),
      })
    )
  })

  it("emits an UNSIGNED URL for a FREE video", async () => {
    mVideos.mockResolvedValueOnce([
      videoRow({ id: "vid-free", visibility: "SCHOOL" }),
    ])
    const result = await getLessonWithProgress("lesson-1")
    const free = result!.availableVideos.find((v) => v.id === "vid-free")!
    expect(free.requiresPayment).toBe(false)
    expect(free.hasPurchased).toBe(true)
    expect(free.videoUrl).toBe("unsigned:s3://v.mp4")
  })
})
