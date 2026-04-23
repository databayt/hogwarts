// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { z } from "zod"

import type { NameFormat } from "@/lib/name-utils"
import type { ValidationHelper } from "@/components/internationalization/helpers"

// -----------------------------------------------------------------------------
// Student sub-tab — mirrors the public application's "personal" step.
// Collects only: name + phone + whatsapp.
// Extras (DOB, gender, nationality, emergency contact, …) are filled later
// by the student on their profile page.
// -----------------------------------------------------------------------------

const studentContactFields = {
  mobileNumber: z.string().optional(),
  alternatePhone: z.string().optional(),
}

export function createPersonalStudentSchema(v?: ValidationHelper) {
  return z.object({
    firstName: z.string().min(1, v?.required() || "First name is required"),
    middleName: z.string().optional(),
    lastName: z.string().min(1, v?.required() || "Last name is required"),
    ...studentContactFields,
  })
}

export const personalStudentSchema = createPersonalStudentSchema()

export function getPersonalStudentSchema(
  nameFormat: NameFormat = "full",
  v?: ValidationHelper
) {
  if (nameFormat === "full") {
    return z.object({
      _fullName: z.string().min(1, v?.required() || "Required"),
      firstName: z.string().default(""),
      middleName: z.string().optional(),
      lastName: z.string().default(""),
      ...studentContactFields,
    })
  }
  return createPersonalStudentSchema(v)
}

export type PersonalStudentFormData = z.infer<typeof personalStudentSchema>
export type PersonalStudentFormDataFull = z.infer<
  ReturnType<typeof getPersonalStudentSchema>
>

// -----------------------------------------------------------------------------
// Guardian sub-tabs (Father + Mother) — single-name shape matching the
// public application. Guardian-level extras (occupation, structured last
// name, …) are captured later via the profile.
// -----------------------------------------------------------------------------

export function createPersonalGuardianSchema(atLeastOneParentMsg?: string) {
  return z
    .object({
      fatherName: z.string().optional(),
      fatherPhone: z.string().optional(),
      fatherWhatsapp: z.string().optional(),
      motherName: z.string().optional(),
      motherPhone: z.string().optional(),
      motherWhatsapp: z.string().optional(),
    })
    .refine(
      (data) =>
        (data.fatherName && data.fatherName.trim().length > 0) ||
        (data.motherName && data.motherName.trim().length > 0),
      {
        message: atLeastOneParentMsg || "At least one parent name is required",
        path: ["fatherName"],
      }
    )
}

export const personalGuardianSchema = createPersonalGuardianSchema()

export type PersonalGuardianFormData = z.infer<typeof personalGuardianSchema>

// -----------------------------------------------------------------------------
// Backwards-compat aliases
// -----------------------------------------------------------------------------

export const personalSchema = personalStudentSchema
export type PersonalFormData = PersonalStudentFormData
export const createPersonalSchema = createPersonalStudentSchema
export const getPersonalSchema = getPersonalStudentSchema
