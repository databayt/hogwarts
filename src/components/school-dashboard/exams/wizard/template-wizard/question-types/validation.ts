// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { z } from "zod"

export const questionTypesSchema = z.object({
  questionTypes: z
    .array(
      z.object({
        type: z.enum([
          "MULTIPLE_CHOICE",
          "TRUE_FALSE",
          "SHORT_ANSWER",
          "ESSAY",
          "FILL_BLANK",
          "MATCHING",
          "ORDERING",
        ]),
        count: z.number().min(1),
        difficulty: z.object({
          EASY: z.number().min(0),
          MEDIUM: z.number().min(0),
          HARD: z.number().min(0),
        }),
      })
    )
    .min(1, "Select at least one question type"),
})

export type QuestionTypesFormData = z.infer<typeof questionTypesSchema>
