// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Exam Security Utilities
 *
 * Provides security features for exam operations:
 * - Rate limiting for submissions, AI grading, certificate verification
 * - Attempt locking to prevent double-submit
 * - IP tracking for exam attempts
 * - Session validation
 *
 * STORAGE STRATEGY:
 *   1. If UPSTASH_REDIS_REST_URL is configured → uses @upstash/redis (distributed,
 *      shared across Vercel lambda instances). Atomic INCR + TTL.
 *   2. Otherwise → falls back to in-memory Map (per-process). OK for dev/local;
 *      INSUFFICIENT for production multi-instance deploys (each replica has its
 *      own Map ⇒ effectively no protection).
 *
 * The previous implementation was in-memory only; this change makes the safety
 * surface real on serverless.
 */

import { headers } from "next/headers"

import { db } from "@/lib/db"

// --- Distributed rate limiting via Upstash Redis (when configured) ---

let _upstashAvailable: boolean | null = null
let _upstashRedis: import("@upstash/redis").Redis | null = null

function getUpstashRedis(): import("@upstash/redis").Redis | null {
  if (_upstashAvailable === false) return null
  if (_upstashRedis) return _upstashRedis
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) {
    _upstashAvailable = false
    return null
  }
  try {
    const { Redis } =
      require("@upstash/redis") as typeof import("@upstash/redis")
    _upstashRedis = new Redis({ url, token })
    _upstashAvailable = true
    return _upstashRedis
  } catch {
    _upstashAvailable = false
    return null
  }
}

// --- Rate limiting ---

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

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetIn: number
}

// In-memory fallback when Redis unavailable. Per-process; NOT distributed.
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

/**
 * Check rate limit for an operation. Distributed via Redis when available.
 * Async because Redis INCR is atomic over the network.
 */
export async function checkRateLimit(
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const r = getUpstashRedis()

  if (r) {
    try {
      const windowS = Math.ceil(config.windowMs / 1000)
      const redisKey = `exam:rl:${config.key}`
      const count = await r.incr(redisKey)
      if (count === 1) {
        // First hit in this window — set TTL so the counter expires.
        await r.expire(redisKey, windowS)
      }
      const resetIn = config.windowMs
      if (count > config.maxRequests) {
        return { allowed: false, remaining: 0, resetIn }
      }
      return {
        allowed: true,
        remaining: Math.max(0, config.maxRequests - count),
        resetIn,
      }
    } catch {
      // Redis transient error — fall through to in-memory.
    }
  }

  // Fallback: in-memory (per-process). Safe for dev, leaky on serverless.
  const now = Date.now()
  const entry = rateLimitStore.get(config.key)

  if (!entry || now > entry.resetTime) {
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
    return { allowed: false, remaining: 0, resetIn: entry.resetTime - now }
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
 * Default: 5 submissions per minute per (student, exam) pair.
 */
export async function checkExamSubmissionRateLimit(
  studentId: string,
  examId: string
): Promise<RateLimitResult> {
  return checkRateLimit({
    key: `exam-submit:${studentId}:${examId}`,
    maxRequests: 5,
    windowMs: 60 * 1000,
  })
}

/**
 * Rate limit for AI grading requests
 * Default: 100 requests per minute per school.
 */
export async function checkAIGradingRateLimit(
  schoolId: string
): Promise<RateLimitResult> {
  return checkRateLimit({
    key: `ai-grade:${schoolId}`,
    maxRequests: 100,
    windowMs: 60 * 1000,
  })
}

/**
 * Rate limit for AI question generation requests
 * Default: 20 generations per minute per school. Generation calls are large
 * and expensive, so the cap is much tighter than grading.
 */
export async function checkAIGenerationRateLimit(
  schoolId: string
): Promise<RateLimitResult> {
  return checkRateLimit({
    key: `ai-gen:${schoolId}`,
    maxRequests: 20,
    windowMs: 60 * 1000,
  })
}

/**
 * Rate limit for public certificate verification
 * Default: 10 attempts per minute per IP. Designed to slow down brute-force
 * enumeration of verification codes.
 */
export async function checkCertificateVerifyRateLimit(
  clientIP: string
): Promise<RateLimitResult> {
  return checkRateLimit({
    key: `cert-verify:${clientIP}`,
    maxRequests: 10,
    windowMs: 60 * 1000,
  })
}

// --- Exam attempt locks (prevent concurrent double-submit) ---

export interface AttemptLock {
  locked: boolean
  lockedAt?: Date
  lockedBy?: string
  reason?: string
}

const ATTEMPT_LOCK_TTL_SECONDS = 5 * 60 // 5 minutes

function attemptLockKey(studentId: string, examId: string): string {
  return `exam:lock:${studentId}:${examId}`
}

// In-memory fallback
const attemptLocks = new Map<string, AttemptLock>()

/**
 * Acquire a lock on (student, exam) for a brief window. Returns true if
 * acquired, false if already held by another in-flight submission.
 *
 * Uses Redis SET NX EX for atomic acquire when Redis is configured —
 * otherwise per-process Map (NOT safe across serverless instances).
 */
export async function lockExamAttempt(
  studentId: string,
  examId: string,
  reason: string = "submission_in_progress"
): Promise<boolean> {
  const r = getUpstashRedis()
  const key = attemptLockKey(studentId, examId)

  if (r) {
    try {
      // SET NX EX is atomic and the only correct primitive for distributed locks.
      const result = await r.set(
        key,
        JSON.stringify({ studentId, reason, lockedAt: Date.now() }),
        { nx: true, ex: ATTEMPT_LOCK_TTL_SECONDS }
      )
      return result === "OK"
    } catch {
      // fall through to in-memory
    }
  }

  const existing = attemptLocks.get(key)
  if (existing?.locked) {
    const lockAge = existing.lockedAt
      ? Date.now() - existing.lockedAt.getTime()
      : 0
    if (lockAge < ATTEMPT_LOCK_TTL_SECONDS * 1000) return false
    // stale → fall through and re-acquire
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
 * Release an attempt lock.
 */
export async function unlockExamAttempt(
  studentId: string,
  examId: string
): Promise<void> {
  const r = getUpstashRedis()
  const key = attemptLockKey(studentId, examId)

  if (r) {
    try {
      await r.del(key)
      return
    } catch {
      // fall through
    }
  }

  attemptLocks.delete(key)
}

/**
 * Inspect the current lock state for (student, exam).
 */
export async function isAttemptLocked(
  studentId: string,
  examId: string
): Promise<AttemptLock> {
  const r = getUpstashRedis()
  const key = attemptLockKey(studentId, examId)

  if (r) {
    try {
      const raw = await r.get<string>(key)
      if (!raw) return { locked: false }
      try {
        const parsed = JSON.parse(raw) as {
          studentId?: string
          reason?: string
          lockedAt?: number
        }
        return {
          locked: true,
          lockedAt: parsed.lockedAt ? new Date(parsed.lockedAt) : undefined,
          lockedBy: parsed.studentId,
          reason: parsed.reason,
        }
      } catch {
        return { locked: true }
      }
    } catch {
      // fall through
    }
  }

  const lock = attemptLocks.get(key)
  if (!lock) return { locked: false }

  const lockAge = lock.lockedAt ? Date.now() - lock.lockedAt.getTime() : 0
  if (lockAge > ATTEMPT_LOCK_TTL_SECONDS * 1000) {
    attemptLocks.delete(key)
    return { locked: false }
  }
  return lock
}

// --- Request metadata helpers ---

/**
 * Get client IP address from request headers
 */
export async function getClientIP(): Promise<string> {
  const headersList = await headers()

  const forwardedFor = headersList.get("x-forwarded-for")
  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim()
  }

  const realIP = headersList.get("x-real-ip")
  if (realIP) return realIP

  const cfIP = headersList.get("cf-connecting-ip")
  if (cfIP) return cfIP

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

// --- Session validation ---

/**
 * Validate exam session. Verifies the exam is currently open AND the student
 * hasn't already submitted AND no one is mid-submission for them.
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

  const exam = await db.schoolExam.findFirst({
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

  // Time-window enforcement
  const now = new Date()
  const examDateTime = new Date(exam.examDate)

  if (exam.startTime) {
    const [startHour, startMin] = exam.startTime.split(":").map(Number)
    const examStart = new Date(examDateTime)
    examStart.setHours(startHour, startMin, 0, 0)
    if (now < examStart) {
      return { valid: false, reason: "Exam has not started yet" }
    }
  }

  if (exam.endTime) {
    const [endHour, endMin] = exam.endTime.split(":").map(Number)
    const examEnd = new Date(examDateTime)
    examEnd.setHours(endHour, endMin, 0, 0)
    if (now > examEnd) {
      return { valid: false, reason: "Exam time has ended" }
    }
  }

  // Check if attempt is locked (a concurrent submission in progress).
  const lock = await isAttemptLocked(studentId, examId)
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

// --- Certificate verification helpers ---

/**
 * Generate a verification code for a new certificate.
 */
export function generateVerificationCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
  let code = ""
  for (let i = 0; i < 12; i++) {
    if (i > 0 && i % 4 === 0) code += "-"
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

/**
 * Public certificate verification with brute-force protection AND status checks.
 *
 * Reject when:
 *   - rate limit exceeded for the caller's IP
 *   - code does not match any certificate
 *   - certificate.status !== "active" (revoked / suspended)
 *   - certificate.expiresAt is in the past
 *
 * Returns a sanitized payload — never include schoolId, certificateNumber, or
 * other internal identifiers in the response.
 */
export async function verifyCertificateCode(
  code: string,
  clientIP: string
): Promise<{
  valid: boolean
  certificate?: unknown
  error?: string
}> {
  const rl = await checkCertificateVerifyRateLimit(clientIP)
  if (!rl.allowed) {
    return {
      valid: false,
      error: "Too many verification attempts. Please try again later.",
    }
  }

  const certificate = await db.examCertificate.findFirst({
    where: {
      verificationCode: code.toUpperCase().replace(/-/g, ""),
    },
    include: {
      student: {
        select: {
          firstName: true,
          lastName: true,
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
        select: { name: true },
      },
    },
  })

  if (!certificate) {
    return { valid: false, error: "Invalid certificate code" }
  }

  if (certificate.status !== "active") {
    return { valid: false, error: "This certificate has been revoked" }
  }

  if (certificate.expiresAt && new Date() > certificate.expiresAt) {
    return { valid: false, error: "This certificate has expired" }
  }

  return {
    valid: true,
    certificate: {
      studentName: `${certificate.student.firstName} ${certificate.student.lastName}`,
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
