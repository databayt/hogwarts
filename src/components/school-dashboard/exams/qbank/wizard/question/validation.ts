// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { z } from "zod"

export type ValidationMessages = Record<string, string | undefined>

export function createQuestionDetailsSchema(m: ValidationMessages = {}) {
  return z.object({
    subjectId: z.string().min(1, m.subjectRequired),
    questionText: z.string().min(10, m.questionTextMin),
    questionType: z.enum([
      "MULTIPLE_CHOICE",
      "TRUE_FALSE",
      "FILL_BLANK",
      "SHORT_ANSWER",
      "ESSAY",
      "MATCHING",
      "ORDERING",
      "MULTI_SELECT",
    ]),
    difficulty: z.enum(["EASY", "MEDIUM", "HARD"]),
    bloomLevel: z.enum([
      "REMEMBER",
      "UNDERSTAND",
      "APPLY",
      "ANALYZE",
      "EVALUATE",
      "CREATE",
    ]),
    points: z.coerce.number().min(0.5, m.pointsMin).max(100, m.pointsMax),
    timeEstimate: z.coerce
      .number()
      .int()
      .positive()
      .optional()
      .or(z.literal("")),
    tags: z.string().optional(),
    explanation: z.string().optional(),
    imageUrl: z.string().optional(),
  })
}

export const questionDetailsSchema = createQuestionDetailsSchema({})

export type QuestionDetailsFormData = z.infer<typeof questionDetailsSchema>
