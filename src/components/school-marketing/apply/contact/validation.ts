// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { z } from "zod"

import { FORM_LIMITS } from "../config.client"

export const contactSchema = z.object({
  email: z
    .string()
    .email("Invalid email address")
    .max(FORM_LIMITS.EMAIL_MAX_LENGTH, "Email is too long"),
  phone: z
    .string()
    .min(FORM_LIMITS.PHONE_MIN_LENGTH, "Phone number is too short")
    .max(FORM_LIMITS.PHONE_MAX_LENGTH, "Phone number is too long"),
  alternatePhone: z
    .string()
    .max(FORM_LIMITS.PHONE_MAX_LENGTH, "Phone number is too long")
    .optional()
    .or(z.literal("")),
})

export type ContactSchemaType = z.infer<typeof contactSchema>
