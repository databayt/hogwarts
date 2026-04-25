// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { z } from "zod"

import type { ValidationHelper } from "@/components/internationalization/helpers"

// Single source of truth for location validation. `country` is required as a
// 2-letter ISO code because fee-provisioning.ts and catalog-setup.ts key off
// it — silently persisting an empty string would produce schools with no
// catalog match and no fee structures downstream.

export function createLocationSchema(v?: ValidationHelper) {
  const required = v?.required() ?? "Required"
  const countryRequired = v?.get("countryRequired") ?? "Country is required"

  return z.object({
    address: z
      .string()
      .transform((s) => s.trim())
      .pipe(z.string().min(1, required)),
    city: z.string().trim().optional().default(""),
    state: z.string().trim().optional().default(""),
    country: z
      .string()
      .transform((s) => s.trim())
      .pipe(z.string().regex(/^[A-Z]{2}$/, countryRequired)),
    postalCode: z.string().optional().default(""),
    latitude: z.number(),
    longitude: z.number(),
  })
}

export const locationSchema = createLocationSchema()

export type LocationFormData = z.infer<typeof locationSchema>
