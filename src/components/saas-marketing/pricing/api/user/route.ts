// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { auth } from "@/auth"

import { db } from "@/lib/db"

export const DELETE = auth(async (req) => {
  if (!req.auth) {
    return new Response("Not authenticated", { status: 401 })
  }

  const currentUser = req.auth.user
  if (!currentUser) {
    return new Response("Invalid user", { status: 401 })
  }

  try {
    await db.user.delete({
      where: {
        id: currentUser.id,
      },
    })
  } catch (error) {
    return new Response("Internal server error", { status: 500 })
  }

  return new Response("User deleted successfully!", { status: 200 })
})
