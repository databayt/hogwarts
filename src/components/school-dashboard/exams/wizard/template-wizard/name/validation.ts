// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { z } from "zod"

export const nameSchema = z.object({
  name: z.string().min(1, "Template name is required"),
  description: z.string().optional(),
  examType: z
    .enum(["MIDTERM", "FINAL", "QUIZ", "POP_QUIZ", "MOCK", "PRACTICE"])
    .default("MIDTERM"),
})

export type NameFormData = z.infer<typeof nameSchema>
