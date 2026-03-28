// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { z } from "zod"

import type { NameFormat } from "@/lib/name-utils"
import type { ValidationHelper } from "@/components/internationalization/helpers"

const nonNameFields = {
  dateOfBirth: z.coerce.date().optional(),
  gender: z.enum(["male", "female"] as const).optional(),
  nationality: z.string().optional(),
  profilePhotoUrl: z.string().optional(),
}

export function createPersonalSchema(v?: ValidationHelper) {
  return z.object({
    firstName: z
      .string()
      .min(1, v?.get("firstNameRequired") || "First name is required"),
    middleName: z.string().optional(),
    lastName: z
      .string()
      .min(1, v?.get("lastNameRequired") || "Last name is required"),
    ...nonNameFields,
  })
}

export const personalSchema = createPersonalSchema()

export function getPersonalSchema(
  nameFormat: NameFormat = "full",
  v?: ValidationHelper
) {
  if (nameFormat === "full") {
    return z.object({
      _fullName: z.string().min(1, v?.required() || "Full name is required"),
      firstName: z.string().default(""),
      middleName: z.string().optional(),
      lastName: z.string().default(""),
      ...nonNameFields,
    })
  }
  return createPersonalSchema(v)
}

export type PersonalFormData = z.infer<typeof personalSchema>
export type PersonalFormDataFull = z.infer<ReturnType<typeof getPersonalSchema>>
