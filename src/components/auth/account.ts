// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { db } from "@/lib/db"

export const getAccountByUserId = async (userId: string) => {
  try {
    const account = await db.account.findFirst({
      where: { userId },
    })

    return account
  } catch {
    return null
  }
}
