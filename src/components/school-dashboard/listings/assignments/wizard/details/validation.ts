// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { z } from "zod"

import {
  defaultAssignmentValidationMessages,
  type AssignmentValidationMessages,
} from "../../validation-messages"

/** Builder — pass `assignments.validation` so the wizard speaks the reader's language. */
export function createDetailsSchema(m: AssignmentValidationMessages) {
  return z.object({
    totalPoints: z.coerce.number().min(0.01, m.totalPointsMin),
    weight: z.coerce.number().min(0.01, m.weightMin).max(100, m.weightMax),
    dueDate: z.coerce.date({ message: m.dueDateRequired }),
    instructions: z.string().optional(),
    attachments: z.array(z.string().url()).max(10).default([]),
  })
}

/** Default-language schema for server actions. */
export const detailsSchema = createDetailsSchema(
  defaultAssignmentValidationMessages
)

export type DetailsFormData = z.infer<typeof detailsSchema>
