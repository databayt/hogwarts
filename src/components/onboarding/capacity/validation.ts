// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { z } from "zod"

export const capacitySchema = z.object({
  teachers: z.number().min(1).max(500),
  sectionsPerGrade: z.number().min(1).max(10),
  studentsPerSection: z.number().min(10).max(60),
})

export type CapacityFormData = z.infer<typeof capacitySchema>
