// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { act, renderHook } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { useAutoFillMerge } from "@/components/school-marketing/application/use-auto-fill-merge"

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

interface TestForm {
  firstName: string
  lastName: string
  email: string
}

function createMockForm(values: Partial<TestForm> = {}) {
  const current: TestForm = {
    firstName: values.firstName ?? "",
    lastName: values.lastName ?? "",
    email: values.email ?? "",
  }

  return {
    getValues: vi.fn(() => current),
    setValue: vi.fn((key: string, value: unknown) => {
      ;(current as Record<string, unknown>)[key] = value
    }),
    // Minimal shape to satisfy UseFormReturn
    watch: vi.fn(),
    register: vi.fn(),
    handleSubmit: vi.fn(),
    reset: vi.fn(),
    formState: { errors: {}, isDirty: false, isValid: true },
    control: {},
    trigger: vi.fn(),
    setError: vi.fn(),
    clearErrors: vi.fn(),
    unregister: vi.fn(),
    setFocus: vi.fn(),
    getFieldState: vi.fn(),
  } as any
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("useAutoFillMerge", () => {
  it("fills empty form fields from context data", () => {
    const form = createMockForm({ firstName: "", lastName: "", email: "" })
    const contextData = { firstName: "Ahmed", lastName: "Hassan" }

    renderHook(() => useAutoFillMerge(form, contextData))

    expect(form.setValue).toHaveBeenCalledWith("firstName", "Ahmed", {
      shouldDirty: false,
      shouldValidate: false,
    })
    expect(form.setValue).toHaveBeenCalledWith("lastName", "Hassan", {
      shouldDirty: false,
      shouldValidate: false,
    })
  })

  it("does NOT overwrite fields that already have values", () => {
    const form = createMockForm({
      firstName: "Existing",
      lastName: "",
      email: "",
    })
    const contextData = {
      firstName: "AI-Extracted",
      lastName: "Hassan",
    }

    renderHook(() => useAutoFillMerge(form, contextData))

    // Should NOT overwrite firstName (already has value)
    const firstNameCalls = form.setValue.mock.calls.filter(
      ([key]: [string]) => key === "firstName"
    )
    expect(firstNameCalls).toHaveLength(0)

    // Should fill lastName (empty)
    expect(form.setValue).toHaveBeenCalledWith("lastName", "Hassan", {
      shouldDirty: false,
      shouldValidate: false,
    })
  })

  it("does nothing when contextData is undefined", () => {
    const form = createMockForm()

    renderHook(() => useAutoFillMerge(form, undefined))

    expect(form.setValue).not.toHaveBeenCalled()
  })

  it("does nothing when contextData is empty", () => {
    const form = createMockForm()

    renderHook(() => useAutoFillMerge(form, {}))

    expect(form.setValue).not.toHaveBeenCalled()
  })

  it("skips null and empty string values from context", () => {
    const form = createMockForm({ firstName: "", lastName: "" })
    const contextData = {
      firstName: null as unknown as string,
      lastName: "",
    }

    renderHook(() => useAutoFillMerge(form, contextData))

    expect(form.setValue).not.toHaveBeenCalled()
  })

  it("only fills each field once even on re-render", () => {
    const form = createMockForm({ firstName: "", lastName: "" })
    const contextData = { firstName: "Ahmed" }

    const { rerender } = renderHook(() => useAutoFillMerge(form, contextData))

    expect(form.setValue).toHaveBeenCalledTimes(1)

    // Re-render with same data — should not fill again
    act(() => {
      rerender()
    })

    expect(form.setValue).toHaveBeenCalledTimes(1)
  })

  it("fills new fields when context data updates", () => {
    const form = createMockForm({
      firstName: "",
      lastName: "",
      email: "",
    })

    const { rerender } = renderHook(
      ({ data }) => useAutoFillMerge(form, data),
      { initialProps: { data: { firstName: "Ahmed" } as Partial<TestForm> } }
    )

    expect(form.setValue).toHaveBeenCalledTimes(1)
    expect(form.setValue).toHaveBeenCalledWith("firstName", "Ahmed", {
      shouldDirty: false,
      shouldValidate: false,
    })

    // Context updates with new field
    rerender({ data: { firstName: "Ahmed", email: "ahmed@example.com" } })

    // Should fill email (new field) but NOT firstName again
    expect(form.setValue).toHaveBeenCalledTimes(2)
    expect(form.setValue).toHaveBeenCalledWith("email", "ahmed@example.com", {
      shouldDirty: false,
      shouldValidate: false,
    })
  })
})
