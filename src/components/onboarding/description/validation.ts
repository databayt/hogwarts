// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { z } from "zod"

export const descriptionSchema = z.object({
  schoolType: z
    .enum(["private", "public", "international", "technical", "special"])
    .describe("Please select a school type"),
  schoolLevel: z
    .enum(["primary", "secondary", "both"])
    .describe("Please select a school level")
    .optional(),
  description: z
    .string()
    .max(500, "Description must be 500 characters or less")
    .optional(),
})

export type DescriptionFormData = z.infer<typeof descriptionSchema>
