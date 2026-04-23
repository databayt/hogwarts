// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { z } from "zod"

import type { ValidationHelper } from "@/components/internationalization/helpers"

// Academic step — mirrors the public application's shape.
// Wizard collects just enough for class placement + optional prior-school
// context. Extras (enrollment date, admission number, status, transfer
// details, academic record, …) are filled later on the student profile.

export function createAcademicSchema(_v?: ValidationHelper) {
  return z.object({
    academicGradeId: z.string().optional(),
    academicStreamId: z.string().optional(),
    sectionId: z.string().optional(),
    previousSchoolName: z.string().optional(),
  })
}

export const academicSchema = createAcademicSchema()

export type AcademicFormData = z.infer<typeof academicSchema>
