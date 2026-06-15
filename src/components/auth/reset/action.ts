"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { headers } from "next/headers"

import { checkUserRateLimit, RATE_LIMITS } from "@/lib/rate-limit"
import { sendPasswordResetEmail } from "@/components/auth/mail"
import { generatePasswordResetToken } from "@/components/auth/tokens"
import type { Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"

import { getUserByEmail } from "../user"
import { createResetSchema } from "../validation"

export const reset = async (
  values: { email: string },
  locale: Locale = "en"
) => {
  const dictionary = await getDictionary(locale)
  const a = dictionary.auth

  const validatedFields = createResetSchema(dictionary).safeParse(values)
  if (!validatedFields.success) {
    return { error: a?.invalidEmail ?? "Please enter a valid email address." }
  }

  const email = validatedFields.data.email.trim().toLowerCase()

  // Rate limit by client IP — caps reset-email spam against a single victim and
  // mass-enumeration attempts. Reuses the shared limiter (Redis when
  // configured, in-memory fallback) at the AUTH tier (5/min).
  const hdrs = await headers()
  const ip =
    hdrs.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    hdrs.get("x-real-ip") ||
    "unknown"
  const rl = await checkUserRateLimit(ip, RATE_LIMITS.AUTH, "pwreset")
  if (!rl.allowed) {
    return {
      error:
        a?.tooManyRequests ??
        "Too many requests. Please try again in a minute.",
    }
  }

  // Only send when the account exists — but ALWAYS return the same neutral
  // success message so the response can't be used to enumerate which emails
  // are registered (the previous "Email not found!" leaked exactly that).
  const existingUser = await getUserByEmail(email)
  if (existingUser) {
    const passwordResetToken = await generatePasswordResetToken(email)
    await sendPasswordResetEmail(
      passwordResetToken.email,
      passwordResetToken.token,
      locale
    )
  }

  return {
    success:
      a?.resetLinkSent ??
      "If an account exists for that email, we've sent a password reset link.",
  }
}
