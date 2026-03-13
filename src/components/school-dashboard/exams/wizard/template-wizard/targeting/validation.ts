// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { z } from "zod"

export const targetingSchema = z.object({
  gradeIds: z.array(z.string()).default([]),
  sectionIds: z.array(z.string()).default([]),
  classroomIds: z.array(z.string()).default([]),
})

export type TargetingFormData = z.infer<typeof targetingSchema>
