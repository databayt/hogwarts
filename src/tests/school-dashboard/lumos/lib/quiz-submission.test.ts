// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Attempt idempotency. The id is minted on the device, so the same submission
 * can reach the server twice (retry, two tabs draining one outbox). The second
 * arrival must hand back what the first stored — no regrade, no second
 * gradebook write, and never someone else's attempt.
 */

import { Prisma } from "@prisma/client"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import { fetchLessonQuizQuestions } from "@/components/lumos/lib/lesson-quiz"
import {
  ATTEMPT_ID_PATTERN,
  submitLessonQuizCore,
} from "@/components/lumos/lib/quiz-submission"
import { upsertGradebookResult } from "@/components/school-dashboard/grades/lib/gradebook"

vi.mock("@/lib/db", () => ({
  db: {
    lessonQuizAttempt: { findUnique: vi.fn(), create: vi.fn() },
    lesson: { findUnique: vi.fn() },
    student: { findFirst: vi.fn() },
  },
}))
vi.mock("@/components/lumos/lib/lesson-quiz", async (importActual) => {
  const actual =
    await importActual<typeof import("@/components/lumos/lib/lesson-quiz")>()
  return { ...actual, fetchLessonQuizQuestions: vi.fn() }
})
vi.mock("@/components/school-dashboard/grades/lib/gradebook", () => ({
  resolveStudentClassForSubject: vi.fn().mockResolvedValue("class-1"),
  upsertGradebookResult: vi.fn().mockResolvedValue({ id: "res-1" }),
}))

const m = <T>(fn: T) => fn as unknown as ReturnType<typeof vi.fn>
const mFind = m(db.lessonQuizAttempt.findUnique)
const mCreate = m(db.lessonQuizAttempt.create)
const mLesson = m(db.lesson.findUnique)
const mStudent = m(db.student.findFirst)
const mQuestions = m(fetchLessonQuizQuestions)
const mGradebook = m(upsertGradebookResult)

const QUESTIONS = [
  {
    id: "q1",
    questionText: "2+2",
    questionType: "MULTIPLE_CHOICE",
    options: [
      { text: "3", isCorrect: false },
      { text: "4", isCorrect: true },
    ],
    sampleAnswer: null,
    explanation: null,
  },
  {
    id: "q2",
    questionText: "3+3",
    questionType: "MULTIPLE_CHOICE",
    options: [
      { text: "6", isCorrect: true },
      { text: "7", isCorrect: false },
    ],
    sampleAnswer: null,
    explanation: null,
  },
]

const ANSWERS = [
  { questionId: "q1", selectedOptionIndex: 1 },
  { questionId: "q2", selectedOptionIndex: 1 },
]

beforeEach(() => {
  vi.clearAllMocks()
  mFind.mockResolvedValue(null)
  mCreate.mockResolvedValue({ id: "a1" })
  mQuestions.mockResolvedValue(QUESTIONS)
  mLesson.mockResolvedValue({
    name: "Addition",
    chapter: { subjectId: "subj-1" },
  })
  mStudent.mockResolvedValue({ id: "stu-1" })
  mGradebook.mockResolvedValue({ id: "res-1" })
})

describe("ATTEMPT_ID_PATTERN", () => {
  it("accepts cuids and UUIDs, rejects path-like ids", () => {
    expect(ATTEMPT_ID_PATTERN.test("clx1234567890abcdef")).toBe(true)
    expect(
      ATTEMPT_ID_PATTERN.test("3b241101-e2bb-4255-8caf-4136c566a962")
    ).toBe(true)
    expect(ATTEMPT_ID_PATTERN.test("../x")).toBe(false)
    expect(ATTEMPT_ID_PATTERN.test("short")).toBe(false)
  })
})

describe("submitLessonQuizCore", () => {
  it("grades a fresh attempt, stores it under the device id, and records the first gradebook row", async () => {
    const r = await submitLessonQuizCore({
      userId: "u1",
      schoolId: "school-1",
      lessonId: "lesson-1",
      answers: ANSWERS,
      attemptId: "attempt-000001",
      source: "offline",
      submittedAt: new Date("2026-08-28T20:00:00Z"),
    })
    expect(r.status).toBe("graded")
    if (r.status !== "graded") return
    expect(r.duplicate).toBe(false)
    expect(r.result).toMatchObject({
      score: 1,
      total: 2,
      percentage: 50,
      recorded: true,
    })
    expect(mCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          id: "attempt-000001",
          userId: "u1",
          schoolId: "school-1",
          catalogLessonId: "lesson-1",
          score: 1,
          total: 2,
          source: "offline",
          submittedAt: new Date("2026-08-28T20:00:00Z"),
        }),
        select: { id: true },
      })
    )
    expect(mGradebook).toHaveBeenCalledWith(
      expect.objectContaining({
        onlyIfAbsent: true,
        title: "Addition",
        maxScore: 2,
      })
    )
  })

  it("mints an id when the caller has none (online path)", async () => {
    await submitLessonQuizCore({
      userId: "u1",
      schoolId: null,
      lessonId: "lesson-1",
      answers: ANSWERS,
    })
    const id = mCreate.mock.calls[0][0].data.id
    expect(ATTEMPT_ID_PATTERN.test(id)).toBe(true)
  })

  it("replays a stored attempt: same score, no regrade write, no gradebook touch", async () => {
    mFind.mockResolvedValueOnce({
      userId: "u1",
      catalogLessonId: "lesson-1",
      answers: ANSWERS,
      score: 1,
      total: 2,
      percentage: 50,
    })
    const r = await submitLessonQuizCore({
      userId: "u1",
      schoolId: "school-1",
      lessonId: "lesson-1",
      answers: [],
      attemptId: "attempt-000001",
    })
    expect(r.status).toBe("graded")
    if (r.status !== "graded") return
    expect(r.duplicate).toBe(true)
    expect(r.result).toMatchObject({
      score: 1,
      total: 2,
      percentage: 50,
      recorded: false,
    })
    // the reveal is rebuilt from the STORED answers, not the empty replay body
    expect(r.result.verdicts.map((v) => v.isCorrect)).toEqual([true, false])
    expect(mCreate).not.toHaveBeenCalled()
    expect(mGradebook).not.toHaveBeenCalled()
  })

  it("refuses to replay another user's attempt id", async () => {
    mFind.mockResolvedValueOnce({
      userId: "someone-else",
      catalogLessonId: "lesson-1",
      answers: [],
      score: 2,
      total: 2,
      percentage: 100,
    })
    const r = await submitLessonQuizCore({
      userId: "u1",
      schoolId: null,
      lessonId: "lesson-1",
      answers: ANSWERS,
      attemptId: "attempt-000001",
    })
    expect(r).toEqual({ status: "forbidden" })
    expect(mCreate).not.toHaveBeenCalled()
  })

  it("treats a primary-key race as the duplicate it is", async () => {
    mCreate.mockRejectedValueOnce(
      new Prisma.PrismaClientKnownRequestError("dup", {
        code: "P2002",
        clientVersion: "test",
      })
    )
    mFind.mockResolvedValueOnce(null).mockResolvedValueOnce({
      userId: "u1",
      catalogLessonId: "lesson-1",
      answers: ANSWERS,
      score: 1,
      total: 2,
      percentage: 50,
    })
    const r = await submitLessonQuizCore({
      userId: "u1",
      schoolId: "school-1",
      lessonId: "lesson-1",
      answers: ANSWERS,
      attemptId: "attempt-000001",
    })
    expect(r.status).toBe("graded")
    if (r.status !== "graded") return
    expect(r.duplicate).toBe(true)
    expect(mGradebook).not.toHaveBeenCalled()
  })

  it("reports noQuestions when the lesson's quiz is hidden or empty", async () => {
    mQuestions.mockResolvedValueOnce([])
    const r = await submitLessonQuizCore({
      userId: "u1",
      schoolId: "school-1",
      lessonId: "lesson-1",
      answers: ANSWERS,
    })
    expect(r).toEqual({ status: "noQuestions" })
    expect(mCreate).not.toHaveBeenCalled()
  })

  it("still answers the score when the gradebook write throws", async () => {
    mGradebook.mockRejectedValueOnce(new Error("gradebook down"))
    const r = await submitLessonQuizCore({
      userId: "u1",
      schoolId: "school-1",
      lessonId: "lesson-1",
      answers: ANSWERS,
    })
    expect(r.status).toBe("graded")
    if (r.status !== "graded") return
    expect(r.result.recorded).toBe(false)
    expect(r.result.score).toBe(1)
  })
})
