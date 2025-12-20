import { z } from "zod"

import { ERROR_MESSAGES, FORM_LIMITS } from "../config.client"

// ============================================================================
// Title Schema (client-safe - no server-only dependencies)
// ============================================================================

export const titleSchema = z.object({
  title: z
    .string()
    .min(FORM_LIMITS.TITLE_MIN_LENGTH, ERROR_MESSAGES.TITLE_TOO_SHORT)
    .max(FORM_LIMITS.TITLE_MAX_LENGTH, ERROR_MESSAGES.TITLE_TOO_LONG)
    .trim(),
  subdomain: z
    .string()
    .refine(
      (val) => val === "" || (val.length >= 3 && val.length <= 63),
      "Subdomain must be between 3 and 63 characters"
    )
    .refine(
      (val) => val === "" || /^[a-z0-9-]+$/.test(val),
      "Only letters, numbers, and hyphens allowed"
    )
    .refine(
      (val) => val === "" || (!val.startsWith("-") && !val.endsWith("-")),
      "Cannot start or end with hyphen"
    )
    .optional(),
})

export type TitleFormData = z.infer<typeof titleSchema>
