// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { z } from "zod"

import { teachingScopeFields } from "@/components/school-dashboard/teaching-scope/validation"

export const quickAssessmentCreateSchema = z.object({
  title: z.string().min(1, "Title is required"),
  // Who it's for: a grade, one of its sections or the whole grade, a subject
  ...teachingScopeFields,
  type: z.enum(["EXIT_TICKET", "POLL", "WARM_UP", "CHECK_IN"]),
  questionIds: z.array(z.string()).min(1, "At least one question is required"),
  duration: z.number().int().min(1).max(60).optional().default(5),
  isAnonymous: z.boolean().optional().default(false),
  showResults: z.boolean().optional().default(true),
})

export const quickAssessmentUpdateSchema = quickAssessmentCreateSchema
  .partial()
  .extend({
    id: z.string().min(1, "ID is required"),
  })

/** The review page's edit: rename, reorder or remove questions, duration, results. */
export const quickAssessmentReviewSchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  duration: z.number().int().min(1).max(60).optional(),
  // Reorder / remove only: every id must already belong to the assessment
  questionIds: z.array(z.string().min(1)).min(1).max(50).optional(),
  showResults: z.boolean().optional(),
})

export const submitQuickResponseSchema = z.object({
  assessmentId: z.string().min(1, "Assessment ID is required"),
  responses: z.array(
    z.object({
      questionId: z.string(),
      // No isCorrect: the server marks answers against the bank
      answer: z.unknown(),
    })
  ),
})
