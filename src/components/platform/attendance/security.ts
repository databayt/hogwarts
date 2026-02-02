/**
 * Attendance Security Utilities
 * Rate limiting, audit logging, and scan protection
 */

import crypto from "crypto"

import { db } from "@/lib/db"

// ============================================================================
// RATE LIMITING FOR SCAN FAILURES
// ============================================================================

interface RateLimitEntry {
  failureCount: number
  firstFailureAt: Date
  blockedUntil: Date | null
}

// In-memory rate limit store (per device/IP)
// In production, consider using Redis for distributed rate limiting
const rateLimitStore = new Map<string, RateLimitEntry>()

const RATE_LIMIT_CONFIG = {
  maxFailures: 5, // Maximum consecutive failures before blocking
  blockDurationMinutes: 5, // How long to block after max failures
  windowMinutes: 10, // Time window for counting failures
}

/**
 * Check if a device/IP is rate limited
 * @param identifier Device ID or IP address
 * @returns Object with isBlocked and remainingTime
 */
export function checkRateLimit(identifier: string): {
  isBlocked: boolean
  remainingSeconds: number
  failureCount: number
} {
  const entry = rateLimitStore.get(identifier)

  if (!entry) {
    return { isBlocked: false, remainingSeconds: 0, failureCount: 0 }
  }

  // Check if currently blocked
  if (entry.blockedUntil && entry.blockedUntil > new Date()) {
    const remainingSeconds = Math.ceil(
      (entry.blockedUntil.getTime() - Date.now()) / 1000
    )
    return {
      isBlocked: true,
      remainingSeconds,
      failureCount: entry.failureCount,
    }
  }

  // Clear block if it has expired
  if (entry.blockedUntil && entry.blockedUntil <= new Date()) {
    rateLimitStore.delete(identifier)
    return { isBlocked: false, remainingSeconds: 0, failureCount: 0 }
  }

  // Check if window has expired
  const windowExpiry = new Date(
    entry.firstFailureAt.getTime() + RATE_LIMIT_CONFIG.windowMinutes * 60 * 1000
  )
  if (windowExpiry <= new Date()) {
    rateLimitStore.delete(identifier)
    return { isBlocked: false, remainingSeconds: 0, failureCount: 0 }
  }

  return {
    isBlocked: false,
    remainingSeconds: 0,
    failureCount: entry.failureCount,
  }
}

/**
 * Record a failed scan attempt
 * @param identifier Device ID or IP address
 * @returns Object indicating if blocked and remaining attempts
 */
export function recordScanFailure(identifier: string): {
  isBlocked: boolean
  remainingAttempts: number
  blockedUntil: Date | null
} {
  const entry = rateLimitStore.get(identifier)
  const now = new Date()

  if (!entry) {
    // First failure
    rateLimitStore.set(identifier, {
      failureCount: 1,
      firstFailureAt: now,
      blockedUntil: null,
    })
    return {
      isBlocked: false,
      remainingAttempts: RATE_LIMIT_CONFIG.maxFailures - 1,
      blockedUntil: null,
    }
  }

  // Check if window has expired - reset counter
  const windowExpiry = new Date(
    entry.firstFailureAt.getTime() + RATE_LIMIT_CONFIG.windowMinutes * 60 * 1000
  )
  if (windowExpiry <= now) {
    rateLimitStore.set(identifier, {
      failureCount: 1,
      firstFailureAt: now,
      blockedUntil: null,
    })
    return {
      isBlocked: false,
      remainingAttempts: RATE_LIMIT_CONFIG.maxFailures - 1,
      blockedUntil: null,
    }
  }

  // Increment failure count
  const newFailureCount = entry.failureCount + 1

  if (newFailureCount >= RATE_LIMIT_CONFIG.maxFailures) {
    // Block the device
    const blockedUntil = new Date(
      now.getTime() + RATE_LIMIT_CONFIG.blockDurationMinutes * 60 * 1000
    )
    rateLimitStore.set(identifier, {
      failureCount: newFailureCount,
      firstFailureAt: entry.firstFailureAt,
      blockedUntil,
    })
    return { isBlocked: true, remainingAttempts: 0, blockedUntil }
  }

  // Update failure count
  rateLimitStore.set(identifier, {
    ...entry,
    failureCount: newFailureCount,
  })

  return {
    isBlocked: false,
    remainingAttempts: RATE_LIMIT_CONFIG.maxFailures - newFailureCount,
    blockedUntil: null,
  }
}

/**
 * Clear rate limit for a device (on successful scan)
 * @param identifier Device ID or IP address
 */
export function clearRateLimit(identifier: string): void {
  rateLimitStore.delete(identifier)
}

// ============================================================================
// AUDIT LOGGING
// ============================================================================

export type AuditAction =
  | "ATTENDANCE_CREATED"
  | "ATTENDANCE_UPDATED"
  | "ATTENDANCE_DELETED"
  | "EXCUSE_SUBMITTED"
  | "EXCUSE_APPROVED"
  | "EXCUSE_REJECTED"
  | "INTERVENTION_CREATED"
  | "INTERVENTION_UPDATED"
  | "INTERVENTION_ESCALATED"
  | "QR_SESSION_CREATED"
  | "QR_SESSION_INVALIDATED"
  | "BARCODE_ASSIGNED"
  | "BARCODE_REVOKED"
  | "GEOFENCE_CREATED"
  | "GEOFENCE_UPDATED"
  | "BULK_UPLOAD"

interface AuditLogEntry {
  schoolId: string
  userId: string
  action: AuditAction
  entityType:
    | "Attendance"
    | "Excuse"
    | "Intervention"
    | "QRSession"
    | "Barcode"
    | "Geofence"
  entityId: string
  oldValue?: Record<string, unknown>
  newValue?: Record<string, unknown>
  metadata?: Record<string, unknown>
  ipAddress?: string
  userAgent?: string
}

/**
 * Create an audit log entry
 * Logs to the AttendanceEvent table using the MANUAL_OVERRIDE event type
 * which is designed for administrative actions and auditing
 */
export async function createAuditLog(entry: AuditLogEntry): Promise<void> {
  try {
    // Build metadata object with only defined values
    const metadata: Record<string, unknown> = {
      auditAction: entry.action,
      entityType: entry.entityType,
      entityId: entry.entityId,
    }

    if (entry.oldValue) metadata.oldValue = entry.oldValue
    if (entry.newValue) metadata.newValue = entry.newValue
    if (entry.metadata) Object.assign(metadata, entry.metadata)

    await db.attendanceEvent.create({
      data: {
        schoolId: entry.schoolId,
        studentId: entry.userId, // Reusing studentId field for userId in audits
        eventType: "MANUAL_OVERRIDE", // Use valid enum value for audit entries
        method: "MANUAL", // Use valid enum value
        success: true,
        metadata: metadata as object, // Cast to satisfy Prisma's Json type
        ipAddress: entry.ipAddress,
        userAgent: entry.userAgent,
        timestamp: new Date(),
      },
    })
  } catch (error) {
    // Log error but don't fail the main operation
    console.error("Failed to create audit log:", error)
  }
}

/**
 * Get audit logs for an entity
 */
export async function getAuditLogs(
  schoolId: string,
  entityType: string,
  entityId: string
) {
  return db.attendanceEvent.findMany({
    where: {
      schoolId,
      eventType: "MANUAL_OVERRIDE", // Filter to audit entries
      metadata: {
        path: ["entityType"],
        equals: entityType,
      },
    },
    orderBy: {
      timestamp: "desc",
    },
    take: 100,
  })
}

// ============================================================================
// QR CODE SECURITY (HMAC SIGNATURES)
// ============================================================================

const QR_SECRET = process.env.QR_CODE_SECRET || "attendance-qr-secret-key"

/**
 * Generate HMAC signature for QR code data
 * @param data Data to sign
 * @returns HMAC signature
 */
export function generateQRSignature(data: {
  sessionId: string
  schoolId: string
  classId: string
  expiresAt: number
}): string {
  const payload = JSON.stringify({
    sessionId: data.sessionId,
    schoolId: data.schoolId,
    classId: data.classId,
    expiresAt: data.expiresAt,
  })

  return crypto.createHmac("sha256", QR_SECRET).update(payload).digest("hex")
}

/**
 * Verify QR code signature
 * @param data QR code data
 * @param signature Signature to verify
 * @returns True if signature is valid
 */
export function verifyQRSignature(
  data: {
    sessionId: string
    schoolId: string
    classId: string
    expiresAt: number
  },
  signature: string
): boolean {
  const expectedSignature = generateQRSignature(data)
  return crypto.timingSafeEqual(
    Buffer.from(signature, "hex"),
    Buffer.from(expectedSignature, "hex")
  )
}

/**
 * Generate secure QR code payload
 * @param sessionId QR session ID
 * @param schoolId School ID
 * @param classId Class ID
 * @param expiresAt Expiration timestamp (ms)
 * @returns Signed QR code payload
 */
export function generateSecureQRPayload(
  sessionId: string,
  schoolId: string,
  classId: string,
  expiresAt: number
): string {
  const data = { sessionId, schoolId, classId, expiresAt }
  const signature = generateQRSignature(data)

  return JSON.stringify({
    ...data,
    sig: signature,
  })
}

/**
 * Parse and verify secure QR code payload
 * @param payload QR code payload string
 * @returns Parsed and verified data, or null if invalid
 */
export function parseSecureQRPayload(payload: string): {
  sessionId: string
  schoolId: string
  classId: string
  expiresAt: number
} | null {
  try {
    const parsed = JSON.parse(payload)
    const { sessionId, schoolId, classId, expiresAt, sig } = parsed

    if (!sessionId || !schoolId || !classId || !expiresAt || !sig) {
      return null
    }

    const isValid = verifyQRSignature(
      { sessionId, schoolId, classId, expiresAt },
      sig
    )

    if (!isValid) {
      return null
    }

    // Check expiration
    if (Date.now() > expiresAt) {
      return null
    }

    return { sessionId, schoolId, classId, expiresAt }
  } catch {
    return null
  }
}

// ============================================================================
// SCAN PROTECTION MIDDLEWARE
// ============================================================================

/**
 * Wrapper for protected scan operations with rate limiting
 * @param identifier Device ID or IP
 * @param operation The scan operation to perform
 * @returns Operation result or rate limit error
 */
export async function withScanProtection<T>(
  identifier: string,
  operation: () => Promise<{ success: boolean; error?: string } & T>
): Promise<
  { success: boolean; error?: string; rateLimited?: boolean } & Partial<T>
> {
  // Check if rate limited
  const rateLimitStatus = checkRateLimit(identifier)

  if (rateLimitStatus.isBlocked) {
    return {
      success: false,
      error: `Too many failed attempts. Please wait ${Math.ceil(rateLimitStatus.remainingSeconds / 60)} minutes.`,
      rateLimited: true,
    } as {
      success: boolean
      error?: string
      rateLimited?: boolean
    } & Partial<T>
  }

  // Perform the operation
  const result = await operation()

  if (result.success) {
    // Clear rate limit on success
    clearRateLimit(identifier)
  } else {
    // Record failure
    const failureResult = recordScanFailure(identifier)
    if (failureResult.isBlocked) {
      return {
        ...result,
        error: `Too many failed attempts. Device blocked for ${RATE_LIMIT_CONFIG.blockDurationMinutes} minutes.`,
        rateLimited: true,
      }
    }
  }

  return result
}
