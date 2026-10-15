"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { headers } from "next/headers"

import { checkUserRateLimit, RATE_LIMITS } from "@/lib/rate-limit"
import { mainOriginForHost, tenantOriginForHost } from "@/lib/root-domain"
import { getSchoolIdFromSubdomain } from "@/lib/tenant-context"
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
  //
  // Emails are unique per school, not globally — on a school's host the
  // account is that school's (see new-password, which resolves the same way),
  // and the link goes back to the same host so it lands in the same school.
  const subdomain = hdrs.get("x-subdomain")
  const schoolId = subdomain ? await getSchoolIdFromSubdomain(subdomain) : null
  const existingUser = await getUserByEmail(email, schoolId)
  if (existingUser) {
    const host = hdrs.get("x-forwarded-host") ?? hdrs.get("host")
    const origin = subdomain
      ? tenantOriginForHost(host, subdomain)
      : mainOriginForHost(host)
    const passwordResetToken = await generatePasswordResetToken(email)
    await sendPasswordResetEmail(
      passwordResetToken.email,
      passwordResetToken.token,
      locale,
      origin
    )
  }

  return {
    success:
      a?.resetLinkSent ??
      "If an account exists for that email, we've sent a password reset link.",
  }
}
