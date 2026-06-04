// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { auth } from "@/auth"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"

import { adminGetLesson } from "../admin-get-lesson"

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock("@/auth", () => ({ auth: vi.fn() }))

// notFound() throws in real Next.js; make the mock throw a recognizable error
// so we can assert the gate (and the missing-lesson path) reject.
vi.mock("next/navigation", () => ({
  notFound: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND")
  }),
}))

vi.mock("@/lib/db", () => ({
  db: {
    lesson: { findFirst: vi.fn() },
    video: { findMany: vi.fn() },
    attachment: { findMany: vi.fn() },
  },
}))

const mockAuth = auth as unknown as ReturnType<typeof vi.fn>
const mLesson = db.lesson.findFirst as ReturnType<typeof vi.fn>
const mVideos = db.video.findMany as ReturnType<typeof vi.fn>
const mAttachments = db.attachment.findMany as ReturnType<typeof vi.fn>

const LESSON = {
  id: "lesson-1",
  name: "Algebra Basics",
  description: "desc",
  sequenceOrder: 1,
  status: "PUBLISHED",
  durationMinutes: 10,
  objectives: [],
  levels: [],
  gradeRange: null,
  chapter: {
    id: "ch-1",
    name: "Chapter 1",
    subject: { id: "subj-1", name: "Math", slug: "math", status: "PUBLISHED" },
  },
}

const VIDEOS = [
  {
    id: "v-paid",
    title: "Paid take",
    videoUrl: "https://cdn/paid.mp4",
    thumbnailUrl: null,
    durationSeconds: 100,
    provider: "SELF_HOSTED",
    visibility: "PAID",
    approvalStatus: "APPROVED",
    isFeatured: true,
    viewCount: 9,
    averageRating: 0,
    user: { username: "teach", email: "t@x.io" },
  },
]

beforeEach(() => {
  vi.clearAllMocks()
  mLesson.mockResolvedValue(LESSON)
  mVideos.mockResolvedValue(VIDEOS)
  mAttachments.mockResolvedValue([])
})

// ---------------------------------------------------------------------------
// Authorization gate — the headline of this fix
// ---------------------------------------------------------------------------

describe("adminGetLesson — auth gate", () => {
  it("rejects anonymous callers (no session) without touching the DB", async () => {
    mockAuth.mockResolvedValueOnce(null)
    await expect(adminGetLesson("lesson-1", "school-1")).rejects.toThrow(
      "NEXT_NOT_FOUND"
    )
    expect(mLesson).not.toHaveBeenCalled()
  })

  it("rejects STUDENT", async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: "s-1", role: "STUDENT" } })
    await expect(adminGetLesson("lesson-1", "school-1")).rejects.toThrow(
      "NEXT_NOT_FOUND"
    )
    expect(mLesson).not.toHaveBeenCalled()
  })

  it("rejects TEACHER (not an admin role for this accessor)", async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: "t-1", role: "TEACHER" } })
    await expect(adminGetLesson("lesson-1", "school-1")).rejects.toThrow(
      "NEXT_NOT_FOUND"
    )
    expect(mLesson).not.toHaveBeenCalled()
  })

  it("allows ADMIN and returns the lesson shape", async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: "a-1", role: "ADMIN" } })
    const result = await adminGetLesson("lesson-1", "school-1")
    expect(result.id).toBe("lesson-1")
    expect(result.title).toBe("Algebra Basics")
    // Featured video's URL is surfaced as the default videoUrl.
    expect(result.videoUrl).toBe("https://cdn/paid.mp4")
    expect(result._catalog.videos).toHaveLength(1)
  })

  it("allows DEVELOPER (cross-school platform admin)", async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: "d-1", role: "DEVELOPER" } })
    const result = await adminGetLesson("lesson-1", null)
    expect(result.id).toBe("lesson-1")
  })
})

// ---------------------------------------------------------------------------
// Behavior (admin authorized)
// ---------------------------------------------------------------------------

describe("adminGetLesson — behavior", () => {
  beforeEach(() => {
    mockAuth.mockResolvedValue({ user: { id: "a-1", role: "ADMIN" } })
  })

  it("notFound() when the lesson does not exist", async () => {
    mLesson.mockResolvedValueOnce(null)
    await expect(adminGetLesson("missing", "school-1")).rejects.toThrow(
      "NEXT_NOT_FOUND"
    )
  })

  it("scopes the video query to the school OR public when schoolId given", async () => {
    await adminGetLesson("lesson-1", "school-1")
    expect(mVideos).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          catalogLessonId: "lesson-1",
          OR: [{ schoolId: "school-1" }, { visibility: "PUBLIC" }],
        }),
      })
    )
  })

  it("does not constrain by school when schoolId is null", async () => {
    await adminGetLesson("lesson-1", null)
    expect(mVideos).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { catalogLessonId: "lesson-1" },
      })
    )
  })
})
