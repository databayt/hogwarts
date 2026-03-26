// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { z } from "zod"

import type { NameFormat } from "@/lib/name-utils"

const nonNameFields = {
  dateOfBirth: z.coerce.date().optional(),
  gender: z.enum(["male", "female"] as const).optional(),
  nationality: z.string().optional(),
  profilePhotoUrl: z.string().optional(),
}

export const personalSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  middleName: z.string().optional(),
  lastName: z.string().min(1, "Last name is required"),
  ...nonNameFields,
})

export function getPersonalSchema(nameFormat: NameFormat = "full") {
  if (nameFormat === "full") {
    return z.object({
      _fullName: z.string().min(1, "Full name is required"),
      firstName: z.string().default(""),
      middleName: z.string().optional(),
      lastName: z.string().default(""),
      ...nonNameFields,
    })
  }
  return personalSchema
}

export type PersonalFormData = z.infer<typeof personalSchema>
export type PersonalFormDataFull = z.infer<ReturnType<typeof getPersonalSchema>>
