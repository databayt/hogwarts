// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { describe, expect, it } from "vitest"

import { ValidationHelper } from "@/components/internationalization/helpers"
import {
  createLocationSchema,
  locationSchema,
} from "@/components/onboarding/location/validation"

const messages = {
  required: "Required (t)",
  email: "x",
  emailRequired: "x",
  identifierRequired: "x",
  invalidIdentifier: "x",
  passwordRequired: "x",
  confirmPasswordRequired: "x",
  passwordMismatch: "x",
  minLength: "min {min}",
  maxLength: "max {max}",
  min: "x",
  max: "x",
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
  invalidSelection: "x",
  countryRequired: "Country (t)",
  addressRequired: "x",
} as never

const base = {
  address: "123 Al-Thawra St",
  city: "Khartoum",
  state: "Khartoum",
  country: "SD",
  postalCode: "",
  latitude: 15.5007,
  longitude: 32.5599,
}

describe("createLocationSchema", () => {
  it("accepts a fully-filled valid location", () => {
    const schema = createLocationSchema()
    expect(schema.safeParse(base).success).toBe(true)
  })

  it("requires address", () => {
    const schema = createLocationSchema()
    expect(schema.safeParse({ ...base, address: "" }).success).toBe(false)
    expect(schema.safeParse({ ...base, address: "   " }).success).toBe(false)
  })

  it("treats city and state as optional (defaults to empty string)", () => {
    const schema = createLocationSchema()
    const result = schema.safeParse({
      ...base,
      city: undefined,
      state: undefined,
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.city).toBe("")
      expect(result.data.state).toBe("")
    }
  })

  describe("country (Step 3 downstream contract)", () => {
    it("requires a 2-letter ISO code", () => {
      const schema = createLocationSchema()
      for (const bad of ["", "S", "SAU", "sd", "Sd", "12", "S_"]) {
        expect(
          schema.safeParse({ ...base, country: bad }).success,
          `"${bad}" should be rejected`
        ).toBe(false)
      }
    })

    it("trims surrounding whitespace before validating", () => {
      const schema = createLocationSchema()
      const r = schema.safeParse({ ...base, country: "  SD  " })
      expect(r.success).toBe(true)
      if (r.success) expect(r.data.country).toBe("SD")
    })

    it("accepts canonical ISO codes used by catalog-setup.ts + fee-provisioning.ts", () => {
      const schema = createLocationSchema()
      for (const good of ["SD", "SA", "US", "GB", "AE", "EG", "JO", "KW"]) {
        expect(
          schema.safeParse({ ...base, country: good }).success,
          `"${good}" should be accepted`
        ).toBe(true)
      }
    })

    it("preserves UPPERCASE casing (catalog-setup.ts filters on exact match)", () => {
      const schema = createLocationSchema()
      const r = schema.safeParse({ ...base, country: "SD" })
      expect(r.success).toBe(true)
      if (r.success) expect(r.data.country).toBe("SD")
    })

    it("surfaces the translated countryRequired message when a helper is provided", () => {
      const v = new ValidationHelper(messages)
      const schema = createLocationSchema(v)
      const r = schema.safeParse({ ...base, country: "usa" })
      expect(r.success).toBe(false)
      if (!r.success) {
        expect(r.error.issues[0].message).toBe("Country (t)")
      }
    })
  })

  it("exports a default schema instance backward-compatible with the factory", () => {
    expect(locationSchema.safeParse(base).success).toBe(true)
  })
})
