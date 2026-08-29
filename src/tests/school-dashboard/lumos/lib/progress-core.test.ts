// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * The shared progress writer. Two things matter here beyond "it upserts":
 * the completion rule is the SERVER's (the player's `ended` event is only an
 * accelerator now), and a replayed offline sample can never regress a newer
 * row or un-complete a lesson.
 */

import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import {
  applyLessonProgress,
  completeLessonCore,
  isWatchedThrough,
} from "@/components/lumos/lib/progress-core"

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }))
vi.mock("next/headers", () => ({
  cookies: vi.fn().mockResolvedValue({ get: () => ({ value: "en" }) }),
  headers: vi.fn().mockResolvedValue({ get: () => null }),
}))
vi.mock("@/components/lumos/shared/email-service", () => ({
  sendCompletionEmail: vi.fn().mockResolvedValue(undefined),
}))
vi.mock("@/lib/db", () => ({
  db: {
    lesson: { findUnique: vi.fn(), findMany: vi.fn() },
    enrollment: { findFirst: vi.fn(), update: vi.fn() },
    lessonProgress: { findUnique: vi.fn(), upsert: vi.fn(), count: vi.fn() },
    subjectCertificate: { findFirst: vi.fn(), create: vi.fn() },
    contentOverride: { findMany: vi.fn() },
    user: { findUnique: vi.fn() },
    school: { findUnique: vi.fn() },
  },
}))

const m = <T>(fn: T) => fn as unknown as ReturnType<typeof vi.fn>
const mLesson = m(db.lesson.findUnique)
const mLessons = m(db.lesson.findMany)
const mEnroll = m(db.enrollment.findFirst)
const mEnrollUpdate = m(db.enrollment.update)
const mProgress = m(db.lessonProgress.findUnique)
const mUpsert = m(db.lessonProgress.upsert)
const mCount = m(db.lessonProgress.count)
const mCertFind = m(db.subjectCertificate.findFirst)
const mCertCreate = m(db.subjectCertificate.create)
const mOverrides = m(db.contentOverride.findMany)
const mUser = m(db.user.findUnique)

const LESSON = {
  id: "lesson-1",
  chapter: {
    subjectId: "subj-1",
    subject: { id: "subj-1", name: "Math", slug: "math" },
  },
}

beforeEach(() => {
  vi.clearAllMocks()
  mLesson.mockResolvedValue(LESSON)
  mEnroll.mockResolvedValue({ id: "enr-1", schoolId: "school-1" })
  mProgress.mockResolvedValue(null)
  mUpsert.mockResolvedValue({ id: "lp-1" })
  mLessons.mockResolvedValue([
    { id: "l1", chapterId: "c1" },
    { id: "l2", chapterId: "c1" },
  ])
  mOverrides.mockResolvedValue([])
  mCount.mockResolvedValue(1)
  mEnrollUpdate.mockResolvedValue({})
  mCertFind.mockResolvedValue(null)
  mCertCreate.mockResolvedValue({})
  mUser.mockResolvedValue({ email: "s@x.com", username: "stu" })
})

describe("isWatchedThrough", () => {
  it("takes the stricter of the 30s tail and the 90% mark", () => {
    // 60s clip: tail says 30, ratio says 54 → 54 wins
    expect(isWatchedThrough(53, 60)).toBe(false)
    expect(isWatchedThrough(54, 60)).toBe(true)
    // 1h lecture: tail says 3570, ratio says 3240 → 3570 wins
    expect(isWatchedThrough(3500, 3600)).toBe(false)
    expect(isWatchedThrough(3570, 3600)).toBe(true)
  })

  it("never completes without a known runtime", () => {
    expect(isWatchedThrough(100, null)).toBe(false)
    expect(isWatchedThrough(100, 0)).toBe(false)
  })
})

describe("applyLessonProgress", () => {
  it("reports notFound / noEnrollment as distinct outcomes, writing nothing", async () => {
    mLesson.mockResolvedValueOnce(null)
    expect(
      await applyLessonProgress({
        userId: "u1",
        lessonId: "x",
        watchedSeconds: 1,
        totalSeconds: 10,
      })
    ).toEqual({ status: "notFound" })

    mEnroll.mockResolvedValueOnce(null)
    expect(
      await applyLessonProgress({
        userId: "u1",
        lessonId: "lesson-1",
        watchedSeconds: 1,
        totalSeconds: 10,
      })
    ).toEqual({ status: "noEnrollment" })
    expect(mUpsert).not.toHaveBeenCalled()
  })

  it("ignores a replayed sample older than the stored row", async () => {
    mProgress.mockResolvedValueOnce({
      lastWatchedAt: new Date("2026-08-29T10:00:00Z"),
      isCompleted: false,
    })
    const r = await applyLessonProgress({
      userId: "u1",
      lessonId: "lesson-1",
      watchedSeconds: 5,
      totalSeconds: 100,
      at: new Date("2026-08-29T09:00:00Z"),
    })
    expect(r).toEqual({ status: "stale" })
    expect(mUpsert).not.toHaveBeenCalled()
  })

  it("saves a mid-video position without completing", async () => {
    const r = await applyLessonProgress({
      userId: "u1",
      lessonId: "lesson-1",
      watchedSeconds: 40,
      totalSeconds: 100,
    })
    expect(r).toEqual({ status: "saved", completed: false })
    expect(mUpsert).toHaveBeenCalledTimes(1)
    expect(mUpsert.mock.calls[0][0].update).toMatchObject({
      watchedSeconds: 40,
      totalSeconds: 100,
    })
    expect(mCount).not.toHaveBeenCalled()
  })

  it("completes the lesson server-side once the position crosses the mark", async () => {
    const r = await applyLessonProgress({
      userId: "u1",
      lessonId: "lesson-1",
      watchedSeconds: 95,
      totalSeconds: 100,
    })
    expect(r).toEqual({ status: "saved", completed: true })
    // position write + completion write
    expect(mUpsert).toHaveBeenCalledTimes(2)
    expect(mUpsert.mock.calls[1][0].update).toMatchObject({ isCompleted: true })
  })

  it("does not re-run completion for a row that is already complete", async () => {
    mProgress.mockResolvedValueOnce({
      lastWatchedAt: new Date("2026-08-01T00:00:00Z"),
      isCompleted: true,
    })
    const r = await applyLessonProgress({
      userId: "u1",
      lessonId: "lesson-1",
      watchedSeconds: 99,
      totalSeconds: 100,
    })
    expect(r).toEqual({ status: "saved", completed: true })
    expect(mUpsert).toHaveBeenCalledTimes(1)
    expect(mCount).not.toHaveBeenCalled()
  })

  it("stamps the replayed sample's own time, not the arrival time", async () => {
    const at = new Date("2026-08-28T20:00:00Z")
    await applyLessonProgress({
      userId: "u1",
      lessonId: "lesson-1",
      watchedSeconds: 10,
      totalSeconds: 100,
      at,
    })
    expect(mUpsert.mock.calls[0][0].update.lastWatchedAt).toEqual(at)
  })
})

describe("completeLessonCore", () => {
  it("issues ONE certificate when the last visible lesson completes", async () => {
    mCount.mockResolvedValueOnce(2)
    const r = await completeLessonCore({ userId: "u1", lessonId: "lesson-1" })
    expect(r).toEqual({ status: "completed", certificateIssued: true })
    expect(mEnrollUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ data: { status: "COMPLETED" } })
    )
    expect(mCertCreate).toHaveBeenCalledTimes(1)
  })

  it("does not re-issue when a certificate already exists", async () => {
    mCount.mockResolvedValueOnce(2)
    mCertFind.mockResolvedValueOnce({ id: "cert-1" })
    const r = await completeLessonCore({ userId: "u1", lessonId: "lesson-1" })
    expect(r).toEqual({ status: "completed", certificateIssued: false })
    expect(mCertCreate).not.toHaveBeenCalled()
  })

  it("excludes school-hidden lessons from the denominator", async () => {
    mOverrides.mockResolvedValueOnce([
      { catalogChapterId: null, catalogLessonId: "l2" },
    ])
    mCount.mockResolvedValueOnce(1) // l1 done, l2 hidden → all visible done
    const r = await completeLessonCore({ userId: "u1", lessonId: "lesson-1" })
    expect(r.status).toBe("completed")
    expect(mCertCreate).toHaveBeenCalledTimes(1)
  })
})
