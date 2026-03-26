// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { z } from "zod"

export const informationSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  emailAddress: z
    .string()
    .email("Valid email is required")
    .optional()
    .or(z.literal("")),
  profilePhotoUrl: z.string().optional(),
})

export type InformationFormData = z.infer<typeof informationSchema>
