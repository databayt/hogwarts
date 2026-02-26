// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { auth } from "@/auth"

export const currentUser = async () => {
  const session = await auth()

  return session?.user
}

export const currentRole = async () => {
  const session = await auth()

  return session?.user?.role
}
