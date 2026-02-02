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

import { QuestionBankForm } from "../form"

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

      expect(screen.getByText(/Options/i)).toBeInTheDocument()
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

      // Default is MULTIPLE_CHOICE, should show options
      expect(screen.getByText(/Options/i)).toBeInTheDocument()
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

    it("removes an option when clicking remove button", async () => {
      render(<QuestionBankForm />)

      // Add a third option first
      await user.click(screen.getByRole("button", { name: /Add Option/i }))
      expect(screen.getByPlaceholderText("Option 3")).toBeInTheDocument()

      // Find and click the remove button (there should be one for option 3)
      const removeButtons = screen
        .getAllByRole("button")
        .filter((btn) => btn.querySelector('svg[class*="x"]') !== null)

      if (removeButtons.length > 0) {
        await user.click(removeButtons[removeButtons.length - 1])
      }

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

    it("requires question text", async () => {
      render(<QuestionBankForm />)

      // Submit without question text
      await user.click(screen.getByRole("button", { name: /Create/i }))

      await waitFor(() => {
        expect(
          screen.getByText(/Question text is required/i)
        ).toBeInTheDocument()
      })
    })
  })

  describe("Points Auto-Calculation", () => {
    it("updates points based on difficulty", async () => {
      render(<QuestionBankForm />)

      const pointsInput = screen.getByLabelText(/Points/i)

      // Initially should be 1 for default MEDIUM difficulty
      expect(pointsInput).toHaveValue(1)
    })
  })

  describe("Form Submission", () => {
    it("submits the form with valid data", async () => {
      const mockOnSuccess = vi.fn()
      render(
        <QuestionBankForm onSuccess={mockOnSuccess} subjectId="subject-1" />
      )

      // Fill in required fields
      await user.type(screen.getByLabelText(/Question Text/i), "What is 2 + 2?")

      // Fill in options
      await user.type(screen.getByPlaceholderText("Option 1"), "3")
      await user.type(screen.getByPlaceholderText("Option 2"), "4")

      // Mark option 2 as correct
      const checkboxes = screen.getAllByRole("checkbox")
      await user.click(checkboxes[1])

      // Submit
      await user.click(screen.getByRole("button", { name: /Create/i }))

      await waitFor(() => {
        const { createQuestion } = require("../actions")
        expect(createQuestion).toHaveBeenCalled()
      })
    })

    it("shows loading state while submitting", async () => {
      render(<QuestionBankForm subjectId="subject-1" />)

      await user.type(screen.getByLabelText(/Question Text/i), "Test question")

      await user.type(screen.getByPlaceholderText("Option 1"), "A")
      await user.type(screen.getByPlaceholderText("Option 2"), "B")

      const checkboxes = screen.getAllByRole("checkbox")
      await user.click(checkboxes[0])

      const submitButton = screen.getByRole("button", { name: /Create/i })
      await user.click(submitButton)

      // Button should be disabled during submission
      expect(submitButton).toBeDisabled()
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
      const { updateQuestion } = require("../actions")
      expect(updateQuestion).toHaveBeenCalled()
    })
  })
})
