// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { z } from "zod"

export function createGuardianSchema(atLeastOneParentMsg?: string) {
  return z
    .object({
      fatherFirstName: z.string().optional(),
      fatherLastName: z.string().optional(),
      fatherOccupation: z.string().optional(),
      fatherPhone: z.string().optional(),
      fatherEmail: z.string().email().optional().or(z.literal("")),
      motherFirstName: z.string().optional(),
      motherLastName: z.string().optional(),
      motherOccupation: z.string().optional(),
      motherPhone: z.string().optional(),
      motherEmail: z.string().email().optional().or(z.literal("")),
    })
    .refine(
      (data) =>
        (data.fatherFirstName && data.fatherFirstName.trim().length > 0) ||
        (data.motherFirstName && data.motherFirstName.trim().length > 0),
      {
        message: atLeastOneParentMsg || "At least one parent name is required",
        path: ["fatherFirstName"],
      }
    )
}

export const guardianSchema = createGuardianSchema()

export type GuardianFormData = z.infer<typeof guardianSchema>
