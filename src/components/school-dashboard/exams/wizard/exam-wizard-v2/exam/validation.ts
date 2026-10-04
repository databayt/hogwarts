// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { z } from "zod"

import { teachingScopeFields } from "@/components/school-dashboard/teaching-scope/validation"

export const examDetailsSchema = z.object({
  title: z.string().min(1, "Title is required"),
  ...teachingScopeFields,
  examDate: z.coerce.date(),
  startTime: z.string().default("09:00"),
  duration: z.number().min(5).max(480),
  totalMarks: z.number().min(1),
  passingMarks: z.number().min(0),
})

export type ExamDetailsFormData = z.infer<typeof examDetailsSchema>
