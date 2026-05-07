// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { z } from "zod"

import type { ValidationHelper } from "@/components/internationalization/helpers"

export const CONTACT_MESSAGE_MIN = 10
export const CONTACT_MESSAGE_MAX = 2000
export const CONTACT_EMAIL_MAX = 254

/**
 * Localized Zod schema for the marketing contact form ("Let's Work Together").
 * Pass a `ValidationHelper` so messages render in the active locale.
 *
 * `website` is a honeypot — it is hidden from real users and must stay empty.
 * Real visitors submit `""`; bots that auto-fill every field get caught.
 */
export function createContactSchema(v: ValidationHelper) {
  return z.object({
    email: z
      .string()
      .trim()
      .min(1, v.required())
      .email(v.email())
      .max(CONTACT_EMAIL_MAX, v.maxLength(CONTACT_EMAIL_MAX)),
    message: z
      .string()
      .trim()
      .min(CONTACT_MESSAGE_MIN, v.minLength(CONTACT_MESSAGE_MIN))
      .max(CONTACT_MESSAGE_MAX, v.maxLength(CONTACT_MESSAGE_MAX)),
    // Honeypot — kept as a non-optional string so react-hook-form's input
    // type and zod's output type match (both `string`). Default form value
    // is `""`, so real users always pass.
    website: z.string().max(0),
  })
}

/**
 * Server-side schema (no localization — server only returns errorCodes).
 */
export const contactServerSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(CONTACT_EMAIL_MAX),
  message: z.string().trim().min(CONTACT_MESSAGE_MIN).max(CONTACT_MESSAGE_MAX),
  website: z.string().max(0).optional().default(""),
  lang: z.enum(["en", "ar"]).default("en"),
})

export type ContactInput = z.infer<typeof contactServerSchema>
