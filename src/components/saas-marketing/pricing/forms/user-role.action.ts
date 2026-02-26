"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { revalidatePath } from "next/cache"
import { UserRole } from "@prisma/client"
import { z } from "zod"

import { db } from "@/lib/db"

const userRoleSchema = z.object({ role: z.nativeEnum(UserRole) })
export type FormData = z.infer<typeof userRoleSchema>

export async function updateUserRole(userId: string, data: FormData) {
  const parsed = userRoleSchema.safeParse(data)
  if (!parsed.success) {
    return { status: "error" as const }
  }

  await db.user.update({
    where: { id: userId },
    data: { role: parsed.data.role },
  })
  revalidatePath("/lab/settings")
  return { status: "success" as const }
}
