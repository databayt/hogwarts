// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { z } from "zod"

import { teachingScopeFields } from "@/components/school-dashboard/teaching-scope/validation"

import {
  defaultAssignmentValidationMessages,
  type AssignmentValidationMessages,
} from "../../validation-messages"

/** Builder — pass `assignments.validation` so the wizard speaks the reader's language. */
export function createInformationSchema(m: AssignmentValidationMessages) {
  return z.object({
    title: z.string().min(1, m.titleRequired),
    ...teachingScopeFields,
    type: z.enum([
      "HOMEWORK",
      "QUIZ",
      "TEST",
      "MIDTERM",
      "FINAL_EXAM",
      "PROJECT",
      "LAB_REPORT",
      "ESSAY",
      "PRESENTATION",
    ]),
    description: z.string().optional(),
  })
}

/** Default-language schema for server actions. */
export const informationSchema = createInformationSchema(
  defaultAssignmentValidationMessages
)

export type InformationFormData = z.infer<typeof informationSchema>
