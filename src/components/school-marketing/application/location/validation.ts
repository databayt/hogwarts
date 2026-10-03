// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { z } from "zod"

import type { ValidationHelper } from "@/components/internationalization/helpers"

import { FORM_LIMITS } from "../config.client"

export function createLocationSchema(v: ValidationHelper) {
  return z.object({
    address: z
      .string()
      .min(1, v.required())
      .max(
        FORM_LIMITS.ADDRESS_MAX_LENGTH,
        v.maxLength(FORM_LIMITS.ADDRESS_MAX_LENGTH)
      ),
    city: z
      .string()
      .min(1, v.required())
      .max(
        FORM_LIMITS.CITY_MAX_LENGTH,
        v.maxLength(FORM_LIMITS.CITY_MAX_LENGTH)
      ),
    state: z
      .string()
      .min(1, v.required())
      .max(
        FORM_LIMITS.STATE_MAX_LENGTH,
        v.maxLength(FORM_LIMITS.STATE_MAX_LENGTH)
      ),
    postalCode: z
      .string()
      .max(
        FORM_LIMITS.POSTAL_CODE_MAX_LENGTH,
        v.maxLength(FORM_LIMITS.POSTAL_CODE_MAX_LENGTH)
      )
      .optional()
      .or(z.literal("")),
    country: z.string().min(1, v.required()),
    // The exact pin from the map picker
    latitude: z.number().min(-90).max(90).optional(),
    longitude: z.number().min(-180).max(180).optional(),
  })
}

// Fallback schema for cases where ValidationHelper is not available
export const locationSchema = z.object({
  address: z.string().min(1).max(FORM_LIMITS.ADDRESS_MAX_LENGTH),
  city: z.string().min(1).max(FORM_LIMITS.CITY_MAX_LENGTH),
  state: z.string().min(1).max(FORM_LIMITS.STATE_MAX_LENGTH),
  postalCode: z
    .string()
    .max(FORM_LIMITS.POSTAL_CODE_MAX_LENGTH)
    .optional()
    .or(z.literal("")),
  country: z.string().min(1),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
})

export type LocationSchemaType = z.infer<typeof locationSchema>
