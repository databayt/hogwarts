// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { auth } from "@/auth"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"

import { getCourseProgress } from "../get-course-progress"

vi.mock("@/auth", () => ({ auth: vi.fn() }))
vi.mock("@/lib/db", () => ({
  db: {
    lesson: { findMany: vi.fn() },
    lessonProgress: { findMany: vi.fn() },
  },
}))

const mockAuth = auth as unknown as ReturnType<typeof vi.fn>
const mLessons = db.lesson.findMany as ReturnType<typeof vi.fn>
const mProgress = db.lessonProgress.findMany as ReturnType<typeof vi.fn>

function lessons(n: number) {
  return Array.from({ length: n }, (_, i) => ({
    id: `l-${i}`,
    durationMinutes: 10,
  }))
}

beforeEach(() => {
  vi.clearAllMocks()
  mockAuth.mockResolvedValue({ user: { id: "u-1" } })
})

describe("getCourseProgress", () => {
  it("returns null when unauthenticated", async () => {
    mockAuth.mockResolvedValueOnce(null)
    expect(await getCourseProgress("subj-1")).toBeNull()
  })

  it("returns null for a subject with zero lessons", async () => {
    mLessons.mockResolvedValueOnce([])
    expect(await getCourseProgress("subj-1")).toBeNull()
  })

  it("returns null when the user has no progress rows yet", async () => {
    mLessons.mockResolvedValueOnce(lessons(4))
    mProgress.mockResolvedValueOnce([])
    expect(await getCourseProgress("subj-1")).toBeNull()
  })

  it("computes 50% for 2 completed of 4 lessons", async () => {
    mLessons.mockResolvedValueOnce(lessons(4))
    mProgress.mockResolvedValueOnce([
      {
        isCompleted: true,
        watchedSeconds: 600,
        totalSeconds: 600,
        updatedAt: new Date(),
      },
      {
        isCompleted: true,
        watchedSeconds: 600,
        totalSeconds: 600,
        updatedAt: new Date(),
      },
      {
        isCompleted: false,
        watchedSeconds: 100,
        totalSeconds: 600,
        updatedAt: new Date(),
      },
    ])
    const r = await getCourseProgress("subj-1")
    expect(r?.totalLessons).toBe(4)
    expect(r?.completedLessons).toBe(2)
    expect(r?.progressPercent).toBe(50)
  })

  it("computes 100% when all lessons are completed and never exceeds 100", async () => {
    mLessons.mockResolvedValueOnce(lessons(2))
    mProgress.mockResolvedValueOnce([
      {
        isCompleted: true,
        watchedSeconds: 600,
        totalSeconds: 600,
        updatedAt: new Date(),
      },
      {
        isCompleted: true,
        watchedSeconds: 600,
        totalSeconds: 600,
        updatedAt: new Date(),
      },
    ])
    const r = await getCourseProgress("subj-1")
    expect(r?.progressPercent).toBe(100)
    expect(r!.progressPercent).toBeLessThanOrEqual(100)
  })
})
