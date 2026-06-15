// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import crypto from "crypto"
import { v4 as uuidv4 } from "uuid"

import { hashToken } from "@/lib/credentials"
import { db } from "@/lib/db"
import { getPasswordResetTokenByEmail } from "@/components/auth/password/token"
import { getTwoFactorTokenByEmail } from "@/components/auth/verification/2f-token"
import { getVerificationTokenByEmail } from "@/components/auth/verification/verificiation-token"

export const generateTwoFactorToken = async (email: string) => {
  const token = crypto.randomInt(100_000, 1_000_000).toString()
  const expires = new Date(new Date().getTime() + 5 * 60 * 1000)

  const existingToken = await getTwoFactorTokenByEmail(email)

  if (existingToken) {
    await db.twoFactorToken.delete({
      where: {
        id: existingToken.id,
      },
    })
  }

  const twoFactorToken = await db.twoFactorToken.create({
    data: {
      email,
      token,
      expires,
    },
  })

  return twoFactorToken
}

export const generatePasswordResetToken = async (email: string) => {
  // Raw token travels in the email link; only its SHA-256 hash is persisted,
  // so a DB read can't replay a live reset token. Lookup hashes the incoming
  // token the same way (see password/token.ts).
  const rawToken = uuidv4()
  const expires = new Date(new Date().getTime() + 3600 * 1000)

  const existingToken = await getPasswordResetTokenByEmail(email)

  if (existingToken) {
    await db.passwordResetToken.delete({
      where: { id: existingToken.id },
    })
  }

  await db.passwordResetToken.create({
    data: {
      email,
      token: hashToken(rawToken),
      expires,
    },
  })

  return { email, token: rawToken, expires }
}

export const generateVerificationToken = async (email: string) => {
  const token = uuidv4()
  const code = crypto.randomInt(1000, 10000).toString()
  const expires = new Date(new Date().getTime() + 24 * 3600 * 1000)

  const existingToken = await getVerificationTokenByEmail(email)

  if (existingToken) {
    await db.verificationToken.delete({
      where: {
        id: existingToken.id,
      },
    })
  }

  const verificationToken = await db.verificationToken.create({
    data: {
      email,
      token,
      code,
      expires,
    },
  })

  return verificationToken
}
