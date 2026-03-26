// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { z } from "zod"

import type { ValidationHelper } from "@/components/internationalization/helpers"

import { FORM_LIMITS } from "../config.client"

export function createContactSchema(v: ValidationHelper) {
  return z.object({
    email: z
      .string()
      .email(v.email())
      .max(
        FORM_LIMITS.EMAIL_MAX_LENGTH,
        v.maxLength(FORM_LIMITS.EMAIL_MAX_LENGTH)
      ),
    phone: z
      .string()
      .min(
        FORM_LIMITS.PHONE_MIN_LENGTH,
        v.minLength(FORM_LIMITS.PHONE_MIN_LENGTH)
      )
      .max(
        FORM_LIMITS.PHONE_MAX_LENGTH,
        v.maxLength(FORM_LIMITS.PHONE_MAX_LENGTH)
      ),
    alternatePhone: z
      .string()
      .max(
        FORM_LIMITS.PHONE_MAX_LENGTH,
        v.maxLength(FORM_LIMITS.PHONE_MAX_LENGTH)
      )
      .optional()
      .or(z.literal("")),
  })
}

// Fallback schema for cases where ValidationHelper is not available
export const contactSchema = z.object({
  email: z.string().email().max(FORM_LIMITS.EMAIL_MAX_LENGTH),
  phone: z
    .string()
    .min(FORM_LIMITS.PHONE_MIN_LENGTH)
    .max(FORM_LIMITS.PHONE_MAX_LENGTH),
  alternatePhone: z
    .string()
    .max(FORM_LIMITS.PHONE_MAX_LENGTH)
    .optional()
    .or(z.literal("")),
})

export type ContactSchemaType = z.infer<typeof contactSchema>
