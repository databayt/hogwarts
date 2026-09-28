"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { z } from "zod"

import { db } from "@/lib/db"
import { refreshPage } from "@/lib/refresh-page"

const userNameSchema = z.object({ name: z.string().min(1).max(32) })
export type FormData = z.infer<typeof userNameSchema>

export async function updateUserName(userId: string, data: FormData) {
  const parsed = userNameSchema.safeParse(data)
  if (!parsed.success) {
    return { status: "error" as const }
  }
  await db.user.update({
    where: { id: userId },
    data: { username: parsed.data.name },
  })
  refreshPage("/lab/settings")
  return { status: "success" as const }
}
