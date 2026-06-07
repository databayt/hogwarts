// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { auth } from "@/auth"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"

import { markLessonComplete } from "@/components/stream/dashboard/lesson/catalog-actions"

vi.mock("@/auth", () => ({ auth: vi.fn() }))
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }))
vi.mock("next/headers", () => ({
  cookies: vi.fn().mockResolvedValue({ get: () => ({ value: "en" }) }),
}))
vi.mock("@/components/stream/shared/email-service", () => ({
  sendCompletionEmail: vi.fn().mockResolvedValue(undefined),
}))
vi.mock("@/lib/db", () => ({
  db: {
    lesson: { findUnique: vi.fn(), findMany: vi.fn() },
    enrollment: { findFirst: vi.fn(), update: vi.fn() },
    lessonProgress: { upsert: vi.fn(), count: vi.fn() },
    subjectCertificate: { findFirst: vi.fn(), create: vi.fn() },
    user: { findUnique: vi.fn() },
    school: { findUnique: vi.fn() },
  },
}))

const mockAuth = auth as unknown as ReturnType<typeof vi.fn>
const mLesson = db.lesson.findUnique as ReturnType<typeof vi.fn>
const mLessons = db.lesson.findMany as ReturnType<typeof vi.fn>
const mEnroll = db.enrollment.findFirst as ReturnType<typeof vi.fn>
const mEnrollUpdate = db.enrollment.update as ReturnType<typeof vi.fn>
const mUpsert = db.lessonProgress.upsert as ReturnType<typeof vi.fn>
const mCount = db.lessonProgress.count as ReturnType<typeof vi.fn>
const mCertFind = db.subjectCertificate.findFirst as ReturnType<typeof vi.fn>
const mCertCreate = db.subjectCertificate.create as ReturnType<typeof vi.fn>
const mUser = db.user.findUnique as ReturnType<typeof vi.fn>

const LESSON = {
  id: "lesson-1",
  chapter: {
    subjectId: "subj-1",
    subject: { id: "subj-1", name: "Math", slug: "math" },
  },
}

beforeEach(() => {
  vi.clearAllMocks()
  mockAuth.mockResolvedValue({ user: { id: "student-1", role: "STUDENT" } })
  mLesson.mockResolvedValue(LESSON)
  mEnroll.mockResolvedValue({ id: "enr-1", schoolId: "school-1" })
  mUpsert.mockResolvedValue({})
  mEnrollUpdate.mockResolvedValue({})
  mCertFind.mockResolvedValue(null)
  mCertCreate.mockResolvedValue({})
  mUser.mockResolvedValue({ email: "s@x.com", username: "stu" })
})

describe("markLessonComplete (catalog)", () => {
  it("rejects a non-enrolled, non-admin user", async () => {
    mEnroll.mockResolvedValueOnce(null) // enrollment gate
    const r = await markLessonComplete("lesson-1", "math")
    expect(r.status).toBe("error")
    expect(mUpsert).not.toHaveBeenCalled()
  })

  it("marks progress but issues NO certificate on a non-final lesson", async () => {
    mLessons.mockResolvedValueOnce([{ id: "l1" }, { id: "l2" }, { id: "l3" }])
    mCount.mockResolvedValueOnce(1) // 1 of 3 done
    const r = await markLessonComplete("lesson-1", "math")
    expect(r.status).toBe("success")
    expect(mUpsert).toHaveBeenCalled()
    expect(mEnrollUpdate).not.toHaveBeenCalled()
    expect(mCertCreate).not.toHaveBeenCalled()
  })

  it("completes the course + issues ONE certificate when the final lesson is done", async () => {
    mLessons.mockResolvedValueOnce([{ id: "l1" }, { id: "l2" }])
    mCount.mockResolvedValueOnce(2) // all done
    const r = await markLessonComplete("lesson-1", "math")
    expect(r.status).toBe("success")
    expect(mEnrollUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ data: { status: "COMPLETED" } })
    )
    expect(mCertCreate).toHaveBeenCalledOnce()
  })

  it("does NOT issue a duplicate certificate when one already exists", async () => {
    mLessons.mockResolvedValueOnce([{ id: "l1" }, { id: "l2" }])
    mCount.mockResolvedValueOnce(2)
    mCertFind.mockResolvedValueOnce({ id: "cert-1" }) // already issued
    await markLessonComplete("lesson-1", "math")
    expect(mCertCreate).not.toHaveBeenCalled()
  })

  it("does not crash on a subject with zero published lessons", async () => {
    mLessons.mockResolvedValueOnce([])
    mCount.mockResolvedValueOnce(0)
    const r = await markLessonComplete("lesson-1", "math")
    expect(r.status).toBe("success")
    expect(mCertCreate).not.toHaveBeenCalled()
  })

  it("admin without enrollment gets a 'progress noted' no-op", async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: "admin-1", role: "ADMIN" } })
    mEnroll.mockResolvedValueOnce(null) // no enrollment row for admin
    const r = await markLessonComplete("lesson-1", "math")
    expect(r.status).toBe("success")
    expect(mUpsert).not.toHaveBeenCalled()
  })
})
