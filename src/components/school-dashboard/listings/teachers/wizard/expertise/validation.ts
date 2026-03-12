// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { z } from "zod"

export const expertiseItemSchema = z.object({
  subjectId: z.string().min(1, "Subject is required"),
  expertiseLevel: z
    .enum(["PRIMARY", "SECONDARY", "CERTIFIED"])
    .default("PRIMARY"),
})

export const expertiseSchema = z.object({
  subjectExpertise: z.array(expertiseItemSchema).default([]),
})

export type ExpertiseItemFormData = z.infer<typeof expertiseItemSchema>
export type ExpertiseFormData = z.infer<typeof expertiseSchema>
