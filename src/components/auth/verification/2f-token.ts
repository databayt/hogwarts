// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { db } from "@/lib/db"

export const getTwoFactorTokenByToken = async (token: string) => {
  try {
    const twoFactorToken = await db.twoFactorToken.findUnique({
      where: { token },
    })

    return twoFactorToken
  } catch {
    return null
  }
}

export const getTwoFactorTokenByEmail = async (email: string) => {
  try {
    const twoFactorToken = await db.twoFactorToken.findFirst({
      where: { email },
    })

    return twoFactorToken
  } catch {
    return null
  }
}
