// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"
import { getLessonContent } from "@/components/lumos/data/catalog/get-lesson-content"

vi.mock("@/lib/tenant-context", () => ({
  getTenantContext: vi.fn(),
}))

vi.mock("@/lib/db", () => ({
  db: {
    contentOverride: { findFirst: vi.fn() },
    question: { findMany: vi.fn() },
  },
}))

const mockTenant = getTenantContext as ReturnType<typeof vi.fn>
const mockOverride = db.contentOverride.findFirst as ReturnType<typeof vi.fn>
const mockQuestions = db.question.findMany as ReturnType<typeof vi.fn>

beforeEach(() => {
  vi.clearAllMocks()
  mockTenant.mockResolvedValue({ schoolId: "school-1", subdomain: "demo" })
  mockOverride.mockResolvedValue(null) // quiz not hidden by default
  mockQuestions.mockResolvedValue([
    {
      id: "q-1",
      questionText: "2 + 2 = ?",
      questionType: "MULTIPLE_CHOICE",
      options: [
        { text: "3", isCorrect: false },
        { text: "4", isCorrect: true },
      ],
      sampleAnswer: "4",
      explanation: null,
    },
  ])
})

describe("getLessonContent — per-school quiz hide", () => {
  it("returns the lesson's questions when the quiz is not hidden", async () => {
    const result = await getLessonContent("lesson-1")
    expect(result.questions).toHaveLength(1)
    expect(mockQuestions).toHaveBeenCalledOnce()
  })

  it("never ships the answer key to the client", async () => {
    const result = await getLessonContent("lesson-1")
    const [question] = result.questions
    // Choice labels only, in grading order — no isCorrect, no sampleAnswer.
    expect(question.choices).toEqual(["3", "4"])
    expect(JSON.stringify(question)).not.toContain("isCorrect")
    expect(JSON.stringify(question)).not.toContain("sampleAnswer")
  })

  it("asks only for question types the quiz can grade AND render", async () => {
    await getLessonContent("lesson-1")
    const where = mockQuestions.mock.calls[0][0].where
    expect(where.questionType).toEqual({
      in: ["MULTIPLE_CHOICE", "TRUE_FALSE", "FILL_BLANK"],
    })
    expect(where.approvalStatus).toBe("APPROVED")
    expect(where.status).toBe("PUBLISHED")
    // The school's own contributions plus PUBLIC — never a bare schoolId arm.
    expect(where.OR).toEqual([
      { visibility: "PUBLIC" },
      { contributedSchoolId: "school-1" },
    ])
  })

  it("returns NO questions when the school hid this lesson's quiz", async () => {
    mockOverride.mockResolvedValueOnce({ id: "ov-1" }) // hideQuiz override exists
    const result = await getLessonContent("lesson-1")
    expect(result.questions).toEqual([])
    // Short-circuits before hitting the question table.
    expect(mockQuestions).not.toHaveBeenCalled()
  })

  it("checks every hide axis, scoped to (schoolId, lesson), in ONE query", async () => {
    await getLessonContent("lesson-1")
    expect(mockOverride).toHaveBeenCalledOnce()
    expect(mockOverride).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          schoolId: "school-1",
          OR: [
            // the quiz alone is switched off …
            { catalogLessonId: "lesson-1", hideQuiz: true },
            // … or the whole lesson is hidden …
            { catalogLessonId: "lesson-1", isHidden: true },
            // … or its chapter is.
            {
              isHidden: true,
              chapter: { lessons: { some: { id: "lesson-1" } } },
            },
          ],
        },
      })
    )
  })

  it("returns NO questions when the school hid the LESSON, not just the quiz", async () => {
    // The gate that matters for `submitLessonQuiz`: a student can POST a hidden
    // lesson's id directly, and before 2026-08-29 the quiz still graded and
    // wrote a score into the gradebook for content the school had removed.
    mockOverride.mockResolvedValueOnce({ id: "ov-hidden-lesson" })
    const result = await getLessonContent("lesson-1")
    expect(result.questions).toEqual([])
    expect(mockQuestions).not.toHaveBeenCalled()
  })

  it("skips the override check for individual (no-school) users", async () => {
    mockTenant.mockResolvedValueOnce({ schoolId: null, subdomain: null })
    const result = await getLessonContent("lesson-1")
    expect(mockOverride).not.toHaveBeenCalled()
    expect(result.questions).toHaveLength(1)
  })
})
