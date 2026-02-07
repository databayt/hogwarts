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
}

/**
 * Log an audit event. Non-blocking - fire-and-forget with error handling.
 * Auto-captures userId and schoolId from session.
 */
export async function logAudit(params: AuditLogParams): Promise<void> {
  try {
    const [session, tenantContext] = await Promise.all([
      auth(),
      getTenantContext().catch(() => ({ schoolId: null })),
    ])

    if (!session?.user?.id) return

    await db.auditLog.create({
      data: {
        userId: session.user.id,
        schoolId: tenantContext.schoolId || null,
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

/**
 * Check if an email/IP is brute-force blocked.
 * Returns true if blocked (5+ failures in last 15 minutes).
 */
export async function isBruteForceBlocked(
  email: string,
  ip?: string
): Promise<boolean> {
  try {
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000)

    const recentFailures = await db.loginAttempt.count({
      where: {
        email,
        success: false,
        timestamp: { gte: fifteenMinutesAgo },
      },
    })

    return recentFailures >= 5
  } catch {
    return false
  }
}
