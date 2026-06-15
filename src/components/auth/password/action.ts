"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import bcrypt from "bcryptjs"

import { db } from "@/lib/db"
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

  const existingUser = await getUserByEmail(existingToken.email)

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
    },
  })

  // Single-use: consume the token immediately after a successful reset.
  await db.passwordResetToken.delete({
    where: { id: existingToken.id },
  })

  return {
    success: a?.passwordUpdated ?? "Password updated! You can now sign in.",
  }
}
