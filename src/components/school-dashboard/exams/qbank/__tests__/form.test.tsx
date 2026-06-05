// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * QuestionBankForm smoke tests
 *
 * Mounts the question-bank form across create / edit / view modes and verifies
 * that essential interactive elements exist. Deeper field-level behaviour
 * (option add/remove, tags) lives in E2E + action tests.
 */

import { BloomLevel, DifficultyLevel, QuestionType } from "@prisma/client"
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

vi.mock("@/components/atom/modal/context", () => ({
  useModal: () => ({
    modal: { id: undefined },
    closeModal: vi.fn(),
  }),
}))

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

vi.mock("@/components/atom/toast", () => ({
  SuccessToast: vi.fn(),
  ErrorToast: vi.fn(),
}))

vi.mock("@/components/internationalization/use-dictionary", () => ({
  useDictionary: () => ({
    dictionary: {
      school: {
        exams: {
          qbank: {
            form: {
              questionText: "Question Text",
              questionType: "Question Type",
              difficulty: "Difficulty",
              bloomLevel: "Bloom Level",
              points: "Points",
              subject: "Subject",
              options: "Options",
              addOption: "Add Option",
              tags: "Tags",
            },
            createTitle: "Create Question",
            editTitle: "Edit Question",
          },
        },
      },
      common: { create: "Create", update: "Update", cancel: "Cancel" },
    },
  }),
}))

vi.mock("../actions", () => ({
  createQuestion: vi.fn().mockResolvedValue({ success: true }),
  updateQuestion: vi.fn().mockResolvedValue({ success: true }),
}))

describe("QuestionBankForm — smoke", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("mounts in create mode without throwing", async () => {
    const { QuestionBankForm } = await import("../form")
    expect(() => render(<QuestionBankForm />)).not.toThrow()
  })

  it("mounts in view mode (no submit buttons)", async () => {
    const { QuestionBankForm } = await import("../form")
    expect(() => render(<QuestionBankForm isView={true} />)).not.toThrow()
  })

  it("mounts in edit mode with MULTIPLE_CHOICE data", async () => {
    const { QuestionBankForm } = await import("../form")
    expect(() =>
      render(
        <QuestionBankForm
          initialData={{
            id: "q-1",
            subjectId: "subject-1",
            questionText: "What is the capital of France?",
            questionType: QuestionType.MULTIPLE_CHOICE,
            difficulty: DifficultyLevel.EASY,
            bloomLevel: BloomLevel.REMEMBER,
            points: 2,
            options: [
              { text: "Paris", isCorrect: true, explanation: "" },
              { text: "London", isCorrect: false, explanation: "" },
            ],
            tags: ["geography"],
          }}
        />
      )
    ).not.toThrow()
  })

  it("mounts in edit mode with FILL_BLANK data", async () => {
    const { QuestionBankForm } = await import("../form")
    expect(() =>
      render(
        <QuestionBankForm
          initialData={{
            id: "q-2",
            subjectId: "subject-1",
            questionText: "The capital of France is ____.",
            questionType: QuestionType.FILL_BLANK,
            difficulty: DifficultyLevel.MEDIUM,
            bloomLevel: BloomLevel.UNDERSTAND,
            points: 1,
            options: { acceptedAnswers: ["Paris"], caseSensitive: false },
            tags: [],
          }}
        />
      )
    ).not.toThrow()
  })

  it("mounts in edit mode with ESSAY data", async () => {
    const { QuestionBankForm } = await import("../form")
    expect(() =>
      render(
        <QuestionBankForm
          initialData={{
            id: "q-3",
            subjectId: "subject-1",
            questionText: "Discuss the causes of WW1.",
            questionType: QuestionType.ESSAY,
            difficulty: DifficultyLevel.HARD,
            bloomLevel: BloomLevel.EVALUATE,
            points: 10,
            tags: [],
          }}
        />
      )
    ).not.toThrow()
  })

  it("renders interactable controls", async () => {
    const { QuestionBankForm } = await import("../form")
    const { container } = render(<QuestionBankForm />)
    expect(container.querySelectorAll("button").length).toBeGreaterThan(0)
    expect(
      container.querySelectorAll("input,textarea,select").length
    ).toBeGreaterThan(0)
  })
})
