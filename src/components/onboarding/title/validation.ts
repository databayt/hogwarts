import { z } from "zod"

import type { Dictionary } from "@/components/internationalization/dictionaries"
import { getValidationMessages } from "@/components/internationalization/helpers"

import { ERROR_MESSAGES, FORM_LIMITS } from "../config.client"

// ============================================================================
// Schema Factory Functions (i18n-enabled)
// ============================================================================

export function createTitleSchema(dictionary: Dictionary) {
  const v = getValidationMessages(dictionary)

  return z.object({
    title: z
      .string()
      .min(FORM_LIMITS.TITLE_MIN_LENGTH, {
        message: v.get("titleTooShort", { min: FORM_LIMITS.TITLE_MIN_LENGTH }),
      })
      .max(FORM_LIMITS.TITLE_MAX_LENGTH, {
        message: v.get("titleTooLong", { max: FORM_LIMITS.TITLE_MAX_LENGTH }),
      })
      .trim(),
    subdomain: z
      .string()
      .min(3, { message: v.get("subdomainMinLength", { min: 3 }) })
      .max(63, { message: v.maxLength(63) })
      .regex(/^[a-z0-9-]+$/, { message: v.get("subdomainInvalidChars") })
      .refine((val) => !val.startsWith("-") && !val.endsWith("-"), {
        message: v.get("subdomainCannotStartOrEndWithHyphen"),
      })
      .optional(),
  })
}

// ============================================================================
// Legacy Schemas (for backward compatibility - will be deprecated)
// ============================================================================

export const titleSchema = z.object({
  title: z
    .string()
    .min(FORM_LIMITS.TITLE_MIN_LENGTH, ERROR_MESSAGES.TITLE_TOO_SHORT)
    .max(FORM_LIMITS.TITLE_MAX_LENGTH, ERROR_MESSAGES.TITLE_TOO_LONG)
    .trim(),
  subdomain: z
    .string()
    .min(3, "Subdomain must be at least 3 characters")
    .max(63, "Subdomain must be no more than 63 characters")
    .regex(/^[a-z0-9-]+$/, "Only letters, numbers, and hyphens allowed")
    .refine(
      (val) => !val.startsWith("-") && !val.endsWith("-"),
      "Cannot start or end with hyphen"
    )
    .optional(),
})

export type TitleFormData = z.infer<typeof titleSchema>
