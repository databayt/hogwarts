// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { z } from "zod"

export const managementSchema = z.object({
  credits: z.coerce.number().positive().optional(),
  minCapacity: z.coerce.number().int().positive().optional(),
  maxCapacity: z.coerce.number().int().positive().optional(),
  prerequisiteId: z.string().optional(),
})

export type ManagementFormData = z.infer<typeof managementSchema>
