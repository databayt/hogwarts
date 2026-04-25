// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { z } from "zod"

import type { ValidationHelper } from "@/components/internationalization/helpers"

// Currency enum — kept in sync with the School.currency column (text) and
// the lib/format.ts formatter. Any addition here must also land in
// onboarding/currency validation (Step 5) and in the admin pricing form.
export const CURRENCY_ENUM = [
  "USD",
  "EUR",
  "GBP",
  "CAD",
  "AUD",
  "SAR",
  "AED",
  "EGP",
  "SDG",
  "JOD",
  "KWD",
  "QAR",
  "BHD",
  "OMR",
] as const

export const PAYMENT_SCHEDULE_ENUM = [
  "monthly",
  "quarterly",
  "semester",
  "annual",
] as const

export type Currency = (typeof CURRENCY_ENUM)[number]
export type PaymentSchedule = (typeof PAYMENT_SCHEDULE_ENUM)[number]

// Tuition-only schema — used by the onboarding price step which only captures
// the headline tuition figure. Currency + paymentSchedule live in their own
// steps / in admin pricing later.
export function createTuitionSchema(v?: ValidationHelper) {
  const nonNeg =
    v?.get("tuitionFeeNonNegative") ?? "Tuition fee cannot be negative"
  const tooBig = v?.get("tuitionFeeMaxLimit") ?? "Tuition fee is too high"

  return z.object({
    tuitionFee: z.number().min(0, nonNeg).max(50000, tooBig),
  })
}

export const tuitionSchema = createTuitionSchema()
export type TuitionFormData = z.infer<typeof tuitionSchema>

// Full pricing schema — used by the admin pricing editor + legacy callers.
export function createSchoolPriceSchema(v?: ValidationHelper) {
  const nonNegTuition =
    v?.get("tuitionFeeNonNegative") ?? "Tuition fee cannot be negative"
  const maxTuition = v?.get("tuitionFeeMaxLimit") ?? "Tuition fee is too high"
  const nonNegReg =
    v?.get("registrationFeeNonNegative") ??
    "Registration fee cannot be negative"
  const maxReg =
    v?.get("registrationFeeMaxLimit") ?? "Registration fee is too high"
  const nonNegApp =
    v?.get("applicationFeeNonNegative") ?? "Application fee cannot be negative"
  const maxApp =
    v?.get("applicationFeeMaxLimit") ?? "Application fee is too high"
  const currencyRequired =
    v?.get("currencyRequired") ?? "Please select a currency"
  const scheduleRequired =
    v?.get("paymentScheduleRequired") ?? "Please select a payment schedule"

  return z.object({
    tuitionFee: z.number().min(0, nonNegTuition).max(50000, maxTuition),
    registrationFee: z.number().min(0, nonNegReg).max(5000, maxReg).optional(),
    applicationFee: z.number().min(0, nonNegApp).max(1000, maxApp).optional(),
    currency: z.enum(CURRENCY_ENUM, { message: currencyRequired }),
    paymentSchedule: z.enum(PAYMENT_SCHEDULE_ENUM, {
      message: scheduleRequired,
    }),
  })
}

export const schoolPriceSchema = createSchoolPriceSchema()
export type SchoolPriceFormData = z.infer<typeof schoolPriceSchema>

// Backward-compat aliases
export const priceSchema = schoolPriceSchema
export type PriceFormData = SchoolPriceFormData
