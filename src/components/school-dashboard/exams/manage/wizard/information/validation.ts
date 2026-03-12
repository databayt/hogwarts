// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { z } from "zod"

export const informationSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  classId: z.string().min(1, "Class is required"),
  subjectId: z.string().min(1, "Subject is required"),
  examType: z.enum(["MIDTERM", "FINAL", "QUIZ", "TEST", "PRACTICAL"] as const, {
    message: "Exam type is required",
  }),
})

export type InformationFormData = z.infer<typeof informationSchema>
