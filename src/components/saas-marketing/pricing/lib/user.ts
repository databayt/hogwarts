// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { db } from "@/lib/db"

export const getUserByEmail = async (email: string) => {
  try {
    const user = await db.user.findFirst({
      where: {
        email: email,
      },
      select: {
        username: true,
        emailVerified: true,
      },
    })

    return user
  } catch {
    return null
  }
}

export const getUserById = async (id: string) => {
  try {
    const user = await db.user.findUnique({ where: { id } })

    return user
  } catch {
    return null
  }
}
