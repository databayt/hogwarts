// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { z } from "zod"

import type { NameFormat } from "@/lib/name-utils"
import type { ValidationHelper } from "@/components/internationalization/helpers"

// -----------------------------------------------------------------------------
// Student sub-tab — Student record columns (Student table)
// -----------------------------------------------------------------------------

const studentNonNameFields = {
  dateOfBirth: z.coerce.date().optional(),
  gender: z.enum(["male", "female"] as const).optional(),
  nationality: z.string().optional(),
  profilePhotoUrl: z.string().optional(),
  // Contact — absorbed from retired `contact` step
  email: z.string().email().optional().or(z.literal("")),
  mobileNumber: z.string().optional(),
  alternatePhone: z.string().optional(),
  // Emergency contact — absorbed from retired `contact` step's second tab
  emergencyContactName: z.string().optional(),
  emergencyContactPhone: z.string().optional(),
  emergencyContactRelation: z.string().optional(),
}

export function createPersonalStudentSchema(v?: ValidationHelper) {
  return z.object({
    firstName: z.string().min(1, v?.required() || "First name is required"),
    middleName: z.string().optional(),
    lastName: z.string().min(1, v?.required() || "Last name is required"),
    ...studentNonNameFields,
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
      ...studentNonNameFields,
    })
  }
  return createPersonalStudentSchema(v)
}

export type PersonalStudentFormData = z.infer<typeof personalStudentSchema>
export type PersonalStudentFormDataFull = z.infer<
  ReturnType<typeof getPersonalStudentSchema>
>

// -----------------------------------------------------------------------------
// Guardian sub-tabs (Father + Mother) — Guardian + StudentGuardian + GuardianPhoneNumber
// -----------------------------------------------------------------------------

export function createPersonalGuardianSchema(atLeastOneParentMsg?: string) {
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

export const personalGuardianSchema = createPersonalGuardianSchema()

export type PersonalGuardianFormData = z.infer<typeof personalGuardianSchema>

// -----------------------------------------------------------------------------
// Backwards-compat aliases
// -----------------------------------------------------------------------------
// Other modules referenced `personalSchema` / `PersonalFormData` before the
// personal step was split into Student + Guardian sub-tabs. Keep thin aliases
// so callers that still import the old names keep compiling until they are
// migrated.

export const personalSchema = personalStudentSchema
export type PersonalFormData = PersonalStudentFormData
export const createPersonalSchema = createPersonalStudentSchema
export const getPersonalSchema = getPersonalStudentSchema
