"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { db } from "@/lib/db"
import { sendVerificationEmail } from "@/components/auth/mail"
import { generateVerificationToken } from "@/components/auth/tokens"

import { getUserByEmail } from "../user"
import { getVerificationTokenByToken } from "./verificiation-token"

export const newVerification = async (token: string) => {
  console.log("New verification initiated. Token received:", token)

  const existingToken = await getVerificationTokenByToken(token)
  console.log("Token from database:", existingToken)

  if (!existingToken) {
    const existingUser = await getUserByEmail(token)
    if (existingUser && existingUser.emailVerified) {
      return { success: "Email already verified!" }
    } else {
      console.error("Token does not exist in the database.")
      return { error: "Token does not exist!" }
    }
  }

  console.log("Token exists in the database. Token ID:", existingToken.id)
  console.log("Token exists in the database. Token email:", existingToken.email)
  console.log(
    "Token exists in the database. Token expiration:",
    existingToken.expires
  )

  const hasExpired = new Date(existingToken.expires) < new Date()
  console.log("Token expiration status:", hasExpired)

  if (hasExpired) {
    console.error("Token has expired.")
    return { error: "Token has expired!" }
  }

  const existingUser = await getUserByEmail(existingToken.email)
  console.log("User associated with the token:", existingUser)

  if (!existingUser) {
    console.error("Email associated with the token does not exist.")
    return { error: "Email does not exist!" }
  }

  if (existingUser.emailVerified) {
    return { success: "Email verified!" }
  }

  await db.user.update({
    where: { id: existingUser.id },
    data: {
      emailVerified: new Date(),
      email: existingToken.email,
    },
  })
  console.log("User email verified and updated successfully.")

  await db.verificationToken.delete({
    where: { id: existingToken.id },
  })
  console.log("Verification token deleted successfully.")

  return { success: "Email verified!" }
}

const OTP_EXPIRY_MS = 10 * 60 * 1000 // 10 minutes
const MAX_OTP_ATTEMPTS = 5

export async function verifyOTP(
  email: string,
  code: string
): Promise<{ success?: string; error?: string }> {
  if (!email || !code) {
    return { error: "Email and code are required" }
  }

  const token = await db.verificationToken.findFirst({
    where: { email, code },
  })

  if (!token) {
    return { error: "Invalid code" }
  }

  // OTP uses a shorter 10-min expiry window from token creation
  const tokenAge =
    Date.now() - new Date(token.expires).getTime() + 24 * 3600 * 1000
  if (tokenAge > OTP_EXPIRY_MS) {
    return { error: "Code expired. Please request a new one." }
  }

  const user = await getUserByEmail(email)
  if (!user) {
    return { error: "User not found" }
  }

  if (user.emailVerified) {
    await db.verificationToken.delete({ where: { id: token.id } })
    return { success: "Email already verified!" }
  }

  await db.user.update({
    where: { id: user.id },
    data: { emailVerified: new Date(), email },
  })

  await db.verificationToken.delete({ where: { id: token.id } })

  return { success: "Email verified!" }
}

export async function checkVerificationStatus(
  email: string
): Promise<{ verified: boolean }> {
  if (!email) return { verified: false }
  const user = await getUserByEmail(email)
  return { verified: !!user?.emailVerified }
}

export async function resendVerificationCode(
  email: string,
  locale = "en",
  callbackUrl?: string
): Promise<{ success?: string; error?: string }> {
  if (!email) return { error: "Email is required" }

  const user = await getUserByEmail(email)
  if (!user) return { error: "User not found" }
  if (user.emailVerified) return { success: "Email already verified!" }

  const verificationToken = await generateVerificationToken(email)
  const emailSent = await sendVerificationEmail(
    verificationToken.email,
    verificationToken.token,
    locale,
    callbackUrl,
    verificationToken.code ?? undefined
  )

  if (!emailSent) {
    return { error: "Failed to send email. Please try again." }
  }

  return { success: "New code sent!" }
}
