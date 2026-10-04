// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { z } from "zod"

import { teachingScopeFields } from "@/components/school-dashboard/teaching-scope/validation"

export const informationSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  ...teachingScopeFields,
  examType: z.enum(["MIDTERM", "FINAL", "QUIZ", "TEST", "PRACTICAL"] as const, {
    message: "Exam type is required",
  }),
})

export type InformationFormData = z.infer<typeof informationSchema>
