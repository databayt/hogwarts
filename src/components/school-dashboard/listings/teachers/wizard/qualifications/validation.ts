// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { z } from "zod"

export const qualificationsSchema = z.object({
  degrees: z.string().optional().default(""),
  certifications: z.string().optional().default(""),
  cv: z.string().optional().default(""),
  id: z.string().optional().default(""),
  licenses: z.string().optional().default(""),
  other: z.string().optional().default(""),
})

export type QualificationsFormData = z.infer<typeof qualificationsSchema>
