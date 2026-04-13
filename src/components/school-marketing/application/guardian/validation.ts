// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

// Guardian Step Validation

import { z } from "zod"

import type { ValidationHelper } from "@/components/internationalization/helpers"

import { FORM_LIMITS } from "../config.client"

export function createGuardianSchema(v: ValidationHelper) {
  return z
    .object({
      fatherName: z
        .string()
        .max(
          FORM_LIMITS.NAME_MAX_LENGTH,
          v.maxLength(FORM_LIMITS.NAME_MAX_LENGTH)
        )
        .optional()
        .or(z.literal("")),
      fatherOccupation: z
        .string()
        .max(100, v.maxLength(100))
        .optional()
        .or(z.literal("")),
      fatherPhone: z
        .string()
        .max(
          FORM_LIMITS.PHONE_MAX_LENGTH,
          v.maxLength(FORM_LIMITS.PHONE_MAX_LENGTH)
        )
        .optional()
        .or(z.literal("")),
      fatherEmail: z
        .string()
        .max(
          FORM_LIMITS.PHONE_MAX_LENGTH,
          v.maxLength(FORM_LIMITS.PHONE_MAX_LENGTH)
        )
        .optional()
        .or(z.literal("")),
      motherName: z
        .string()
        .max(
          FORM_LIMITS.NAME_MAX_LENGTH,
          v.maxLength(FORM_LIMITS.NAME_MAX_LENGTH)
        )
        .optional()
        .or(z.literal("")),
      motherOccupation: z
        .string()
        .max(100, v.maxLength(100))
        .optional()
        .or(z.literal("")),
      motherPhone: z
        .string()
        .max(
          FORM_LIMITS.PHONE_MAX_LENGTH,
          v.maxLength(FORM_LIMITS.PHONE_MAX_LENGTH)
        )
        .optional()
        .or(z.literal("")),
      motherEmail: z
        .string()
        .max(
          FORM_LIMITS.PHONE_MAX_LENGTH,
          v.maxLength(FORM_LIMITS.PHONE_MAX_LENGTH)
        )
        .optional()
        .or(z.literal("")),
      guardianName: z
        .string()
        .max(
          FORM_LIMITS.NAME_MAX_LENGTH,
          v.maxLength(FORM_LIMITS.NAME_MAX_LENGTH)
        )
        .optional()
        .or(z.literal("")),
      guardianRelation: z.string().optional().or(z.literal("")),
      guardianPhone: z
        .string()
        .max(
          FORM_LIMITS.PHONE_MAX_LENGTH,
          v.maxLength(FORM_LIMITS.PHONE_MAX_LENGTH)
        )
        .optional()
        .or(z.literal("")),
      guardianEmail: z
        .string()
        .email(v.email())
        .max(
          FORM_LIMITS.EMAIL_MAX_LENGTH,
          v.maxLength(FORM_LIMITS.EMAIL_MAX_LENGTH)
        )
        .optional()
        .or(z.literal("")),
    })
    .refine(
      (data) =>
        (data.fatherName && data.fatherName.length >= 2) ||
        (data.motherName && data.motherName.length >= 2),
      {
        message: v.required(),
        path: ["fatherName"],
      }
    )
}

// Fallback schema for cases where ValidationHelper is not available
export const guardianSchema = z
  .object({
    fatherName: z
      .string()
      .max(FORM_LIMITS.NAME_MAX_LENGTH)
      .optional()
      .or(z.literal("")),
    fatherOccupation: z.string().max(100).optional().or(z.literal("")),
    fatherPhone: z
      .string()
      .max(FORM_LIMITS.PHONE_MAX_LENGTH)
      .optional()
      .or(z.literal("")),
    fatherEmail: z
      .string()
      .max(FORM_LIMITS.PHONE_MAX_LENGTH)
      .optional()
      .or(z.literal("")),
    motherName: z
      .string()
      .max(FORM_LIMITS.NAME_MAX_LENGTH)
      .optional()
      .or(z.literal("")),
    motherOccupation: z.string().max(100).optional().or(z.literal("")),
    motherPhone: z
      .string()
      .max(FORM_LIMITS.PHONE_MAX_LENGTH)
      .optional()
      .or(z.literal("")),
    motherEmail: z
      .string()
      .max(FORM_LIMITS.PHONE_MAX_LENGTH)
      .optional()
      .or(z.literal("")),
    guardianName: z
      .string()
      .max(FORM_LIMITS.NAME_MAX_LENGTH)
      .optional()
      .or(z.literal("")),
    guardianRelation: z.string().optional().or(z.literal("")),
    guardianPhone: z
      .string()
      .max(FORM_LIMITS.PHONE_MAX_LENGTH)
      .optional()
      .or(z.literal("")),
    guardianEmail: z
      .string()
      .email()
      .max(FORM_LIMITS.EMAIL_MAX_LENGTH)
      .optional()
      .or(z.literal("")),
  })
  .refine(
    (data) =>
      (data.fatherName && data.fatherName.length >= 2) ||
      (data.motherName && data.motherName.length >= 2),
    {
      message: "Required",
      path: ["fatherName"],
    }
  )

export type GuardianSchemaType = z.infer<typeof guardianSchema>
