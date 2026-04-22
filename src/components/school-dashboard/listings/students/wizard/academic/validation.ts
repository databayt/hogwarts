// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { z } from "zod"

import type { ValidationHelper } from "@/components/internationalization/helpers"

// Academic step schema — merges enrollment (grade/stream/section + admission
// details) and previous education (previous school + transfer info) into a
// single form. Mirrors the application wizard's academic step so both wizards
// collect the same information in the same step.

export function createAcademicSchema(_v?: ValidationHelper) {
  return z.object({
    // Enrollment
    enrollmentDate: z.coerce.date().optional(),
    admissionNumber: z.string().optional(),
    status: z
      .enum([
        "ACTIVE",
        "INACTIVE",
        "SUSPENDED",
        "GRADUATED",
        "TRANSFERRED",
        "DROPPED_OUT",
      ])
      .optional(),
    studentType: z
      .enum(["REGULAR", "TRANSFER", "INTERNATIONAL", "EXCHANGE"])
      .optional(),
    category: z.string().optional(),
    academicGradeId: z.string().optional(),
    academicStreamId: z.string().optional(),
    sectionId: z.string().optional(),
    // Previous education
    previousSchoolName: z.string().optional(),
    previousSchoolAddress: z.string().optional(),
    previousGrade: z.string().optional(),
    transferCertificateNo: z.string().optional(),
    transferDate: z.coerce.date().optional(),
    previousAcademicRecord: z.string().optional(),
  })
}

export const academicSchema = createAcademicSchema()

export type AcademicFormData = z.infer<typeof academicSchema>
