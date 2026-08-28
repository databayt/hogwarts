// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { auth } from "@/auth"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"
import { getLessonWithProgress } from "@/components/lumos/data/catalog/get-lesson-with-progress"

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock("@/auth", () => ({ auth: vi.fn() }))
vi.mock("@/lib/tenant-context", () => ({ getTenantContext: vi.fn() }))
vi.mock("@/lib/asset-url", () => ({ asset: (p: string) => p }))
vi.mock("@/components/catalog/image-url", () => ({
  getCatalogImageUrl: (v: string | null) => v,
}))
// The paywall boundary is now the emitted URL itself: an owned video resolves
// to the authorizing `/api/lumos/video/<id>` reference, an unowned PAID one to
// null. No storage URL is ever emitted, signed or otherwise.

vi.mock("@/lib/db", () => ({
  db: {
    lesson: { findFirst: vi.fn(), findMany: vi.fn() },
    enrollment: { findFirst: vi.fn() },
    subject: { findUnique: vi.fn() },
    lessonProgress: { findUnique: vi.fn(), findMany: vi.fn() },
    attachment: { findMany: vi.fn() },
    material: { findMany: vi.fn() },
    video: { findMany: vi.fn() },
    videoPurchase: { findMany: vi.fn() },
    instructorPreference: { findUnique: vi.fn() },
    schoolInstructorPolicy: { findUnique: vi.fn() },
    instructorBlock: { findMany: vi.fn() },
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
const mMaterials = db.material.findMany as ReturnType<typeof vi.fn>
const mVideos = db.video.findMany as ReturnType<typeof vi.fn>
const mPurchases = db.videoPurchase.findMany as ReturnType<typeof vi.fn>
const mPolicy = db.schoolInstructorPolicy.findUnique as ReturnType<typeof vi.fn>
const mBlocks = db.instructorBlock.findMany as ReturnType<typeof vi.fn>

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
  mMaterials.mockResolvedValue([])
  mVideos.mockResolvedValue([videoRow()])
  mPurchases.mockResolvedValue([])
  // No instructor policy by default — every video its school can see stays.
  mPolicy.mockResolvedValue(null)
  mBlocks.mockResolvedValue([])
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
    // Purchased → a playable reference, and never the storage URL.
    expect(paid.videoUrl).toBe("/api/lumos/video/vid-paid")
    expect(result!.videoUrl).toBe("/api/lumos/video/vid-paid")
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

  it("emits a protected reference — never the storage URL — for a FREE video", async () => {
    mVideos.mockResolvedValueOnce([
      videoRow({ id: "vid-free", visibility: "SCHOOL" }),
    ])
    const result = await getLessonWithProgress("lesson-1")
    const free = result!.availableVideos.find((v) => v.id === "vid-free")!
    expect(free.requiresPayment).toBe(false)
    expect(free.hasPurchased).toBe(true)
    expect(free.videoUrl).toBe("/api/lumos/video/vid-free")
    expect(free.videoUrl).not.toContain("s3://")
  })

  it("passes an external provider URL straight through", async () => {
    // YouTube/Vimeo are not ours to sign, and routing them through the
    // authorizing route would hand the player a redirect it cannot use.
    mVideos.mockResolvedValueOnce([
      videoRow({
        id: "vid-yt",
        visibility: "PUBLIC",
        videoUrl: "https://www.youtube.com/watch?v=abc",
      }),
    ])
    const result = await getLessonWithProgress("lesson-1")
    const yt = result!.availableVideos.find((v) => v.id === "vid-yt")!
    expect(yt.videoUrl).toBe("https://www.youtube.com/watch?v=abc")
  })
})

describe("getLessonWithProgress — visibility scoping (PRIVATE isolation)", () => {
  it("only surfaces the viewer's own video plus non-private school/public/paid", async () => {
    // The query must NOT match other people's PRIVATE videos via a bare
    // { schoolId } arm (the old leak + revoke-paywall-bypass). Assert the
    // exact OR shape the fix produces.
    await getLessonWithProgress("lesson-1")
    const call = mVideos.mock.calls[0][0] as {
      where: { OR: Array<Record<string, unknown>> }
    }
    expect(call.where.OR).toEqual([
      { userId: "student-1" },
      {
        schoolId: "school-1",
        visibility: { in: ["SCHOOL", "PUBLIC", "PAID"] },
      },
      { visibility: "PUBLIC" },
      { visibility: "PAID" },
    ])
    // No arm matches a PRIVATE video that isn't the viewer's own.
    const leaksPrivate = call.where.OR.some(
      (arm) => "schoolId" in arm && !("visibility" in arm) && !("userId" in arm)
    )
    expect(leaksPrivate).toBe(false)
  })
})

describe("getLessonWithProgress — lesson materials", () => {
  it("returns materials with the approval gate and school-or-public visibility", async () => {
    mMaterials.mockResolvedValueOnce([
      {
        id: "m1",
        title: "Worksheet",
        description: null,
        type: "WORKSHEET",
        fileUrl: "https://cdn/x.pdf",
        externalUrl: null,
      },
      {
        id: "m2",
        title: "Reading list",
        description: "Chapter 2",
        type: "REFERENCE",
        fileUrl: null,
        externalUrl: "https://example.com/reading",
      },
    ])
    const lesson = await getLessonWithProgress("lesson-1")
    expect(lesson?.materials).toEqual([
      // Self-hosted file → the authorizing route, not the stored URL.
      expect.objectContaining({ id: "m1", url: "/api/lumos/file/material/m1" }),
      // External link → someone else's host, passed through untouched.
      expect.objectContaining({ id: "m2", url: "https://example.com/reading" }),
    ])
    // Only approved+published rows, PUBLIC or contributed by the viewer's
    // own school — a foreign school's SCHOOL/PRIVATE material must not leak.
    expect(mMaterials).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          catalogLessonId: "lesson-1",
          approvalStatus: "APPROVED",
          status: "PUBLISHED",
          OR: [{ visibility: "PUBLIC" }, { contributedSchoolId: "school-1" }],
        }),
      })
    )
  })
})

describe("getLessonWithProgress — instructor policy", () => {
  const OTHER = () =>
    videoRow({
      id: "vid-other",
      schoolId: null,
      visibility: "PUBLIC",
      user: { id: "u-x", username: "other", image: null, role: "TEACHER" },
      school: null,
    })

  it("never serves a disabled instructor's video", async () => {
    mVideos.mockResolvedValueOnce([videoRow(), OTHER()])
    mBlocks.mockResolvedValueOnce([{ instructorKey: "teacher:u-t" }])

    const result = await getLessonWithProgress("lesson-1")
    // Gone from the switcher pills AND from the default the player loads —
    // a settings toggle that only hid the pill would still play the video.
    expect(result!.availableVideos.map((v) => v.id)).toEqual(["vid-other"])
    expect(result!.videoUrl).toBe("/api/lumos/video/vid-other")
  })

  it("serves only the locked instructor where they have a video", async () => {
    mVideos.mockResolvedValueOnce([videoRow(), OTHER()])
    mPolicy.mockResolvedValueOnce({
      lockedKey: "teacher:u-x",
      defaultKey: null,
    })

    const result = await getLessonWithProgress("lesson-1")
    expect(result!.availableVideos.map((v) => v.id)).toEqual(["vid-other"])
  })

  it("falls back to the rest on a lesson the lock does not cover", async () => {
    mVideos.mockResolvedValueOnce([videoRow()])
    mPolicy.mockResolvedValueOnce({
      lockedKey: "teacher:u-absent",
      defaultKey: null,
    })

    const result = await getLessonWithProgress("lesson-1")
    // A locked-but-uncovered lesson must not go video-less: the placeholder
    // records no progress and would dent course completion.
    expect(result!.availableVideos.map((v) => v.id)).toEqual(["vid-free"])
    expect(result!.videoUrl).toBe("/api/lumos/video/vid-free")
  })

  it("reads the policy even when the lesson has a single video", async () => {
    // The preference lookup is gated on videos.length > 1; the policy must not
    // be, or a block could never remove the only video there is.
    mVideos.mockResolvedValueOnce([videoRow()])
    mBlocks.mockResolvedValueOnce([{ instructorKey: "teacher:u-t" }])

    const result = await getLessonWithProgress("lesson-1")
    expect(result!.availableVideos).toEqual([])
    expect(result!.videoUrl).toBeNull()
  })
})
