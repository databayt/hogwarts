// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { z } from "zod"

export const previousEducationSchema = z.object({
  previousSchoolName: z.string().optional(),
  previousSchoolAddress: z.string().optional(),
  previousGrade: z.string().optional(),
  transferCertificateNo: z.string().optional(),
  transferDate: z.coerce.date().optional(),
  previousAcademicRecord: z.string().optional(),
})

export type PreviousEducationFormData = z.infer<typeof previousEducationSchema>
