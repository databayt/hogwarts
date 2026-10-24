"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import bcrypt from "bcryptjs"
import * as z from "zod"

import { db } from "@/lib/db"
import { sendVerificationEmail } from "@/components/auth/mail"
import { generateVerificationToken } from "@/components/auth/tokens"

import { getUserByEmail } from "../user"
import { RegisterSchema } from "../validation"

export const register = async (
  values: z.infer<typeof RegisterSchema>,
  locale = "en",
  callbackUrl?: string | null
) => {
  const validatedFields = RegisterSchema.safeParse(values)

  if (!validatedFields.success) {
    return { error: "Invalid fields!" }
  }

  const { email, password, username } = validatedFields.data
  const hashedPassword = await bcrypt.hash(password, 10)

  const existingUser = await getUserByEmail(email)

  // A retry of an unfinished sign-up (the code email failed, or the tab was
  // closed before the code) resends the code instead of dead-ending on
  // "already in use". Same password only — never a takeover of the address.
  const isUnfinishedSignup =
    !!existingUser &&
    !existingUser.emailVerified &&
    !!existingUser.password &&
    (await bcrypt.compare(password, existingUser.password))

  if (existingUser && !isUnfinishedSignup) {
    return { error: "Email already in use!" }
  }

  if (!existingUser) {
    await db.user.create({
      data: {
        username,
        email,
        password: hashedPassword,
      },
    })
  }

  const verificationToken = await generateVerificationToken(email)
  const emailSent = await sendVerificationEmail(
    verificationToken.email,
    verificationToken.token,
    locale,
    callbackUrl ?? undefined,
    verificationToken.code ?? undefined
  )

  if (!emailSent) {
    return { error: "Failed to send verification email. Please try again." }
  }

  return { success: "Confirmation email sent!", email }
}
