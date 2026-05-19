// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { z } from "zod"

import type { ValidationHelper } from "@/components/internationalization/helpers"

export function createDescriptionSchema(v?: ValidationHelper) {
  const required = v?.required() ?? "Required"
  const maxDesc = v?.maxLength(500) ?? "Must be no more than 500 characters"

  return z.object({
    schoolType: z.enum(
      ["private", "public", "international", "technical", "special"],
      { message: required }
    ),
    schoolLevel: z
      .enum(["primary", "middle", "secondary", "both"], { message: required })
      .optional(),
    description: z.string().max(500, maxDesc).optional(),
  })
}

export const descriptionSchema = createDescriptionSchema()

export type DescriptionFormData = z.infer<typeof descriptionSchema>
