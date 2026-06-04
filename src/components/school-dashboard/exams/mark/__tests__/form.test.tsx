// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * QuestionForm (Marking) smoke tests
 *
 * Confirms the marking question form mounts under create/edit modes without
 * throwing. Field-level interactions are exercised through E2E and the
 * action-layer tests, since this form depends on the Radix portal stack.
 */

import { render } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

if (typeof globalThis.ResizeObserver === "undefined") {
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as any
}
if (
  typeof window !== "undefined" &&
  !window.HTMLElement.prototype.hasPointerCapture
) {
  window.HTMLElement.prototype.hasPointerCapture = () => false
  window.HTMLElement.prototype.releasePointerCapture = () => {}
  window.HTMLElement.prototype.scrollIntoView = () => {}
}

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}))

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

vi.mock("../actions", () => ({
  createQuestion: vi.fn().mockResolvedValue({ success: true }),
  updateQuestion: vi.fn().mockResolvedValue({ success: true }),
}))

const dictionary = {
  marking: {
    questionForm: {
      questionText: "Question Text",
      questionTextPlaceholder: "Enter question",
      questionType: "Question Type",
      selectQuestionType: "Select type",
      difficulty: "Difficulty",
      selectDifficulty: "Select difficulty",
      bloomLevel: "Bloom Level",
      selectBloomLevel: "Select level",
      points: "Points",
      pointsPlaceholder: "1",
      timeEstimate: "Time Estimate",
      timeEstimatePlaceholder: "5",
      explanation: "Explanation",
      explanationPlaceholder: "Optional",
      sampleAnswer: "Sample Answer",
      sampleAnswerPlaceholder: "Optional",
      imageUrl: "Image URL",
      imageUrlPlaceholder: "https://...",
      tags: "Tags",
      tagsPlaceholder: "Comma separated",
    },
    options: {
      title: "Options",
      addOption: "Add Option",
      atLeastTwo: "At least two",
      isCorrect: "Correct",
      optionText: "Option text",
    },
    buttons: {
      createQuestion: "Create",
      saveQuestion: "Save",
      next: "Next",
      previous: "Previous",
    },
    messages: {
      questionCreated: "Created",
      questionUpdated: "Updated",
      error: "Error",
    },
    difficulty: { EASY: "Easy", MEDIUM: "Medium", HARD: "Hard" },
    bloomLevels: {
      REMEMBER: "Remember",
      UNDERSTAND: "Understand",
      APPLY: "Apply",
      ANALYZE: "Analyze",
      EVALUATE: "Evaluate",
      CREATE: "Create",
    },
    questionTypes: {
      MULTIPLE_CHOICE: "Multiple Choice",
      TRUE_FALSE: "True/False",
      SHORT_ANSWER: "Short Answer",
      ESSAY: "Essay",
      FILL_BLANK: "Fill Blank",
    },
  },
} as any

describe("QuestionForm (Marking) — smoke", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("mounts in create mode without throwing", async () => {
    const { QuestionForm } = await import("../form")
    expect(() =>
      render(<QuestionForm dictionary={dictionary} locale="en" />)
    ).not.toThrow()
  })

  it("renders form controls (buttons + textboxes)", async () => {
    const { QuestionForm } = await import("../form")
    const { container } = render(
      <QuestionForm dictionary={dictionary} locale="en" />
    )
    expect(container.querySelectorAll("button").length).toBeGreaterThan(0)
    expect(
      container.querySelectorAll("input,textarea,select").length
    ).toBeGreaterThan(0)
  })

  it("accepts initialData for edit mode", async () => {
    const { QuestionForm } = await import("../form")
    expect(() =>
      render(
        <QuestionForm
          dictionary={dictionary}
          locale="en"
          questionId="q-123"
          initialData={{
            subjectId: "subject-1",
            questionText: "What is 1 + 1?",
            questionType: "MULTIPLE_CHOICE",
            difficulty: "EASY",
            bloomLevel: "REMEMBER",
            points: 1,
            options: [
              { text: "1", isCorrect: false },
              { text: "2", isCorrect: true },
            ],
          }}
        />
      )
    ).not.toThrow()
  })
})
