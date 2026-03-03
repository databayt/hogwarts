// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import "server-only"

import { cookies, headers } from "next/headers"
import { auth } from "@/auth"

import { db } from "@/lib/db"

export async function requireOperator() {
  const session = await auth()
  if (!session || session.user.role !== "DEVELOPER")
    throw new Error("Forbidden")
  return { userId: session.user.id } as const
}

/**
 * Like requireOperator but returns the full session.
 * Used by catalog actions that need session.user.id for ownership fields.
 */
export async function requireDeveloper() {
  const session = await auth()
  if (session?.user?.role !== "DEVELOPER") {
    throw new Error("Unauthorized: DEVELOPER role required")
  }
  return session
}

export async function logOperatorAudit(input: {
  userId: string
  schoolId?: string | null
  action: string
  reason?: string | null
}) {
  const hdrs = await headers()
  const ip = hdrs.get("x-forwarded-for") ?? undefined
  const userAgent = hdrs.get("user-agent") ?? undefined
  await db.auditLog.create({
    data: {
      userId: input.userId,
      schoolId: input.schoolId ?? undefined,
      action: input.action,
      reason: input.reason ?? undefined,
      ip,
      userAgent,
    },
  })
}

export async function isImpersonating(): Promise<boolean> {
  const cookieStore = await cookies()
  return !!cookieStore.get("impersonate_schoolId")
}

export async function requireNotImpersonating() {
  if (await isImpersonating()) {
    throw new Error("Action disabled during impersonation")
  }
}
