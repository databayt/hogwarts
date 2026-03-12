// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { z } from "zod"

export const healthSchema = z.object({
  medicalConditions: z.string().optional(),
  allergies: z.string().optional(),
  medicationRequired: z.string().optional(),
  doctorName: z.string().optional(),
  doctorContact: z.string().optional(),
  insuranceProvider: z.string().optional(),
  insuranceNumber: z.string().optional(),
  bloodGroup: z.string().optional(),
})

export type HealthFormData = z.infer<typeof healthSchema>
