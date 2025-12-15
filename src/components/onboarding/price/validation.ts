import { z } from "zod"

import type { Dictionary } from "@/components/internationalization/dictionaries"
import { getValidationMessages } from "@/components/internationalization/helpers"

const CurrencyEnum = ["USD", "EUR", "GBP", "CAD", "AUD"] as const
const PaymentScheduleEnum = [
  "monthly",
  "quarterly",
  "semester",
  "annual",
] as const

type Currency = (typeof CurrencyEnum)[number]
type PaymentSchedule = (typeof PaymentScheduleEnum)[number]

// ============================================================================
// Schema Factory Functions (i18n-enabled)
// ============================================================================

export function createSchoolPriceSchema(dictionary: Dictionary) {
  const v = getValidationMessages(dictionary)

  return z.object({
    tuitionFee: z
      .number()
      .min(0, { message: v.get("tuitionFeeNonNegative") })
      .max(50000, { message: v.get("tuitionFeeMaxLimit") }),
    registrationFee: z
      .number()
      .min(0, { message: v.get("registrationFeeNonNegative") })
      .max(5000, { message: v.get("registrationFeeMaxLimit") })
      .optional(),
    applicationFee: z
      .number()
      .min(0, { message: v.get("applicationFeeNonNegative") })
      .max(1000, { message: v.get("applicationFeeMaxLimit") })
      .optional(),
    currency: z.enum(CurrencyEnum, { message: v.get("currencyRequired") }),
    paymentSchedule: z.enum(PaymentScheduleEnum, {
      message: v.get("paymentScheduleRequired"),
    }),
  })
}

// ============================================================================
// Legacy Schemas (for backward compatibility - will be deprecated)
// ============================================================================

export const schoolPriceSchema = z.object({
  tuitionFee: z
    .number()
    .min(0, "Tuition fee cannot be negative")
    .max(50000, "Tuition fee cannot exceed $50,000"),
  registrationFee: z
    .number()
    .min(0, "Registration fee cannot be negative")
    .max(5000, "Registration fee cannot exceed $5,000")
    .optional(),
  applicationFee: z
    .number()
    .min(0, "Application fee cannot be negative")
    .max(1000, "Application fee cannot exceed $1,000")
    .optional(),
  currency: z.enum(CurrencyEnum).describe("Please select a currency"),
  paymentSchedule: z
    .enum(PaymentScheduleEnum)
    .describe("Please select a payment schedule"),
})

export type SchoolPriceFormData = {
  tuitionFee: number
  registrationFee?: number
  applicationFee?: number
  currency: Currency
  paymentSchedule: PaymentSchedule
}

// Keep legacy schema for backward compatibility
export const priceSchema = schoolPriceSchema
export type PriceFormData = SchoolPriceFormData
