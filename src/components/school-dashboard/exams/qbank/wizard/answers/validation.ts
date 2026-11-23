// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { z } from "zod"

/**
 * Messages come from `exams.qbank.validation` (see ../../validation.ts);
 * a missing key leaves zod's default message.
 */
export type ValidationMessages = Record<string, string | undefined>

export function createAnswersSchema(m: ValidationMessages = {}) {
  const optionSchema = z.object({
    text: z.string().min(1, m.optionTextRequired),
    isCorrect: z.boolean().optional().default(false),
    explanation: z.string().optional(),
  })
  return {
    optionSchema,
    answersSchema: z.object({
      options: z.array(optionSchema).optional(),
      acceptedAnswers: z.array(z.string().min(1)).optional(),
      caseSensitive: z.boolean().optional(),
      sampleAnswer: z.string().optional(),
      gradingRubric: z.string().optional(),
    }),
  }
}

const defaults = createAnswersSchema({})
export const optionSchema = defaults.optionSchema
export const answersSchema = defaults.answersSchema

export type AnswersFormData = z.infer<typeof answersSchema>
export type OptionItem = z.infer<typeof optionSchema>
