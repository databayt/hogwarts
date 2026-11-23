// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { z } from "zod"

import { teachingScopeFields } from "@/components/school-dashboard/teaching-scope/validation"

/** Localised messages — the `exams.quick.validation` dictionary subtree. */
export interface QuickValidationMessages {
  titleRequired?: string
  questionsRequired?: string
  durationRange?: string
  idRequired?: string
  assessmentIdRequired?: string
}

const msg = (m?: string) => (m ? { message: m } : undefined)

export function createQuickAssessmentCreateSchema(
  messages: QuickValidationMessages = {}
) {
  return z.object({
    title: z.string().min(1, msg(messages.titleRequired)),
    // Who it's for: a grade, one of its sections or the whole grade, a subject
    ...teachingScopeFields,
    type: z.enum(["EXIT_TICKET", "POLL", "WARM_UP", "CHECK_IN"]),
    questionIds: z.array(z.string()).min(1, msg(messages.questionsRequired)),
    duration: z
      .number()
      .int()
      .min(1, msg(messages.durationRange))
      .max(60, msg(messages.durationRange))
      .optional()
      .default(5),
    isAnonymous: z.boolean().optional().default(false),
    showResults: z.boolean().optional().default(true),
  })
}

export function createQuickAssessmentUpdateSchema(
  messages: QuickValidationMessages = {}
) {
  return createQuickAssessmentCreateSchema(messages)
    .partial()
    .extend({
      id: z.string().min(1, msg(messages.idRequired)),
    })
}

/** Server-side default (no locale): plain schemas for actions and callers. */
export const quickAssessmentCreateSchema = createQuickAssessmentCreateSchema()

export const quickAssessmentUpdateSchema = createQuickAssessmentUpdateSchema()

/** The review page's edit: rename, reorder or remove questions, duration, results. */
export const quickAssessmentReviewSchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  duration: z.number().int().min(1).max(60).optional(),
  // Reorder / remove only: every id must already belong to the assessment
  questionIds: z.array(z.string().min(1)).min(1).max(50).optional(),
  showResults: z.boolean().optional(),
})

export function createSubmitQuickResponseSchema(
  messages: QuickValidationMessages = {}
) {
  return z.object({
    assessmentId: z.string().min(1, msg(messages.assessmentIdRequired)),
    responses: z.array(
      z.object({
        questionId: z.string(),
        // No isCorrect: the server marks answers against the bank
        answer: z.unknown(),
      })
    ),
  })
}

export const submitQuickResponseSchema = createSubmitQuickResponseSchema()
