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
