// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { z } from "zod"

import type { NameFormat } from "@/lib/name-utils"

const nonNameFields = {
  gender: z.enum(["male", "female"]).optional(),
  birthDate: z.coerce.date().optional(),
  nationality: z.string().optional(),
}

export const informationSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  ...nonNameFields,
})

export function getInformationSchema(nameFormat: NameFormat = "full") {
  if (nameFormat === "full") {
    return z.object({
      _fullName: z.string().min(1, "Full name is required"),
      firstName: z.string().default(""),
      lastName: z.string().default(""),
      ...nonNameFields,
    })
  }
  return informationSchema
}

export type InformationFormData = z.infer<typeof informationSchema>
