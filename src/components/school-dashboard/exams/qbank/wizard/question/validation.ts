// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { z } from "zod"

export const questionDetailsSchema = z.object({
  subjectId: z.string().min(1, "Subject is required"),
  questionText: z
    .string()
    .min(10, "Question text must be at least 10 characters"),
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
  points: z.coerce
    .number()
    .min(0.5, "Points must be at least 0.5")
    .max(100, "Points cannot exceed 100"),
  timeEstimate: z.coerce.number().int().positive().optional().or(z.literal("")),
  tags: z.string().optional(),
  explanation: z.string().optional(),
  imageUrl: z.string().optional(),
})

export type QuestionDetailsFormData = z.infer<typeof questionDetailsSchema>
