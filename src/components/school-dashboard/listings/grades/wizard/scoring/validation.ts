// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { z } from "zod"

export const scoringSchema = z
  .object({
    score: z.coerce.number().min(0, "Score must be 0 or greater"),
    maxScore: z.coerce.number().min(0.01, "Max score must be greater than 0"),
    grade: z.string().min(1, "Grade is required"),
    feedback: z.string().optional(),
  })
  .refine((data) => data.score <= data.maxScore, {
    message: "Score cannot exceed max score",
    path: ["score"],
  })

export type ScoringFormData = z.infer<typeof scoringSchema>
