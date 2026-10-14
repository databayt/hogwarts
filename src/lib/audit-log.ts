// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { auth } from "@/auth"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"

interface AuditLogParams {
  action: string
  entityType?: string
  entityId?: string
  previousValue?: unknown
  newValue?: unknown
  metadata?: Record<string, unknown>
  ip?: string
  userAgent?: string
  reason?: string
  // System-actor overrides for cron / worker contexts where auth() is unavailable.
  // Pass `userId: null` (or the literal string "system" which is normalized to null)
  // for cron/worker/webhook events that have no human actor.
  userId?: string | null
  schoolId?: string | null
}

/**
 * Log an audit event. Non-blocking - fire-and-forget with error handling.
 * Auto-captures userId and schoolId from session unless overridden.
 *
 * System contexts (cron, RPA worker, webhook) pass `userId: null` to record
 * the event with no human actor. The schema permits null `userId`.
 */
export async function logAudit(params: AuditLogParams): Promise<void> {
  try {
    let userId: string | null
    let schoolId: string | null | undefined = params.schoolId

    if (params.userId === undefined) {
      const session = await auth()
      if (!session?.user?.id) return
      userId = session.user.id
    } else {
      // Normalize the legacy "system" sentinel that early callers used.
      userId = params.userId === "system" ? null : params.userId
    }
    if (schoolId === undefined) {
      const tenantContext = await getTenantContext().catch(() => ({
        schoolId: null,
      }))
      schoolId = tenantContext.schoolId || null
    }

    await db.auditLog.create({
      data: {
        userId,
        schoolId: schoolId || null,
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId,
        previousValue: params.previousValue
          ? JSON.stringify(params.previousValue)
          : null,
        newValue: params.newValue ? JSON.stringify(params.newValue) : null,
        metadata: params.metadata as any,
        ip: params.ip,
        userAgent: params.userAgent,
        reason: params.reason,
      },
    })
  } catch (error) {
    console.error("[AuditLog] Failed to log audit event:", error)
  }
}

/**
 * Log a login attempt (success or failure).
 */
export async function logLoginAttempt(params: {
  email: string
  success: boolean
  failureReason?: string
  ip?: string
  userAgent?: string
  schoolId?: string | null
}): Promise<void> {
  try {
    await db.loginAttempt.create({
      data: {
        email: params.email,
        success: params.success,
        failureReason: params.failureReason,
        ip: params.ip,
        userAgent: params.userAgent,
        schoolId: params.schoolId || null,
      },
    })
  } catch (error) {
    console.error("[AuditLog] Failed to log login attempt:", error)
  }
}

const LOCKOUT_WINDOW_MS = 15 * 60 * 1000
const MAX_FAILURES_PER_LOGIN = 5
// One address guessing PINs across many codes — far above a family sharing
// a phone, far below a sweep of the easy-PIN space.
const MAX_FAILURES_PER_IP = 30

/**
 * Is this login (or this address) brute-force blocked?
 * 5 failures in 15 minutes per identifier, 30 per IP.
 *
 * Six-digit login codes repeat across schools (260001 exists everywhere), so
 * when a school is known the identifier count is scoped to it — failures at
 * one school never lock out the same code at another.
 */
export async function isBruteForceBlocked(
  email: string,
  opts: { schoolId?: string | null; ip?: string | null } = {}
): Promise<boolean> {
  try {
    const since = new Date(Date.now() - LOCKOUT_WINDOW_MS)
    const [perLogin, perIp] = await Promise.all([
      db.loginAttempt.count({
        where: {
          email,
          success: false,
          timestamp: { gte: since },
          ...(opts.schoolId ? { schoolId: opts.schoolId } : {}),
        },
      }),
      opts.ip && opts.ip !== "unknown"
        ? db.loginAttempt.count({
            where: { ip: opts.ip, success: false, timestamp: { gte: since } },
          })
        : 0,
    ])
    return perLogin >= MAX_FAILURES_PER_LOGIN || perIp >= MAX_FAILURES_PER_IP
  } catch {
    return false
  }
}

/**
 * Lift a lockout — an admin who resets someone's password hands them a
 * working login immediately, not after the 15-minute window.
 */
export async function clearLoginFailures(
  schoolId: string,
  identifiers: Array<string | null | undefined>
): Promise<void> {
  const emails = identifiers.filter((v): v is string => !!v)
  if (emails.length === 0) return
  try {
    await db.loginAttempt.deleteMany({
      where: {
        success: false,
        email: { in: emails },
        OR: [{ schoolId }, { schoolId: null }],
      },
    })
  } catch (error) {
    console.error("[AuditLog] Failed to clear login failures:", error)
  }
}
