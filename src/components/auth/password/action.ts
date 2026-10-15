"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { headers } from "next/headers"
import bcrypt from "bcryptjs"

import { clearLoginFailures } from "@/lib/audit-log"
import { db } from "@/lib/db"
import { getSchoolIdFromSubdomain } from "@/lib/tenant-context"
import type { Locale } from "@/components/internationalization/config"
import { getDictionary } from "@/components/internationalization/dictionaries"

import { getUserByEmail } from "../user"
import { createNewPasswordSchema } from "../validation"
import { getPasswordResetTokenByToken } from "./token"

export const newPassword = async (
  values: { password: string },
  token?: string | null,
  locale: Locale = "en"
) => {
  const dictionary = await getDictionary(locale)
  const a = dictionary.auth

  if (!token) {
    return { error: a?.missingToken ?? "Missing reset token." }
  }

  const validatedFields = createNewPasswordSchema(dictionary).safeParse(values)

  if (!validatedFields.success) {
    return {
      error: a?.invalidPassword ?? "Password must be at least 6 characters.",
    }
  }

  const { password } = validatedFields.data

  const existingToken = await getPasswordResetTokenByToken(token)

  if (!existingToken) {
    return { error: a?.invalidToken ?? "This reset link is invalid." }
  }

  const hasExpired = new Date(existingToken.expires) < new Date()

  if (hasExpired) {
    // Burn the expired token so it can't linger.
    await db.passwordResetToken.delete({ where: { id: existingToken.id } })
    return {
      error:
        a?.tokenExpired ??
        "This reset link has expired. Please request a new one.",
    }
  }

  // Same school as the request that sent the link (reset/action.ts) — the
  // link returns to that school's host, so x-subdomain names the account.
  const subdomain = (await headers()).get("x-subdomain")
  const schoolId = subdomain ? await getSchoolIdFromSubdomain(subdomain) : null
  const existingUser = await getUserByEmail(existingToken.email, schoolId)

  if (!existingUser) {
    return { error: a?.invalidToken ?? "This reset link is invalid." }
  }

  const hashedPassword = await bcrypt.hash(password, 10)

  await db.user.update({
    where: { id: existingUser.id },
    data: {
      password: hashedPassword,
      passwordChangedAt: new Date(),
      mustChangePassword: false,
      // Whoever held the old password is signed out on web + mobile.
      tokenVersion: { increment: 1 },
    },
  })
  if (existingUser.schoolId) {
    await clearLoginFailures(existingUser.schoolId, [
      existingUser.email,
      existingUser.username,
    ])
  }

  // Single-use: consume the token immediately after a successful reset.
  await db.passwordResetToken.delete({
    where: { id: existingToken.id },
  })

  return {
    success: a?.passwordUpdated ?? "Password updated! You can now sign in.",
  }
}
