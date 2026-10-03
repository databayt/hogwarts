// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { z } from "zod"

import type { NameFormat } from "@/lib/name-utils"
import type { ValidationHelper } from "@/components/internationalization/helpers"

const nonNameFields = {
  gender: z.enum(["male", "female"]).optional(),
  birthDate: z.coerce.date().optional(),
  nationality: z.string().optional(),
}

export function createInformationSchema(v?: ValidationHelper) {
  return z.object({
    firstName: z.string().min(1, v?.required() || "First name is required"),
    lastName: z.string().min(1, v?.required() || "Last name is required"),
    ...nonNameFields,
  })
}

export const informationSchema = createInformationSchema()

// What the server accepts: in "full" name mode a one-word name parses to an
// empty lastName, which the client allows — rejecting it here toasted a raw
// Zod dump and left the teacher unsaved (same bug as hogwarts#424 on students).
export const informationServerSchema = informationSchema.extend({
  lastName: z.string().default(""),
})

export function getInformationSchema(
  nameFormat: NameFormat = "full",
  v?: ValidationHelper
) {
  if (nameFormat === "full") {
    return z.object({
      _fullName: z.string().min(1, v?.required() || "Full name is required"),
      firstName: z.string().default(""),
      lastName: z.string().default(""),
      ...nonNameFields,
    })
  }
  return createInformationSchema(v)
}

export type InformationFormData = z.infer<typeof informationSchema>
