// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import {
  finalizeAbandonedSessions,
  sessionDeadline,
  snapshotAnswersBy,
  SUBMIT_GRACE_MS,
} from "@/components/school-dashboard/exams/take/finalize-session"

vi.mock("server-only", () => ({}))
vi.mock("@/lib/db", () => ({
  db: {
    examSession: { findMany: vi.fn(), updateMany: vi.fn() },
    studentAnswer: { upsert: vi.fn() },
    generatedExam: { findFirst: vi.fn() },
    $transaction: vi.fn(),
  },
}))
vi.mock("@/components/school-dashboard/exams/mark/actions/finalize", () => ({
  finalizeStudentExam: vi.fn(),
}))

const EXAM = { duration: 30, allowLateSubmit: false, lateSubmitMinutes: 0 }
const START = new Date("2026-10-19T08:00:00Z")
const DEADLINE = new Date(START.getTime() + 30 * 60_000 + SUBMIT_GRACE_MS)
const ANSWERS = [{ questionId: "q1", selectedOptionIds: ["o1"] }]

describe("sessionDeadline", () => {
  it("adds the network grace even with no late allowance", () => {
    expect(sessionDeadline({ startedAt: START, exam: EXAM })).toEqual(DEADLINE)
  })

  it("adds the late allowance when the exam allows it", () => {
    const d = sessionDeadline({
      startedAt: START,
      exam: { ...EXAM, allowLateSubmit: true, lateSubmitMinutes: 5 },
    })
    expect(d?.getTime()).toBe(DEADLINE.getTime() + 5 * 60_000)
  })
})

// The auto-submit at time-up lands just after the deadline. It used to be
// refused and the attempt EXPIRED with every answer lost.
describe("snapshotAnswersBy", () => {
  it("returns what was auto-saved by the deadline", () => {
    const saved = new Date(DEADLINE.getTime() - 60_000)
    expect(snapshotAnswersBy({ answers: ANSWERS }, saved, DEADLINE)).toEqual(
      ANSWERS
    )
  })

  it("refuses a snapshot saved after the deadline — no extra time", () => {
    const saved = new Date(DEADLINE.getTime() + 1_000)
    expect(snapshotAnswersBy({ answers: ANSWERS }, saved, DEADLINE)).toEqual([])
  })

  it("tolerates a missing or malformed snapshot", () => {
    expect(snapshotAnswersBy(null, null, DEADLINE)).toEqual([])
    expect(snapshotAnswersBy({ answers: "x" }, null, DEADLINE)).toEqual([])
  })
})

describe("finalizeAbandonedSessions", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(db.$transaction).mockImplementation(async (cb: any) =>
      cb({
        examSession: { updateMany: async () => ({ count: 1 }) },
        studentAnswer: { upsert: db.studentAnswer.upsert },
      })
    )
  })

  it("submits a past-deadline attempt from its snapshot, and expires an empty one", async () => {
    vi.mocked(db.examSession.findMany).mockResolvedValue([
      {
        id: "s1",
        schoolId: "school1",
        examId: "e1",
        studentId: "st1",
        startedAt: START,
        lastSavedAt: new Date(START.getTime() + 10 * 60_000),
        answerSnapshot: { answers: ANSWERS },
        exam: EXAM,
      },
      {
        id: "s2",
        schoolId: "school1",
        examId: "e1",
        studentId: "st2",
        startedAt: START,
        lastSavedAt: null,
        answerSnapshot: null,
        exam: EXAM,
      },
    ] as never)
    vi.mocked(db.examSession.updateMany).mockResolvedValue({ count: 1 })

    const res = await finalizeAbandonedSessions()

    expect(res).toEqual({ submitted: 1, expired: 1 })
    expect(db.studentAnswer.upsert).toHaveBeenCalledTimes(1)
    expect(db.examSession.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ id: "s2", status: "IN_PROGRESS" }),
        data: { status: "EXPIRED" },
      })
    )
  })

  it("leaves an attempt that is still inside its time", async () => {
    vi.mocked(db.examSession.findMany).mockResolvedValue([
      {
        id: "s3",
        schoolId: "school1",
        examId: "e1",
        studentId: "st3",
        startedAt: new Date(),
        lastSavedAt: null,
        answerSnapshot: { answers: ANSWERS },
        exam: EXAM,
      },
    ] as never)

    const res = await finalizeAbandonedSessions()

    expect(res).toEqual({ submitted: 0, expired: 0 })
    expect(db.$transaction).not.toHaveBeenCalled()
  })
})
