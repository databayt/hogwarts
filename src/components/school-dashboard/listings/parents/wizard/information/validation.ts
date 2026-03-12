// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { z } from "zod"

export const informationSchema = z.object({
  givenName: z.string().min(1, "Given name is required"),
  surname: z.string().min(1, "Surname is required"),
  emailAddress: z
    .string()
    .email("Valid email is required")
    .optional()
    .or(z.literal("")),
  profilePhotoUrl: z.string().optional(),
})

export type InformationFormData = z.infer<typeof informationSchema>
