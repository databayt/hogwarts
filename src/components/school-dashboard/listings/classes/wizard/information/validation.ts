// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { z } from "zod"

export const informationSchema = z.object({
  name: z.string().min(1, "Class name is required"),
  subjectId: z.string().min(1, "Subject is required"),
  teacherId: z.string().min(1, "Teacher is required"),
  gradeId: z.string().optional(),
  courseCode: z.string().optional(),
  evaluationType: z.enum(["NORMAL", "GPA", "CWA", "CCE"]).default("NORMAL"),
})

export type InformationFormData = z.infer<typeof informationSchema>
