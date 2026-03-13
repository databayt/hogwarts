// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { z } from "zod"

export const difficultySchema = z.object({
  EASY: z.number().min(0),
  MEDIUM: z.number().min(0),
  HARD: z.number().min(0),
})

export type DifficultyFormData = z.infer<typeof difficultySchema>
