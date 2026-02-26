// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import "server-only"

import { cache } from "react"
import { auth } from "@/auth"

export const getCurrentUser = cache(async () => {
  const session = await auth()
  if (!session?.user) {
    return undefined
  }
  return session.user
})
