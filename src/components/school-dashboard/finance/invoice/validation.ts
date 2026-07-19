// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
//
// Invoice creation/editing validates in wizard/{details,items}/validation.ts
// (the live flow). This file keeps only the onboarding (profile + currency)
// schemas used by onboarding/content.tsx.

import z from "zod"

import type { Dictionary } from "@/components/internationalization/dictionaries"
import { getValidationMessages } from "@/components/internationalization/helpers"

// ============================================================================
// Schema Factory (i18n-enabled)
// ============================================================================

export function createOnboardingSchema(dictionary: Dictionary) {
  const v = getValidationMessages(dictionary)

  return z.object({
    firstName: z
      .string()
      .min(3, { message: v.get("firstNameRequired") })
      .max(50, { message: v.maxLength(50) }),
    lastName: z
      .string()
      .min(3, { message: v.get("lastNameRequired") })
      .max(50, { message: v.maxLength(50) }),
    currency: z.string({ message: v.get("currencyRequired") }).optional(),
  })
}

// ============================================================================
// Static fallback (pre-dictionary-load render only)
// ============================================================================

export const onboardingSchema = z.object({
  firstName: z
    .string()
    .min(3, { message: "First name is required" })
    .max(50, { message: "First Name max 50 character" }),
  lastName: z
    .string()
    .min(3, { message: "Last name is required" })
    .max(50, { message: "Last Name max 50 character" }),
  currency: z.string({ message: "Select currency" }).optional(),
})
