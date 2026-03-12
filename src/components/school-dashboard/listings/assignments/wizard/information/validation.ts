// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { z } from "zod"

export const informationSchema = z.object({
  title: z.string().min(1, "Title is required"),
  classId: z.string().min(1, "Class is required"),
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

export type InformationFormData = z.infer<typeof informationSchema>
