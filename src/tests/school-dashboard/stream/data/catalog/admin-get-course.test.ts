// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { auth } from "@/auth"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"

import { adminGetCatalogCourse } from "@/components/stream/data/catalog/admin-get-course"

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock("@/auth", () => ({ auth: vi.fn() }))
vi.mock("@/components/catalog/image-url", () => ({
  getCatalogImageUrl: (v: string | null) => v,
}))

// notFound() throws in real Next.js; mirror that so the gate + missing-subject
// paths are observable in tests.
vi.mock("next/navigation", () => ({
  notFound: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND")
  }),
}))

vi.mock("@/lib/db", () => ({
  db: {
    subject: { findFirst: vi.fn() },
    contentOverride: { findMany: vi.fn() },
  },
}))

const mockAuth = auth as unknown as ReturnType<typeof vi.fn>
const mSubject = db.subject.findFirst as ReturnType<typeof vi.fn>
const mOverrides = db.contentOverride.findMany as ReturnType<typeof vi.fn>

const SUBJECT = {
  id: "subj-1",
  name: "Math",
  slug: "math",
  description: "desc",
  thumbnail: null,
  status: "PUBLISHED",
  department: "Science",
  levels: [],
  color: null,
  totalChapters: 1,
  totalLessons: 2,
  chapters: [
    {
      id: "ch-1",
      name: "Chapter 1",
      sequenceOrder: 1,
      status: "PUBLISHED",
      lessons: [
        {
          id: "l-1",
          name: "L1",
          slug: "l1",
          sequenceOrder: 1,
          durationMinutes: 5,
          status: "PUBLISHED",
          description: "d1",
        },
        {
          id: "l-2",
          name: "L2",
          slug: "l2",
          sequenceOrder: 2,
          durationMinutes: 5,
          status: "PUBLISHED",
          description: "d2",
        },
      ],
    },
  ],
}

beforeEach(() => {
  vi.clearAllMocks()
  mSubject.mockResolvedValue(SUBJECT)
  mOverrides.mockResolvedValue([])
})

describe("adminGetCatalogCourse — auth gate", () => {
  it("rejects anonymous callers without touching the DB", async () => {
    mockAuth.mockResolvedValueOnce(null)
    await expect(adminGetCatalogCourse("subj-1", "school-1")).rejects.toThrow(
      "NEXT_NOT_FOUND"
    )
    expect(mSubject).not.toHaveBeenCalled()
  })

  it("rejects STUDENT", async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: "s-1", role: "STUDENT" } })
    await expect(adminGetCatalogCourse("subj-1", "school-1")).rejects.toThrow(
      "NEXT_NOT_FOUND"
    )
    expect(mSubject).not.toHaveBeenCalled()
  })

  it("rejects TEACHER", async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: "t-1", role: "TEACHER" } })
    await expect(adminGetCatalogCourse("subj-1", "school-1")).rejects.toThrow(
      "NEXT_NOT_FOUND"
    )
    expect(mSubject).not.toHaveBeenCalled()
  })

  it("allows ADMIN and returns the subject shape", async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: "a-1", role: "ADMIN" } })
    const result = await adminGetCatalogCourse("subj-1", "school-1")
    expect(result.id).toBe("subj-1")
    expect(result.chapters).toHaveLength(1)
    expect(result.chapters[0].lessons).toHaveLength(2)
  })

  it("allows DEVELOPER", async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: "d-1", role: "DEVELOPER" } })
    const result = await adminGetCatalogCourse("subj-1", null)
    expect(result.id).toBe("subj-1")
  })
})

describe("adminGetCatalogCourse — behavior", () => {
  beforeEach(() => {
    mockAuth.mockResolvedValue({ user: { id: "a-1", role: "ADMIN" } })
  })

  it("notFound() when the subject is missing", async () => {
    mSubject.mockResolvedValueOnce(null)
    await expect(adminGetCatalogCourse("missing", "school-1")).rejects.toThrow(
      "NEXT_NOT_FOUND"
    )
  })

  it("flags chapters/lessons hidden for the school via ContentOverride", async () => {
    mOverrides.mockResolvedValueOnce([
      { catalogChapterId: null, catalogLessonId: "l-2" },
    ])
    const result = await adminGetCatalogCourse("subj-1", "school-1")
    const lessons = result.chapters[0].lessons
    expect(lessons.find((l) => l.id === "l-1")?._isHidden).toBe(false)
    expect(lessons.find((l) => l.id === "l-2")?._isHidden).toBe(true)
  })

  it("skips the override lookup entirely when schoolId is null", async () => {
    await adminGetCatalogCourse("subj-1", null)
    expect(mOverrides).not.toHaveBeenCalled()
  })
})
