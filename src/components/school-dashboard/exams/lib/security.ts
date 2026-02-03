/**
 * Exam Security Utilities
 *
 * Provides security features for exam operations:
 * - Rate limiting for submissions
 * - Attempt locking to prevent double-submit
 * - IP tracking for exam attempts
 * - Session validation
 */

import { headers } from "next/headers"

import { db } from "@/lib/db"

/**
 * Rate limit configuration
 */
export interface RateLimitConfig {
  /** Maximum number of requests */
  maxRequests: number
  /** Time window in milliseconds */
  windowMs: number
  /** Unique identifier for the rate limit */
  key: string
}

/**
 * In-memory rate limit store (use Redis in production for multi-instance)
 */
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

/**
 * Check rate limit for an operation
 * Returns true if within limits, false if exceeded
 */
export function checkRateLimit(config: RateLimitConfig): {
  allowed: boolean
  remaining: number
  resetIn: number
} {
  const now = Date.now()
  const entry = rateLimitStore.get(config.key)

  if (!entry || now > entry.resetTime) {
    // Reset or create new entry
    rateLimitStore.set(config.key, {
      count: 1,
      resetTime: now + config.windowMs,
    })
    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetIn: config.windowMs,
    }
  }

  if (entry.count >= config.maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetIn: entry.resetTime - now,
    }
  }

  entry.count++
  return {
    allowed: true,
    remaining: config.maxRequests - entry.count,
    resetIn: entry.resetTime - now,
  }
}

/**
 * Rate limit for exam submissions
 * Default: 5 submissions per minute per student
 */
export function checkExamSubmissionRateLimit(
  studentId: string,
  examId: string
): { allowed: boolean; remaining: number; resetIn: number } {
  return checkRateLimit({
    key: `exam-submit:${studentId}:${examId}`,
    maxRequests: 5,
    windowMs: 60 * 1000, // 1 minute
  })
}

/**
 * Rate limit for AI grading requests
 * Default: 100 requests per minute per school
 */
export function checkAIGradingRateLimit(schoolId: string): {
  allowed: boolean
  remaining: number
  resetIn: number
} {
  return checkRateLimit({
    key: `ai-grade:${schoolId}`,
    maxRequests: 100,
    windowMs: 60 * 1000, // 1 minute
  })
}

/**
 * Exam attempt lock status
 */
export interface AttemptLock {
  locked: boolean
  lockedAt?: Date
  lockedBy?: string
  reason?: string
}

/**
 * In-memory attempt locks (use Redis in production)
 */
const attemptLocks = new Map<string, AttemptLock>()

/**
 * Lock an exam attempt to prevent double-submit
 */
export function lockExamAttempt(
  studentId: string,
  examId: string,
  reason: string = "submission_in_progress"
): boolean {
  const key = `attempt:${studentId}:${examId}`
  const existing = attemptLocks.get(key)

  if (existing?.locked) {
    // Check if lock is stale (older than 5 minutes)
    const lockAge = existing.lockedAt
      ? Date.now() - existing.lockedAt.getTime()
      : 0
    if (lockAge < 5 * 60 * 1000) {
      return false // Lock is still valid
    }
    // Lock is stale, allow override
  }

  attemptLocks.set(key, {
    locked: true,
    lockedAt: new Date(),
    lockedBy: studentId,
    reason,
  })

  return true
}

/**
 * Unlock an exam attempt
 */
export function unlockExamAttempt(studentId: string, examId: string): void {
  const key = `attempt:${studentId}:${examId}`
  attemptLocks.delete(key)
}

/**
 * Check if an exam attempt is locked
 */
export function isAttemptLocked(
  studentId: string,
  examId: string
): AttemptLock {
  const key = `attempt:${studentId}:${examId}`
  const lock = attemptLocks.get(key)

  if (!lock) {
    return { locked: false }
  }

  // Check if lock is stale
  const lockAge = lock.lockedAt ? Date.now() - lock.lockedAt.getTime() : 0
  if (lockAge > 5 * 60 * 1000) {
    attemptLocks.delete(key)
    return { locked: false }
  }

  return lock
}

/**
 * Get client IP address from request headers
 */
export async function getClientIP(): Promise<string> {
  const headersList = await headers()

  // Check various headers for IP (in order of preference)
  const forwardedFor = headersList.get("x-forwarded-for")
  if (forwardedFor) {
    // x-forwarded-for can contain multiple IPs, get the first one
    return forwardedFor.split(",")[0].trim()
  }

  const realIP = headersList.get("x-real-ip")
  if (realIP) {
    return realIP
  }

  // Fallback
  return "unknown"
}

/**
 * Get client user agent from request headers
 */
export async function getClientUserAgent(): Promise<string> {
  const headersList = await headers()
  return headersList.get("user-agent") || "unknown"
}

/**
 * Get request metadata for logging
 */
export async function getRequestMetadata(): Promise<{
  ipAddress: string
  userAgent: string
  requestId: string
}> {
  const headersList = await headers()

  return {
    ipAddress: await getClientIP(),
    userAgent: await getClientUserAgent(),
    requestId: headersList.get("x-request-id") || crypto.randomUUID(),
  }
}

/**
 * Validate exam session
 * Checks if a student is allowed to take/continue an exam
 */
export async function validateExamSession(params: {
  studentId: string
  examId: string
  schoolId: string
}): Promise<{
  valid: boolean
  reason?: string
  attemptId?: string
}> {
  const { studentId, examId, schoolId } = params

  // Check if exam exists and is active
  const exam = await db.exam.findFirst({
    where: {
      id: examId,
      schoolId,
      status: "IN_PROGRESS",
    },
    select: {
      id: true,
      examDate: true,
      startTime: true,
      endTime: true,
      duration: true,
    },
  })

  if (!exam) {
    return {
      valid: false,
      reason: "Exam not found or not currently active",
    }
  }

  // Check if student has an existing session (ExamSession is the correct model)
  const existingSession = await db.examSession.findFirst({
    where: {
      examId,
      studentId,
      schoolId,
    },
    orderBy: { createdAt: "desc" },
  })

  if (existingSession?.status === "SUBMITTED") {
    return {
      valid: false,
      reason: "You have already completed this exam",
    }
  }

  // Check time limits
  const now = new Date()
  const examDateTime = new Date(exam.examDate)

  // Parse start and end times
  if (exam.startTime) {
    const [startHour, startMin] = exam.startTime.split(":").map(Number)
    const examStart = new Date(examDateTime)
    examStart.setHours(startHour, startMin, 0, 0)

    if (now < examStart) {
      return {
        valid: false,
        reason: "Exam has not started yet",
      }
    }
  }

  if (exam.endTime) {
    const [endHour, endMin] = exam.endTime.split(":").map(Number)
    const examEnd = new Date(examDateTime)
    examEnd.setHours(endHour, endMin, 0, 0)

    if (now > examEnd) {
      return {
        valid: false,
        reason: "Exam time has ended",
      }
    }
  }

  // Check if attempt is locked
  const lock = isAttemptLocked(studentId, examId)
  if (lock.locked) {
    return {
      valid: false,
      reason: "Your submission is being processed. Please wait.",
    }
  }

  return {
    valid: true,
    attemptId: existingSession?.id,
  }
}

/**
 * Certificate verification code generator
 */
export function generateVerificationCode(): string {
  // Generate a 12-character alphanumeric code
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
  let code = ""
  for (let i = 0; i < 12; i++) {
    if (i > 0 && i % 4 === 0) {
      code += "-"
    }
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

/**
 * Verify a certificate code
 * Includes brute-force protection
 */
const verificationAttempts = new Map<
  string,
  { count: number; resetTime: number }
>()

export async function verifyCertificateCode(
  code: string,
  clientIP: string
): Promise<{
  valid: boolean
  certificate?: unknown
  error?: string
}> {
  // Rate limit verification attempts by IP
  const key = `cert-verify:${clientIP}`
  const attempts = verificationAttempts.get(key)
  const now = Date.now()

  if (attempts) {
    if (now < attempts.resetTime && attempts.count >= 10) {
      return {
        valid: false,
        error: "Too many verification attempts. Please try again later.",
      }
    }
    if (now > attempts.resetTime) {
      verificationAttempts.set(key, { count: 1, resetTime: now + 60 * 1000 })
    } else {
      attempts.count++
    }
  } else {
    verificationAttempts.set(key, { count: 1, resetTime: now + 60 * 1000 })
  }

  // Look up certificate - uses examResult relation instead of direct exam relation
  const certificate = await db.examCertificate.findFirst({
    where: {
      verificationCode: code.toUpperCase().replace(/-/g, ""),
    },
    include: {
      student: {
        select: {
          givenName: true,
          surname: true,
          studentId: true,
        },
      },
      examResult: {
        include: {
          exam: {
            select: {
              title: true,
              examDate: true,
            },
          },
        },
      },
      school: {
        select: {
          name: true,
        },
      },
    },
  })

  if (!certificate) {
    return {
      valid: false,
      error: "Invalid certificate code",
    }
  }

  // Check if certificate is expired
  if (certificate.expiresAt && new Date() > certificate.expiresAt) {
    return {
      valid: false,
      error: "This certificate has expired",
    }
  }

  return {
    valid: true,
    certificate: {
      studentName: `${certificate.student.givenName} ${certificate.student.surname}`,
      studentId: certificate.student.studentId,
      examTitle: certificate.examResult.exam.title,
      examDate: certificate.examResult.exam.examDate,
      schoolName: certificate.school.name,
      grade: certificate.grade,
      issuedAt: certificate.issuedAt,
      expiresAt: certificate.expiresAt,
    },
  }
}
