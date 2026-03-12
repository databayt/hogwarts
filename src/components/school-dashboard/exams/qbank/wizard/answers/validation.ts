// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { z } from "zod"

export const optionSchema = z.object({
  text: z.string().min(1, "Option text is required"),
  isCorrect: z.boolean().optional().default(false),
  explanation: z.string().optional(),
})

export const answersSchema = z.object({
  options: z.array(optionSchema).optional(),
  acceptedAnswers: z.array(z.string().min(1)).optional(),
  caseSensitive: z.boolean().optional(),
  sampleAnswer: z.string().optional(),
  gradingRubric: z.string().optional(),
})

export type AnswersFormData = z.infer<typeof answersSchema>
export type OptionItem = z.infer<typeof optionSchema>
