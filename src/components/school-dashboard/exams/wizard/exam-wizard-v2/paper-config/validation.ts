// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { z } from "zod"

export const paperConfigSchema = z.object({
  template: z
    .enum(["CLASSIC", "MODERN", "FORMAL", "CUSTOM"])
    .default("CLASSIC"),
  pageSize: z.enum(["A4", "Letter"]).default("A4"),
  shuffleQuestions: z.boolean().default(true),
  shuffleOptions: z.boolean().default(true),
  versionCount: z.number().min(1).max(5).default(1),
  showSchoolLogo: z.boolean().default(true),
  showInstructions: z.boolean().default(true),
  showPointsPerQuestion: z.boolean().default(true),
})

export type PaperConfigFormData = z.infer<typeof paperConfigSchema>
