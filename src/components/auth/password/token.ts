// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { db } from "@/lib/db"

export const getPasswordResetTokenByToken = async (token: string) => {
  try {
    const passwordResetToken = await db.passwordResetToken.findUnique({
      where: { token },
    })

    return passwordResetToken
  } catch {
    return null
  }
}

export const getPasswordResetTokenByEmail = async (email: string) => {
  try {
    const passwordResetToken = await db.passwordResetToken.findFirst({
      where: { email },
    })

    return passwordResetToken
  } catch {
    return null
  }
}
