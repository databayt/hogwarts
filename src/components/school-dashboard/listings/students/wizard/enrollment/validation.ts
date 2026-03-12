// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { z } from "zod"

export const enrollmentSchema = z.object({
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
  sectionId: z.string().optional(),
})

export type EnrollmentFormData = z.infer<typeof enrollmentSchema>
