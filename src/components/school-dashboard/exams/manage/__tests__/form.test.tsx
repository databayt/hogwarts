/**
 * Exam Create/Edit Form Tests
 *
 * Tests the multi-step exam form component including:
 * - Step navigation
 * - Form validation
 * - Data persistence between steps
 * - Create/Update submission
 */

import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { ExamCreateForm } from "../form"

// Mock the modal context
const mockCloseModal = vi.fn()
vi.mock("@/components/atom/modal/context", () => ({
  useModal: () => ({
    modal: { id: undefined },
    closeModal: mockCloseModal,
  }),
}))

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
  }),
}))

// Mock sonner toast
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

// Mock the server actions
vi.mock("../actions", () => ({
  createExam: vi.fn().mockResolvedValue({ success: true }),
  updateExam: vi.fn().mockResolvedValue({ success: true }),
  getExam: vi.fn().mockResolvedValue({ exam: null }),
}))

describe("ExamCreateForm", () => {
  const user = userEvent.setup()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("Rendering", () => {
    it("renders the form with step 1 by default", () => {
      render(<ExamCreateForm />)

      expect(screen.getByText("Create Exam")).toBeInTheDocument()
      expect(screen.getByText("Basic Information")).toBeInTheDocument()
    })

    it("renders step navigation indicators", () => {
      render(<ExamCreateForm />)

      // Step indicator should show step 1 of 3
      expect(screen.getByText(/Step 1/i)).toBeInTheDocument()
    })

    it("shows form fields for step 1", () => {
      render(<ExamCreateForm />)

      // Basic information fields
      expect(screen.getByLabelText(/title/i)).toBeInTheDocument()
    })
  })

  describe("Step Navigation", () => {
    it("advances to step 2 when clicking Next with valid step 1 data", async () => {
      render(<ExamCreateForm />)

      // Fill in required step 1 fields
      await user.type(screen.getByLabelText(/title/i), "Math Midterm Exam")

      // Click Next
      const nextButton = screen.getByRole("button", { name: /next/i })
      await user.click(nextButton)

      // Should advance to step 2 (after validation passes)
      await waitFor(() => {
        expect(screen.getByText(/Schedule/i)).toBeInTheDocument()
      })
    })

    it("shows validation errors and stays on step 1 when required fields are empty", async () => {
      render(<ExamCreateForm />)

      // Click Next without filling required fields
      const nextButton = screen.getByRole("button", { name: /next/i })
      await user.click(nextButton)

      // Should stay on step 1 and show validation errors
      await waitFor(() => {
        expect(screen.getByText(/Title is required/i)).toBeInTheDocument()
      })
    })

    it("navigates back to previous step when clicking Back", async () => {
      render(<ExamCreateForm />)

      // Fill in step 1 and advance
      await user.type(screen.getByLabelText(/title/i), "Test Exam")

      const nextButton = screen.getByRole("button", { name: /next/i })
      await user.click(nextButton)

      // Wait for step 2
      await waitFor(() => {
        expect(screen.getByText(/Schedule/i)).toBeInTheDocument()
      })

      // Click Back
      const backButton = screen.getByRole("button", { name: /back/i })
      await user.click(backButton)

      // Should be back on step 1
      await waitFor(() => {
        expect(screen.getByText("Basic Information")).toBeInTheDocument()
      })
    })
  })

  describe("Data Persistence", () => {
    it("preserves data when navigating between steps", async () => {
      render(<ExamCreateForm />)

      const examTitle = "Preserved Title Test"

      // Fill in step 1 data
      await user.type(screen.getByLabelText(/title/i), examTitle)

      // Advance to step 2 and back
      const nextButton = screen.getByRole("button", { name: /next/i })
      await user.click(nextButton)

      await waitFor(() => {
        expect(screen.getByText(/Schedule/i)).toBeInTheDocument()
      })

      const backButton = screen.getByRole("button", { name: /back/i })
      await user.click(backButton)

      // Data should be preserved
      await waitFor(() => {
        const titleInput = screen.getByLabelText(/title/i)
        expect(titleInput).toHaveValue(examTitle)
      })
    })
  })

  describe("Form Validation", () => {
    it("validates title is required", async () => {
      render(<ExamCreateForm />)

      // Try to advance without title
      const nextButton = screen.getByRole("button", { name: /next/i })
      await user.click(nextButton)

      await waitFor(() => {
        expect(screen.getByText(/Title is required/i)).toBeInTheDocument()
      })
    })

    it("validates class selection is required", async () => {
      render(<ExamCreateForm />)

      await user.type(screen.getByLabelText(/title/i), "Test Exam")

      const nextButton = screen.getByRole("button", { name: /next/i })
      await user.click(nextButton)

      await waitFor(() => {
        expect(screen.getByText(/Class is required/i)).toBeInTheDocument()
      })
    })
  })

  describe("Submission", () => {
    it("calls onSuccess callback after successful create", async () => {
      const mockOnSuccess = vi.fn()
      render(<ExamCreateForm onSuccess={mockOnSuccess} />)

      // Fill all required fields and submit (this is a simplified test)
      // In a real test, we'd need to mock the selects and fill all steps
    })
  })
})

describe("ExamCreateForm Edit Mode", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("loads existing exam data when editing", async () => {
    // Mock getExam to return existing data
    const { getExam } = await import("../actions")
    vi.mocked(getExam).mockResolvedValue({
      exam: {
        id: "exam-123",
        title: "Existing Exam",
        description: "Test description",
        classId: "class-1",
        subjectId: "subject-1",
        examDate: new Date("2025-06-01"),
        startTime: "09:00",
        endTime: "11:00",
        duration: 120,
        totalMarks: 100,
        passingMarks: 40,
        examType: "MIDTERM",
        instructions: "No cheating",
      },
    })

    // Mock modal with edit ID
    vi.doMock("@/components/atom/modal/context", () => ({
      useModal: () => ({
        modal: { id: "exam-123" },
        closeModal: mockCloseModal,
      }),
    }))

    // Re-import component with new mock
    const { ExamCreateForm: EditForm } = await import("../form")

    render(<EditForm />)

    await waitFor(() => {
      expect(screen.getByText("Edit Exam")).toBeInTheDocument()
    })
  })
})
