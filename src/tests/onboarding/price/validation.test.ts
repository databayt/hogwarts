// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { describe, expect, it } from "vitest"

import { ValidationHelper } from "@/components/internationalization/helpers"
import {
  createSchoolPriceSchema,
  createTuitionSchema,
  CURRENCY_ENUM,
  PAYMENT_SCHEDULE_ENUM,
  schoolPriceSchema,
  tuitionSchema,
} from "@/components/onboarding/price/validation"

const messages = {
  required: "Required",
  email: "x",
  emailRequired: "x",
  identifierRequired: "x",
  invalidIdentifier: "x",
  passwordRequired: "x",
  confirmPasswordRequired: "x",
  passwordMismatch: "x",
  minLength: "x",
  maxLength: "x",
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
  tuitionFeeNonNegative: "Tuition ≥ 0 (t)",
  tuitionFeeMaxLimit: "Tuition too high (t)",
  currencyRequired: "Pick a currency (t)",
  paymentScheduleRequired: "Pick schedule (t)",
} as never

describe("createTuitionSchema (Step 4)", () => {
  it("accepts a positive integer", () => {
    expect(createTuitionSchema().safeParse({ tuitionFee: 5000 }).success).toBe(
      true
    )
  })

  it("accepts zero (no tuition)", () => {
    expect(createTuitionSchema().safeParse({ tuitionFee: 0 }).success).toBe(
      true
    )
  })

  it("rejects negative numbers", () => {
    expect(createTuitionSchema().safeParse({ tuitionFee: -1 }).success).toBe(
      false
    )
  })

  it("rejects values over 50,000", () => {
    expect(createTuitionSchema().safeParse({ tuitionFee: 50001 }).success).toBe(
      false
    )
  })

  it("allows decimals (cents level precision)", () => {
    expect(
      createTuitionSchema().safeParse({ tuitionFee: 4999.99 }).success
    ).toBe(true)
  })

  it("surfaces translated messages when a ValidationHelper is provided", () => {
    const v = new ValidationHelper(messages)
    const r = createTuitionSchema(v).safeParse({ tuitionFee: -5 })
    expect(r.success).toBe(false)
    if (!r.success) {
      expect(r.error.issues[0].message).toBe("Tuition ≥ 0 (t)")
    }
  })

  it("exports a default schema backward-compatible with the factory", () => {
    expect(tuitionSchema.safeParse({ tuitionFee: 1000 }).success).toBe(true)
  })
})

describe("createSchoolPriceSchema currency contract (Step 4)", () => {
  it("covers every currency the onboarding form + admin pricing advertise", () => {
    // Keep in lockstep with lib/format.ts + admin pricing form. The legacy
    // action used to only accept 5 currencies — which silently rejected
    // SDG/SAR/EGP/etc. for Sudanese / GCC schools.
    expect([...CURRENCY_ENUM].sort()).toEqual(
      [
        "AED",
        "AUD",
        "BHD",
        "CAD",
        "EGP",
        "EUR",
        "GBP",
        "JOD",
        "KWD",
        "OMR",
        "QAR",
        "SAR",
        "SDG",
        "USD",
      ].sort()
    )
  })

  it("accepts SDG (regression for Sudanese school onboarding)", () => {
    const data = {
      tuitionFee: 5000,
      currency: "SDG",
      paymentSchedule: "annual",
    }
    expect(schoolPriceSchema.safeParse(data).success).toBe(true)
  })

  it("rejects a currency outside the enum", () => {
    expect(
      schoolPriceSchema.safeParse({
        tuitionFee: 5000,
        currency: "XYZ",
        paymentSchedule: "annual",
      }).success
    ).toBe(false)
  })

  it("covers every payment schedule option", () => {
    expect([...PAYMENT_SCHEDULE_ENUM].sort()).toEqual(
      ["annual", "monthly", "quarterly", "semester"].sort()
    )
  })
})
