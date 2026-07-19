// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
//
// validation.ts now carries only the onboarding schemas — invoice
// creation/editing validates in wizard/{details,items}/validation.ts (covered
// by wizard-actions.test.ts).
import { describe, expect, it } from "vitest"

import {
  createOnboardingSchema,
  onboardingSchema,
} from "@/components/school-dashboard/finance/invoice/validation"

const validOnboarding = {
  firstName: "Ahmed",
  lastName: "Hassan",
  currency: "SDG",
}

describe("onboardingSchema (static fallback)", () => {
  it("accepts valid input", () => {
    const result = onboardingSchema.safeParse(validOnboarding)
    expect(result.success).toBe(true)
  })

  it("accepts missing optional currency", () => {
    const { currency: _currency, ...rest } = validOnboarding
    const result = onboardingSchema.safeParse(rest)
    expect(result.success).toBe(true)
  })

  it("rejects a too-short first name", () => {
    const result = onboardingSchema.safeParse({
      ...validOnboarding,
      firstName: "Al",
    })
    expect(result.success).toBe(false)
  })

  it("rejects a too-long last name", () => {
    const result = onboardingSchema.safeParse({
      ...validOnboarding,
      lastName: "x".repeat(51),
    })
    expect(result.success).toBe(false)
  })

  it("rejects missing names", () => {
    const result = onboardingSchema.safeParse({ currency: "USD" })
    expect(result.success).toBe(false)
  })
})

describe("createOnboardingSchema (i18n factory)", () => {
  // Minimal dictionary stub: getValidationMessages reads
  // dictionary.messages.validation; maxLength interpolates {max} and needs a
  // real template (ValidationHelper.get falls back per-key, maxLength doesn't).
  const dictionary = {
    messages: { validation: { maxLength: "Max {max} characters" } },
  } as never

  it("builds a schema that accepts valid input", () => {
    const schema = createOnboardingSchema(dictionary)
    expect(schema.safeParse(validOnboarding).success).toBe(true)
  })

  it("builds a schema that rejects invalid input", () => {
    const schema = createOnboardingSchema(dictionary)
    expect(
      schema.safeParse({ ...validOnboarding, firstName: "" }).success
    ).toBe(false)
  })
})
