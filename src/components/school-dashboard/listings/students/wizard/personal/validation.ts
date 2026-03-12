// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { z } from "zod"

export const personalSchema = z.object({
  givenName: z.string().min(1, "Given name is required"),
  middleName: z.string().optional(),
  surname: z.string().min(1, "Surname is required"),
  dateOfBirth: z.coerce.date({ message: "Date of birth is required" }),
  gender: z.enum(["male", "female"] as const, {
    message: "Gender is required",
  }),
  nationality: z.string().optional(),
  profilePhotoUrl: z.string().optional(),
})

export type PersonalFormData = z.infer<typeof personalSchema>
