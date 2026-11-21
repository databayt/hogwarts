// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import {
  AI_DRAFT_STEP,
  persistDraft,
  schoolEndOfDay,
  type PersistInput,
} from "@/components/lesson-draft/persist"
import type { ValidDraft } from "@/components/lesson-draft/types"

const tx = {
  questionBank: { create: vi.fn(), deleteMany: vi.fn() },
  quickAssessment: { create: vi.fn(), findFirst: vi.fn(), deleteMany: vi.fn() },
  schoolAssignment: { create: vi.fn(), updateMany: vi.fn(), deleteMany: vi.fn() },
  conferenceResource: { create: vi.fn(), findFirst: vi.fn(), deleteMany: vi.fn() },
  conferenceEvent: { create: vi.fn() },
}
vi.mock("@/lib/db", () => ({ db: { $transaction: vi.fn() } }))

const SCHOOL = "school-1"
const draft: ValidDraft = {
  lang: "ar",
  dropped: 0,
  questions: Array.from({ length: 6 }, (_, i) => ({
    type: "MULTIPLE_CHOICE" as const,
    text: `سؤال ${i}`,
    options: [
      { text: "أ", isCorrect: true },
      { text: "ب", isCorrect: false },
      { text: "ج", isCorrect: false },
      { text: "د", isCorrect: false },
    ],
    explanation: "لأن",
    difficulty: "EASY" as const,
    bloom: "REMEMBER" as const,
  })),
  homework: { title: "واجب", instructions: "اكتب", points: 10, dueInDays: 2 },
}
const base: PersistInput = {
  actor: { userId: "u1", schoolId: SCHOOL },
  scope: { gradeId: "g1", sectionId: "s1", subjectId: "sub1", termId: "t1" },
  lesson: { id: "l1", name: "الدرس", chapterId: "c1" },
  draft,
  model: "claude-haiku-5-5",
  usage: { inputTokens: 100, outputTokens: 50, costUsd: 0.001 },
  sessionId: "sess1",
  homeworkOnly: false,
  requestId: "req1",
  timeZone: "Africa/Khartoum",
  now: new Date("2026-11-21T10:00:00Z"),
}

let qn = 0
beforeEach(() => {
  vi.clearAllMocks()
  qn = 0
  vi.mocked(db.$transaction).mockImplementation((async (fn: (t: unknown) => unknown) =>
    fn(tx)) as never)
  tx.questionBank.create.mockImplementation(async () => ({ id: `q${++qn}` }))
  tx.quickAssessment.create.mockResolvedValue({ id: "qa1" })
  tx.schoolAssignment.create.mockResolvedValue({ id: "hw1" })
  tx.schoolAssignment.updateMany.mockResolvedValue({ count: 1 })
  tx.conferenceResource.findFirst.mockResolvedValue({ order: 4 })
})

const everyWrite = () =>
  [
    ...tx.questionBank.create.mock.calls.map((c) => c[0].data),
    ...tx.quickAssessment.create.mock.calls.map((c) => c[0].data),
    ...tx.schoolAssignment.create.mock.calls.map((c) => c[0].data),
    ...tx.conferenceResource.create.mock.calls.map((c) => c[0].data),
    ...tx.conferenceEvent.create.mock.calls.map((c) => c[0].data),
  ]

describe("persistDraft", () => {
  it("writes everything in ONE transaction, every write with schoolId", async () => {
    const r = await persistDraft(base)
    expect(db.$transaction).toHaveBeenCalledTimes(1)
    expect(r).toEqual({ quickAssessmentId: "qa1", assignmentId: "hw1" })
    const writes = everyWrite()
    expect(writes.length).toBe(6 + 1 + 1 + 2 + 1)
    for (const w of writes) expect(w.schoolId).toBe(SCHOOL)
  })

  it("keeps the questions out of the shared bank with the ai-draft sentinel", async () => {
    await persistDraft(base)
    const q = tx.questionBank.create.mock.calls[0][0].data
    expect(q).toMatchObject({
      source: "AI",
      aiModel: "claude-haiku-5-5",
      wizardStep: AI_DRAFT_STEP,
      tags: ["ai-draft"],
      points: 1,
      catalogLessonId: "l1",
      catalogChapterId: "c1",
      createdBy: "u1",
    })
    expect(AI_DRAFT_STEP).toBe("ai-draft")
  })

  it("creates DRAFT quick check and DRAFT homework (wizardStep null)", async () => {
    await persistDraft(base)
    expect(tx.quickAssessment.create.mock.calls[0][0].data).toMatchObject({
      status: "DRAFT",
      type: "EXIT_TICKET",
      lang: "ar",
      questionIds: ["q1", "q2", "q3", "q4", "q5", "q6"],
      duration: 6,
      createdBy: "u1",
    })
    expect(tx.schoolAssignment.create.mock.calls[0][0].data).toMatchObject({
      status: "DRAFT",
      wizardStep: null,
      type: "HOMEWORK",
      weight: 1,
      totalPoints: 10,
      catalogLessonId: "l1",
      termId: "t1",
      createdById: "u1",
    })
  })

  it("links both after the current max order and records provenance", async () => {
    await persistDraft(base)
    const orders = tx.conferenceResource.create.mock.calls.map((c) => c[0].data)
    expect(orders[0]).toMatchObject({ quickAssessmentId: "qa1", order: 5 })
    expect(orders[1]).toMatchObject({ schoolAssignmentId: "hw1", order: 6 })
    expect(tx.conferenceEvent.create.mock.calls[0][0].data).toMatchObject({
      eventType: "lesson_draft",
      eventId: "ld:sess1:req1",
      payload: {
        quickAssessmentId: "qa1",
        assignmentId: "hw1",
        questionIds: ["q1", "q2", "q3", "q4", "q5", "q6"],
        model: "claude-haiku-5-5",
        inputTokens: 100,
        outputTokens: 50,
        costUsd: 0.001,
      },
    })
  })

  it("due date is 23:59 on the school's wall clock", async () => {
    await persistDraft(base)
    // 2 days after 2026-11-21 (Khartoum, UTC+2) -> 2026-11-23 23:59 +02:00
    expect(tx.schoolAssignment.create.mock.calls[0][0].data.dueDate).toEqual(
      new Date("2026-11-23T21:59:00Z")
    )
  })

  it("replace deletes the old drafts, their hidden questions and links first", async () => {
    tx.quickAssessment.findFirst.mockResolvedValue({
      id: "old-qa",
      questionIds: ["oq1", "oq2"],
    })
    await persistDraft({
      ...base,
      replaceOf: { quickAssessmentId: "old-qa", assignmentId: "old-hw" },
    })
    expect(tx.conferenceResource.deleteMany).toHaveBeenCalledWith({
      where: {
        schoolId: SCHOOL,
        OR: [{ quickAssessmentId: "old-qa" }, { schoolAssignmentId: "old-hw" }],
      },
    })
    expect(tx.questionBank.deleteMany).toHaveBeenCalledWith({
      where: { schoolId: SCHOOL, id: { in: ["oq1", "oq2"] }, wizardStep: "ai-draft" },
    })
    expect(tx.quickAssessment.deleteMany).toHaveBeenCalledWith({
      where: { id: "old-qa", schoolId: SCHOOL, status: "DRAFT" },
    })
    expect(tx.schoolAssignment.deleteMany).toHaveBeenCalledWith({
      where: { id: "old-hw", schoolId: SCHOOL, status: "DRAFT" },
    })
    expect(db.$transaction).toHaveBeenCalledTimes(1)
  })

  it("wizard path updates the existing draft and creates no quick check", async () => {
    const r = await persistDraft({
      ...base,
      sessionId: undefined,
      assignmentId: "wiz1",
      homeworkOnly: true,
    })
    expect(r).toEqual({ quickAssessmentId: null, assignmentId: "wiz1" })
    expect(tx.schoolAssignment.updateMany).toHaveBeenCalledWith({
      where: { id: "wiz1", schoolId: SCHOOL, status: "DRAFT" },
      data: expect.objectContaining({
        title: "واجب",
        instructions: "اكتب",
        totalPoints: 10,
        catalogLessonId: "l1",
      }),
    })
    expect(tx.schoolAssignment.create).not.toHaveBeenCalled()
    expect(tx.questionBank.create).not.toHaveBeenCalled()
    expect(tx.quickAssessment.create).not.toHaveBeenCalled()
    expect(tx.conferenceResource.create).not.toHaveBeenCalled()
    expect(tx.conferenceEvent.create).not.toHaveBeenCalled()
  })

  it("wizard path refuses a draft that is gone or already published", async () => {
    tx.schoolAssignment.updateMany.mockResolvedValue({ count: 0 })
    await expect(
      persistDraft({ ...base, sessionId: undefined, assignmentId: "x", homeworkOnly: true })
    ).rejects.toMatchObject({ code: "NOT_FOUND" })
  })
})

describe("schoolEndOfDay", () => {
  it("falls back to UTC for an unknown zone", () => {
    expect(schoolEndOfDay(new Date("2026-11-21T10:00:00Z"), 1, "Not/AZone")).toEqual(
      new Date("2026-11-22T23:59:00Z")
    )
  })
})
