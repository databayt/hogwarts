// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { z } from "zod"

export const scoringSchema = z.object({
  passingScore: z.number().min(0).max(100),
  gradeBoundaries: z.array(
    z.object({
      label: z.string(),
      minPercent: z.number().min(0).max(100),
    })
  ),
})

export type ScoringFormData = z.infer<typeof scoringSchema>
