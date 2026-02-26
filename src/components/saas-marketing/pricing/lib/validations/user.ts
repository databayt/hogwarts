// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { UserRole } from "@prisma/client"
import * as z from "zod"

export const userNameSchema = z.object({
  name: z.string().min(3).max(32),
})

export const userRoleSchema = z.object({
  role: z.nativeEnum(UserRole),
})
