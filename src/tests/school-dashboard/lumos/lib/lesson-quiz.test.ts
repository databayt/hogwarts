// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { beforeEach, describe, expect, it, vi } from "vitest"

import { db } from "@/lib/db"
import {
  fetchLessonQuizQuestions,
  gradeQuestion,
  LESSON_QUIZ_LIMIT,
  toClientQuestion,
  type LessonQuizRow,
} from "@/components/lumos/lib/lesson-quiz"

vi.mock("@/lib/db", () => ({
  db: {
    contentOverride: { findFirst: vi.fn() },
    question: { findMany: vi.fn() },
  },
}))

const mockOverride = db.contentOverride.findFirst as ReturnType<typeof vi.fn>
const mockQuestions = db.question.findMany as ReturnType<typeof vi.fn>

const choice = (overrides: Partial<LessonQuizRow> = {}): LessonQuizRow => ({
  id: "q-1",
  questionText: "2 + 2 = ?",
  questionType: "MULTIPLE_CHOICE",
  options: [
    { text: "3", isCorrect: false },
    { text: "4", isCorrect: true },
  ],
  sampleAnswer: null,
  explanation: "Two plus two.",
  ...overrides,
})

const fillBlank = (overrides: Partial<LessonQuizRow> = {}): LessonQuizRow => ({
  id: "q-2",
  questionText: "The capital of Sudan is ___",
  questionType: "FILL_BLANK",
  options: { acceptedAnswers: ["Khartoum", "الخرطوم"], caseSensitive: false },
  sampleAnswer: null,
  explanation: null,
  ...overrides,
})

beforeEach(() => {
  vi.clearAllMocks()
  mockOverride.mockResolvedValue(null)
  mockQuestions.mockResolvedValue([])
})

describe("fetchLessonQuizQuestions — the one question set", () => {
  it("short-circuits on the school's hideQuiz override", async () => {
    mockOverride.mockResolvedValueOnce({ id: "ov-1" })
    await expect(
      fetchLessonQuizQuestions("lesson-1", "school-1")
    ).resolves.toEqual([])
    expect(mockQuestions).not.toHaveBeenCalled()
  })

  it("skips the override lookup when there is no tenant", async () => {
    await fetchLessonQuizQuestions("lesson-1", null)
    expect(mockOverride).not.toHaveBeenCalled()
    // No school → PUBLIC only. A bare school arm here would leak SCHOOL rows.
    expect(mockQuestions.mock.calls[0][0].where.OR).toEqual([
      { visibility: "PUBLIC" },
    ])
  })

  it("drops questions with no usable answer key, and backfills", async () => {
    // The verified SD curriculum stores FILL_BLANK with `options: null` — no
    // accepted answers at all. Counting those would cap a whole cohort's score
    // (sd-g12-commerce "Consolidation" topped out at 70%) and, worse, ask a
    // student to answer something that can never be right.
    mockQuestions.mockResolvedValueOnce([
      fillBlank({ id: "keyless-1", options: null }),
      choice({ id: "ok-1" }),
      fillBlank({ id: "keyless-2", options: { acceptedAnswers: [] } }),
      choice({ id: "no-correct", options: [{ text: "a", isCorrect: false }] }),
      choice({ id: "ok-2" }),
      fillBlank({ id: "ok-3" }),
    ])
    const rows = await fetchLessonQuizQuestions("lesson-1", "school-1")
    expect(rows.map((r) => r.id)).toEqual(["ok-1", "ok-2", "ok-3"])
  })

  it("over-fetches so dropped rows can be backfilled", async () => {
    await fetchLessonQuizQuestions("lesson-1", "school-1")
    expect(mockQuestions.mock.calls[0][0].take).toBeGreaterThan(
      LESSON_QUIZ_LIMIT
    )
  })

  it("never returns more than the shared limit after filtering", async () => {
    mockQuestions.mockResolvedValueOnce(
      Array.from({ length: 30 }, (_, i) => choice({ id: `q-${i}` }))
    )
    const rows = await fetchLessonQuizQuestions("lesson-1", "school-1")
    expect(rows).toHaveLength(LESSON_QUIZ_LIMIT)
  })

  it("orders deterministically and caps at the shared limit", async () => {
    await fetchLessonQuizQuestions("lesson-1", "school-1")
    const args = mockQuestions.mock.calls[0][0]
    // The id tiebreaker matters: bulk-seeded questions share a createdAt, and
    // without it the render and the grade could take two different ten.
    expect(args.orderBy).toEqual([{ createdAt: "asc" }, { id: "asc" }])
  })
})

describe("toClientQuestion — no answer key leaves the server", () => {
  it("returns choice labels only, in grading order", () => {
    const q = toClientQuestion(choice())
    expect(q.choices).toEqual(["3", "4"])
    expect(JSON.stringify(q)).not.toContain("isCorrect")
    expect(JSON.stringify(q)).not.toContain("Two plus two")
  })

  it("reads the demo seed's `label` shape as well as `text`", () => {
    const q = toClientQuestion(
      choice({
        options: [
          { label: "3", isCorrect: false },
          { label: "4", isCorrect: true },
        ],
      })
    )
    expect(q.choices).toEqual(["3", "4"])
  })

  it("hands FILL_BLANK a null choice list, never its accepted answers", () => {
    const q = toClientQuestion(fillBlank())
    expect(q.choices).toBeNull()
    expect(JSON.stringify(q)).not.toContain("Khartoum")
  })
})

describe("gradeQuestion", () => {
  it("marks the correct index correct and reveals it", () => {
    const v = gradeQuestion(choice(), {
      questionId: "q-1",
      selectedOptionIndex: 1,
    })
    expect(v.isCorrect).toBe(true)
    expect(v.correctIndex).toBe(1)
    expect(v.explanation).toBe("Two plus two.")
  })

  it("counts an unanswered question as wrong, not as skipped", () => {
    // Skipping used to `continue` before the denominator was incremented, so
    // answering 1 of 10 correctly and leaving the rest blank scored 100%.
    const v = gradeQuestion(choice(), undefined)
    expect(v.isCorrect).toBe(false)
    expect(v.correctIndex).toBe(1)
  })

  it("rejects an out-of-range index", () => {
    expect(
      gradeQuestion(choice(), { questionId: "q-1", selectedOptionIndex: 99 })
        .isCorrect
    ).toBe(false)
  })

  it("matches FILL_BLANK case-insensitively by default", () => {
    const v = gradeQuestion(fillBlank(), {
      questionId: "q-2",
      answerText: "  khartoum ",
    })
    expect(v.isCorrect).toBe(true)
    expect(v.correctAnswers).toEqual(["Khartoum", "الخرطوم"])
  })

  it("honours caseSensitive when set", () => {
    const row = fillBlank({
      options: { acceptedAnswers: ["Khartoum"], caseSensitive: true },
    })
    expect(
      gradeQuestion(row, { questionId: "q-2", answerText: "khartoum" })
        .isCorrect
    ).toBe(false)
    expect(
      gradeQuestion(row, { questionId: "q-2", answerText: "Khartoum" })
        .isCorrect
    ).toBe(true)
  })

  it("never scores an empty free-text answer as correct", () => {
    const row = fillBlank({ options: { acceptedAnswers: [""] } })
    expect(
      gradeQuestion(row, { questionId: "q-2", answerText: "" }).isCorrect
    ).toBe(false)
  })
})
