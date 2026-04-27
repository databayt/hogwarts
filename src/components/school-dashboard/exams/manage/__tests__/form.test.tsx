// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * ExamCreateForm smoke tests
 *
 * Verifies the multi-step exam form mounts without throwing under common modes
 * (create, edit). Detailed step-navigation behavior is exercised in E2E tests
 * since this form depends on DictionaryProvider, ModalProvider, and the router.
 */

import { fireEvent, render } from "@testing-library/react"
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

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}))

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

vi.mock("@/components/internationalization/use-dictionary", () => ({
  useDictionary: () => ({
    dictionary: {
      school: {
        exams: {
          manage: {
            form: {
              title: "Title",
              description: "Description",
              examDate: "Exam Date",
              startTime: "Start Time",
              endTime: "End Time",
            },
            createTitle: "Create Exam",
            editTitle: "Edit Exam",
            steps: {
              basic: "Basic Information",
              schedule: "Schedule",
              instructions: "Instructions",
            },
          },
        },
      },
      common: { next: "Next", back: "Back", save: "Save", cancel: "Cancel" },
    },
  }),
}))

vi.mock("@/components/internationalization/use-locale", () => ({
  useLocale: () => ({ locale: "en", dir: "ltr" }),
}))

vi.mock("../actions", () => ({
  createExam: vi.fn().mockResolvedValue({ success: true }),
  updateExam: vi.fn().mockResolvedValue({ success: true }),
  getExam: vi.fn().mockResolvedValue({ exam: null }),
}))

describe("ExamCreateForm — smoke", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("mounts without throwing", async () => {
    const { ExamCreateForm } = await import("../form")
    expect(() => render(<ExamCreateForm />)).not.toThrow()
  })

  it("renders interactable elements (buttons + inputs)", async () => {
    const { ExamCreateForm } = await import("../form")
    const { container } = render(<ExamCreateForm />)
    expect(container.querySelectorAll("button").length).toBeGreaterThan(0)
    expect(container.querySelectorAll("input,textarea").length).toBeGreaterThan(
      0
    )
  })

  it("dispatches input change events without crashing", async () => {
    const { ExamCreateForm } = await import("../form")
    const { container } = render(<ExamCreateForm />)
    const firstInput = container.querySelector(
      "input"
    ) as HTMLInputElement | null
    if (firstInput) {
      fireEvent.change(firstInput, { target: { value: "Midterm Exam" } })
      expect(firstInput.value).toBe("Midterm Exam")
    }
  })
})
