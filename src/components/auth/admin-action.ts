"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { UserRole } from "@prisma/client"

import { currentRole } from "@/components/auth/auth"

export const admin = async () => {
  const role = await currentRole()

  if (role === UserRole.ADMIN) {
    return { success: "Allowed Server Action!" }
  }

  return { error: "Forbidden Server Action!" }
}
