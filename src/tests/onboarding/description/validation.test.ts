// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { describe, expect, it } from "vitest"

import { ValidationHelper } from "@/components/internationalization/helpers"
import {
  createDescriptionSchema,
  descriptionSchema,
} from "@/components/onboarding/description/validation"

// Minimal fixture: only the keys the schema reads via ValidationHelper
const messages = {
  required: "Required (ar)",
  email: "x",
  emailRequired: "x",
  identifierRequired: "x",
  invalidIdentifier: "x",
  passwordRequired: "x",
  confirmPasswordRequired: "x",
  passwordMismatch: "x",
  minLength: "min {min}",
  maxLength: "Must be no more than {max} characters",
  min: "min {min}",
  max: "max {max}",
  positive: "x",
  nonNegative: "x",
  integer: "x",
  url: "x",
  phone: "x",
  date: "x",
  time: "x",
  alphanumeric: "x",
  alphanumericDash: "x",
  lowercaseOnly: "x",
  invalidFormat: "x",
  unique: "x",
  notFound: "x",
  tooShort: "x",
  tooLong: "x",
  invalidSelection: "Invalid selection (ar)",
  atLeastOne: "x",
  futureDate: "x",
  pastDate: "x",
  invalidRange: "x",
  startBeforeEnd: "x",
  requiredField: "x",
  twoFactorCodeRequired: "x",
  invalidCode: "x",
  codeExpired: "x",
  invalidCredentials: "x",
  accountNotFound: "x",
  accountDisabled: "x",
  emailAlreadyExists: "x",
  weakPassword: "x",
  passwordMinLength: "x",
  passwordMinLength8: "x",
  newPasswordRequired: "x",
  currentPasswordRequired: "x",
  firstNameRequired: "x",
  lastNameRequired: "x",
} as never

describe("createDescriptionSchema", () => {
  it("accepts all valid schoolType enum values", () => {
    const schema = createDescriptionSchema()
    for (const t of [
      "private",
      "public",
      "international",
      "technical",
      "special",
    ] as const) {
      expect(schema.safeParse({ schoolType: t }).success).toBe(true)
    }
  })

  it("rejects an unknown schoolType", () => {
    const schema = createDescriptionSchema()
    expect(schema.safeParse({ schoolType: "college" }).success).toBe(false)
  })

  it("requires schoolType (cannot be omitted)", () => {
    const schema = createDescriptionSchema()
    const result = schema.safeParse({})
    expect(result.success).toBe(false)
  })

  it("accepts valid schoolLevel values and treats them as optional", () => {
    const schema = createDescriptionSchema()
    for (const lvl of ["primary", "secondary", "both"] as const) {
      expect(
        schema.safeParse({ schoolType: "private", schoolLevel: lvl }).success
      ).toBe(true)
    }
    expect(schema.safeParse({ schoolType: "private" }).success).toBe(true)
  })

  it("rejects an unknown schoolLevel", () => {
    const schema = createDescriptionSchema()
    expect(
      schema.safeParse({ schoolType: "private", schoolLevel: "college" })
        .success
    ).toBe(false)
  })

  it("enforces the 500-character description cap", () => {
    const schema = createDescriptionSchema()
    expect(
      schema.safeParse({ schoolType: "private", description: "a".repeat(500) })
        .success
    ).toBe(true)
    expect(
      schema.safeParse({ schoolType: "private", description: "a".repeat(501) })
        .success
    ).toBe(false)
  })

  it("uses translated messages when a ValidationHelper is provided", () => {
    const v = new ValidationHelper(messages)
    const schema = createDescriptionSchema(v)
    const result = schema.safeParse({})
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("Required (ar)")
    }
  })

  it("falls back to English when no helper is provided", () => {
    const schema = createDescriptionSchema()
    const result = schema.safeParse({})
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("Required")
    }
  })

  it("exports a default schema instance backward-compatible with the factory", () => {
    expect(descriptionSchema.safeParse({ schoolType: "private" }).success).toBe(
      true
    )
  })

  // Step 2 — schoolLevel production-readiness contract
  describe("schoolLevel contract (Step 2)", () => {
    it("covers every downstream catalog-setup SCHOOL_LEVEL_TO_CATALOG key", () => {
      // Keep the form enum in lockstep with src/components/catalog/setup.ts
      // SCHOOL_LEVEL_TO_CATALOG — adding a new level here without updating
      // the catalog map would silently create schools with no AcademicGrades.
      const schema = createDescriptionSchema()
      const catalogKeys = ["primary", "secondary", "both"] as const
      for (const k of catalogKeys) {
        expect(
          schema.safeParse({ schoolType: "private", schoolLevel: k }).success
        ).toBe(true)
      }
    })

    it("roundtrips optional schoolLevel as undefined, server action maps to null", () => {
      // Mirrors actions.ts: `schoolLevel: validated.schoolLevel ?? null`
      const schema = createDescriptionSchema()
      const parsed = schema.parse({ schoolType: "private" })
      expect(parsed.schoolLevel).toBeUndefined()
      // Server action's coalescing
      const persisted = parsed.schoolLevel ?? null
      expect(persisted).toBeNull()
    })

    it("preserves lowercase casing (DB + catalog both lowercase)", () => {
      const schema = createDescriptionSchema()
      // Uppercase should NOT coerce — silent mismatch with catalog-setup would break
      expect(
        schema.safeParse({ schoolType: "private", schoolLevel: "PRIMARY" })
          .success
      ).toBe(false)
    })
  })
})
