import { z } from "zod"

import type { Dictionary } from "@/components/internationalization/dictionaries"
import { getValidationMessages } from "@/components/internationalization/helpers"

// ============================================================================
// Schema Factory Functions (i18n-enabled)
// ============================================================================

export function createLocationSchema(dictionary: Dictionary) {
  const v = getValidationMessages(dictionary)

  return z.object({
    address: z
      .string()
      .min(1, { message: v.get("addressRequired") })
      .trim(),
    city: z
      .string()
      .min(1, { message: v.get("cityRequired") })
      .trim(),
    state: z
      .string()
      .min(1, { message: v.get("stateRequired") })
      .trim(),
    country: z
      .string()
      .min(1, { message: v.get("countryRequired") })
      .trim()
      .regex(/^[A-Z]{2}$/, {
        message: v.get("countryRequired"),
      }),
    postalCode: z.string().optional().default(""),
    latitude: z.number().optional().default(0),
    longitude: z.number().optional().default(0),
  })
}

// ============================================================================
// Main Schema (used with Mapbox autocomplete)
// ============================================================================

export const locationSchema = z.object({
  address: z.string().min(1, "Address is required").trim(),
  city: z.string().optional().default(""),
  state: z.string().optional().default(""),
  country: z
    .string()
    .refine((val) => val === "" || /^[A-Z]{2}$/.test(val), {
      message: "Country must be a 2-letter ISO code",
    })
    .default(""),
  postalCode: z.string().optional().default(""),
  latitude: z.number(),
  longitude: z.number(),
})

export type LocationFormData = z.infer<typeof locationSchema>
