// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { z } from "zod"

export const durationMarksSchema = z.object({
  duration: z
    .number()
    .min(5, "Minimum 5 minutes")
    .max(480, "Maximum 480 minutes"),
  totalMarks: z
    .number()
    .min(1, "Minimum 1 mark")
    .max(1000, "Maximum 1000 marks"),
})

export type DurationMarksFormData = z.infer<typeof durationMarksSchema>
