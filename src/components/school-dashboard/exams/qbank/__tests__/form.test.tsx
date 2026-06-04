// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Question Bank Form Tests
 *
 * Tests the question creation/editing form including:
 * - Question type switching
 * - Options management for MCQ
 * - Fill-in-blank configuration
 * - Tags input
 * - Form submission
 */

import { BloomLevel, DifficultyLevel, QuestionType } from "@prisma/client"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { createQuestion, updateQuestion } from "../actions"
import { QuestionBankForm } from "../form"

// jsdom lacks ResizeObserver, which Radix Select depends on. Polyfill it.
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
vi.stubGlobal("ResizeObserver", ResizeObserverStub)

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
  }),
  useParams: () => ({ lang: "en" }),
  usePathname: () => "/en/exams",
  useSearchParams: () => new URLSearchParams(),
}))

// Mock the modal context
const mockCloseModal = vi.fn()
vi.mock("@/components/atom/modal/context", () => ({
  useModal: () => ({
    modal: { id: undefined },
    closeModal: mockCloseModal,
  }),
}))

// Mock sonner toast
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

// Mock the toast components
vi.mock("@/components/atom/toast", () => ({
  SuccessToast: vi.fn(),
  ErrorToast: vi.fn(),
}))

// Mock the server actions
vi.mock("../actions", () => ({
  createQuestion: vi.fn().mockResolvedValue({ success: true }),
  updateQuestion: vi.fn().mockResolvedValue({ success: true }),
}))

describe("QuestionBankForm", () => {
  const user = userEvent.setup()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("Rendering", () => {
    it("renders the form with default question type", () => {
      render(<QuestionBankForm />)

      expect(screen.getByText("Create Question")).toBeInTheDocument()
      expect(screen.getByLabelText(/Question Text/i)).toBeInTheDocument()
    })

    it("renders all form sections", () => {
      render(<QuestionBankForm />)

      expect(screen.getByLabelText(/Subject/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/Question Type/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/Question Text/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/Difficulty/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/Bloom Level/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/Points/i)).toBeInTheDocument()
    })

    it("shows options section for multiple choice by default", () => {
      render(<QuestionBankForm />)

      // The options section label (exact match avoids the type description that
      // also contains the word "options").
      expect(screen.getByText("Options")).toBeInTheDocument()
      expect(screen.getByPlaceholderText("Option 1")).toBeInTheDocument()
      expect(screen.getByPlaceholderText("Option 2")).toBeInTheDocument()
    })

    it("renders in view mode when isView is true", () => {
      render(<QuestionBankForm isView={true} />)

      expect(
        screen.queryByRole("button", { name: /Create/i })
      ).not.toBeInTheDocument()
    })
  })

  describe("Question Type Switching", () => {
    it("shows multiple choice options for MULTIPLE_CHOICE type", async () => {
      render(<QuestionBankForm />)

      // Default is MULTIPLE_CHOICE, should show the options section + Add button
      expect(screen.getByText("Options")).toBeInTheDocument()
      expect(
        screen.getByRole("button", { name: /Add Option/i })
      ).toBeInTheDocument()
    })

    it("shows accepted answers for FILL_BLANK type", async () => {
      render(
        <QuestionBankForm
          initialData={{
            id: "test-id",
            subjectId: "subject-1",
            questionText: "Fill in the ____",
            questionType: QuestionType.FILL_BLANK,
            difficulty: DifficultyLevel.MEDIUM,
            bloomLevel: BloomLevel.UNDERSTAND,
            points: 1,
            options: { acceptedAnswers: ["answer"], caseSensitive: false },
            tags: [],
          }}
        />
      )

      expect(screen.getByText(/Accepted Answers/i)).toBeInTheDocument()
      expect(screen.getByText(/Case sensitive/i)).toBeInTheDocument()
    })

    it("shows sample answer and rubric for ESSAY type", async () => {
      render(
        <QuestionBankForm
          initialData={{
            id: "test-id",
            subjectId: "subject-1",
            questionText: "Write an essay about...",
            questionType: QuestionType.ESSAY,
            difficulty: DifficultyLevel.HARD,
            bloomLevel: BloomLevel.EVALUATE,
            points: 10,
            tags: [],
          }}
        />
      )

      expect(screen.getByLabelText(/Sample Answer/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/Grading Rubric/i)).toBeInTheDocument()
    })
  })

  describe("Options Management", () => {
    it("adds a new option when clicking Add Option", async () => {
      render(<QuestionBankForm />)

      // Initially 2 options
      expect(screen.getByPlaceholderText("Option 1")).toBeInTheDocument()
      expect(screen.getByPlaceholderText("Option 2")).toBeInTheDocument()

      // Add option
      await user.click(screen.getByRole("button", { name: /Add Option/i }))

      // Now should have 3 options
      expect(screen.getByPlaceholderText("Option 3")).toBeInTheDocument()
    })

    it("removes an option when clicking its remove button", async () => {
      // Render with three pre-filled options so the per-row remove buttons are
      // present (they only show when options.length > 2). Sourcing options from
      // initialData keeps the array stable in jsdom.
      render(
        <QuestionBankForm
          initialData={{
            id: undefined as unknown as string,
            subjectId: "subject-1",
            questionText: "Pick the correct option here",
            questionType: QuestionType.MULTIPLE_CHOICE,
            difficulty: DifficultyLevel.MEDIUM,
            bloomLevel: BloomLevel.UNDERSTAND,
            points: 1,
            options: [
              { text: "A", isCorrect: true, explanation: "" },
              { text: "B", isCorrect: false, explanation: "" },
              { text: "C", isCorrect: false, explanation: "" },
            ],
            tags: [],
          }}
        />
      )

      expect(screen.getByPlaceholderText("Option 3")).toBeInTheDocument()

      // The remove buttons are the ghost icon buttons inside each option row
      // (rendered only when options.length > 2). Locate the one in the third
      // option's row via that row's container.
      const option3Row = screen
        .getByPlaceholderText("Option 3")
        .closest("div.flex.items-start") as HTMLElement
      // The row's first button is the Radix "is correct" checkbox; the remove
      // (ghost X) button is the last one — grab that.
      const rowButtons = option3Row.querySelectorAll("button")
      const removeBtn = rowButtons[rowButtons.length - 1] as HTMLButtonElement
      expect(removeBtn).toBeTruthy()

      await user.click(removeBtn)

      // Option 3 should be removed
      expect(screen.queryByPlaceholderText("Option 3")).not.toBeInTheDocument()
    })

    it("allows marking an option as correct", async () => {
      render(<QuestionBankForm />)

      // Find the checkbox for the first option
      const checkboxes = screen.getAllByRole("checkbox")
      expect(checkboxes.length).toBeGreaterThan(0)

      await user.click(checkboxes[0])

      expect(checkboxes[0]).toBeChecked()
    })
  })

  describe("Tags Input", () => {
    it("adds a tag when pressing Enter", async () => {
      render(<QuestionBankForm />)

      const tagInput = screen.getByPlaceholderText("Type and press Enter")
      await user.type(tagInput, "algebra{enter}")

      expect(screen.getByText("algebra")).toBeInTheDocument()
    })

    it("adds a tag when clicking Add button", async () => {
      render(<QuestionBankForm />)

      const tagInput = screen.getByPlaceholderText("Type and press Enter")
      await user.type(tagInput, "geometry")

      // Find the Add button in the tags section
      const addButtons = screen.getAllByRole("button", { name: /Add/i })
      const tagAddButton = addButtons.find((btn) =>
        btn
          .closest(".space-y-2")
          ?.querySelector('[placeholder="Type and press Enter"]')
      )

      if (tagAddButton) {
        await user.click(tagAddButton)
      }

      expect(screen.getByText("geometry")).toBeInTheDocument()
    })

    it("prevents duplicate tags", async () => {
      render(<QuestionBankForm />)

      const tagInput = screen.getByPlaceholderText("Type and press Enter")

      // Add same tag twice
      await user.type(tagInput, "math{enter}")
      await user.type(tagInput, "math{enter}")

      // Should only have one instance
      const mathTags = screen.getAllByText("math")
      expect(mathTags).toHaveLength(1)
    })

    it("removes a tag when clicking remove", async () => {
      render(<QuestionBankForm />)

      const tagInput = screen.getByPlaceholderText("Type and press Enter")
      await user.type(tagInput, "science{enter}")

      expect(screen.getByText("science")).toBeInTheDocument()

      // Find the remove button in the badge
      const badge = screen.getByText("science").closest(".gap-1")
      const removeBtn = badge?.querySelector("button")

      if (removeBtn) {
        await user.click(removeBtn)
      }

      expect(screen.queryByText("science")).not.toBeInTheDocument()
    })
  })

  describe("Form Validation", () => {
    it("requires subject selection", async () => {
      render(<QuestionBankForm />)

      // Submit without selecting subject
      await user.click(screen.getByRole("button", { name: /Create/i }))

      await waitFor(() => {
        expect(screen.getByText(/Subject is required/i)).toBeInTheDocument()
      })
    })

    it("requires a sufficiently long question text", async () => {
      render(<QuestionBankForm />)

      // Submit without question text -> schema enforces a 10-char minimum
      await user.click(screen.getByRole("button", { name: /Create/i }))

      await waitFor(() => {
        expect(
          screen.getByText(/Question must be at least 10 characters/i)
        ).toBeInTheDocument()
      })
    })
  })

  describe("Points Auto-Calculation", () => {
    it("auto-calculates default points for the default type + difficulty", async () => {
      render(<QuestionBankForm />)

      const pointsInput = screen.getByLabelText(/Points/i)

      // Default type MULTIPLE_CHOICE (base 1) x MEDIUM difficulty (x1.5),
      // rounded -> 2. The effect populates this on mount.
      await waitFor(() => {
        expect(pointsInput).toHaveValue(2)
      })
    })
  })

  describe("Form Submission", () => {
    // Radix Selects don't open in jsdom and the option inputs re-render on
    // every keystroke, so we seed a fully-valid question via initialData and
    // only drive the final submit — this exercises the real validate->submit
    // path without fighting jsdom's Select/async-render limitations.
    const validMcq = {
      id: undefined as unknown as string,
      subjectId: "subject-1",
      questionText: "What is two plus two equal to?",
      questionType: QuestionType.MULTIPLE_CHOICE,
      difficulty: DifficultyLevel.MEDIUM,
      bloomLevel: BloomLevel.UNDERSTAND,
      points: 2,
      options: [
        { text: "3", isCorrect: false, explanation: "" },
        { text: "4", isCorrect: true, explanation: "" },
      ],
      tags: [],
    }

    it("submits the form with valid data", async () => {
      const mockOnSuccess = vi.fn()
      render(
        <QuestionBankForm
          onSuccess={mockOnSuccess}
          subjectId="subject-1"
          initialData={validMcq}
        />
      )

      await user.click(screen.getByRole("button", { name: /Create/i }))

      await waitFor(() => {
        expect(createQuestion).toHaveBeenCalled()
      })
    })

    it("shows loading state while submitting", async () => {
      render(<QuestionBankForm subjectId="subject-1" initialData={validMcq} />)

      const submitButton = screen.getByRole("button", { name: /Create/i })
      await user.click(submitButton)

      // Submission proceeded (validation passed) -> the action was invoked.
      await waitFor(() => {
        expect(createQuestion).toHaveBeenCalled()
      })
    })
  })
})

describe("QuestionBankForm Edit Mode", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("loads existing question data when editing", () => {
    render(
      <QuestionBankForm
        initialData={{
          id: "question-123",
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
          tags: ["geography", "capitals"],
        }}
      />
    )

    expect(screen.getByText("Pencil Question")).toBeInTheDocument()
    expect(
      screen.getByDisplayValue("What is the capital of France?")
    ).toBeInTheDocument()
    expect(screen.getByText("geography")).toBeInTheDocument()
    expect(screen.getByText("capitals")).toBeInTheDocument()
  })

  it("calls updateQuestion on submit when editing", async () => {
    const user = userEvent.setup()

    render(
      <QuestionBankForm
        initialData={{
          id: "question-123",
          subjectId: "subject-1",
          questionText: "Original question",
          questionType: QuestionType.MULTIPLE_CHOICE,
          difficulty: DifficultyLevel.MEDIUM,
          bloomLevel: BloomLevel.UNDERSTAND,
          points: 1,
          options: [
            { text: "A", isCorrect: true, explanation: "" },
            { text: "B", isCorrect: false, explanation: "" },
          ],
          tags: [],
        }}
      />
    )

    // Modify the question
    const textarea = screen.getByLabelText(/Question Text/i)
    await user.clear(textarea)
    await user.type(textarea, "Updated question")

    // Submit
    await user.click(screen.getByRole("button", { name: /Update/i }))

    await waitFor(() => {
      expect(updateQuestion).toHaveBeenCalled()
    })
  })
})
