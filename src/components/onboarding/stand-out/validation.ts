import { z } from "zod"

import type { Dictionary } from "@/components/internationalization/dictionaries"
import { getValidationMessages } from "@/components/internationalization/helpers"

import { STAND_OUT_CONSTANTS } from "./config"

// ============================================================================
// Schema Factory Functions (i18n-enabled)
// ============================================================================

export function createStandOutValidation(dictionary: Dictionary) {
  const v = getValidationMessages(dictionary)

  return z.object({
    description: z
      .string()
      .max(500, { message: v.maxLength(500) })
      .optional(),
    features: z
      .array(z.string())
      .max(STAND_OUT_CONSTANTS.MAX_FEATURES, {
        message: v.get("maxFeaturesLimit", {
          max: STAND_OUT_CONSTANTS.MAX_FEATURES,
        }),
      })
      .default([]),
    uniqueSellingPoints: z.array(z.string()).optional(),
    specialPrograms: z.array(z.string()).optional(),
    achievements: z.array(z.string()).optional(),
  })
}

// ============================================================================
// Legacy Schemas (for backward compatibility - will be deprecated)
// ============================================================================

export const standOutValidation = z.object({
  description: z
    .string()
    .max(500, "Description must be less than 500 characters")
    .optional(),
  features: z
    .array(z.string())
    .max(
      STAND_OUT_CONSTANTS.MAX_FEATURES,
      `You can select up to ${STAND_OUT_CONSTANTS.MAX_FEATURES} features`
    )
    .default([]),
  uniqueSellingPoints: z.array(z.string()).optional(),
  specialPrograms: z.array(z.string()).optional(),
  achievements: z.array(z.string()).optional(),
})

export function validateStandOutStep(data: any): {
  isValid: boolean
  errors: Record<string, string>
} {
  try {
    standOutValidation.parse(data)
    return { isValid: true, errors: {} }
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors: Record<string, string> = {}
      error.issues.forEach((err) => {
        if (err.path.length > 0) {
          errors[err.path.join(".")] = err.message
        }
      })
      return { isValid: false, errors }
    }
    return { isValid: false, errors: { general: "Validation failed" } }
  }
}

export type StandOutValidation = z.infer<typeof standOutValidation>
