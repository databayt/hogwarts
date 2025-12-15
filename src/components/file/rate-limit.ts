/**
 * Rate Limiting Utility
 * Prevents abuse by limiting upload operations using Upstash Redis
 */

import { Ratelimit } from "@upstash/ratelimit"
import { Redis } from "@upstash/redis"

// Initialize Redis client
let redis: Redis | null = null

function getRedisClient(): Redis {
  if (!redis) {
    const url = process.env.UPSTASH_REDIS_REST_URL
    const token = process.env.UPSTASH_REDIS_REST_TOKEN

    if (!url || !token) {
      throw new Error(
        "UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN must be set"
      )
    }

    redis = new Redis({
      url,
      token,
    })
  }

  return redis
}

// Rate limit configurations
export const RATE_LIMITS = {
  // Per-school limits
  SCHOOL_UPLOADS_PER_HOUR: 100, // 100 uploads per hour per school
  SCHOOL_UPLOADS_PER_DAY: 1000, // 1000 uploads per day per school
  SCHOOL_BYTES_PER_HOUR: 1024 * 1024 * 1024, // 1GB per hour
  SCHOOL_BYTES_PER_DAY: 10 * 1024 * 1024 * 1024, // 10GB per day

  // Per-user limits
  USER_UPLOADS_PER_HOUR: 20, // 20 uploads per hour per user
  USER_UPLOADS_PER_DAY: 100, // 100 uploads per day per user
  USER_BYTES_PER_HOUR: 100 * 1024 * 1024, // 100MB per hour
  USER_BYTES_PER_DAY: 1024 * 1024 * 1024, // 1GB per day

  // API endpoint limits
  UPLOAD_ENDPOINT_PER_MINUTE: 10, // 10 requests per minute per IP
  LIST_ENDPOINT_PER_MINUTE: 30, // 30 requests per minute per IP
} as const

/**
 * Create rate limiter for file uploads (count-based)
 * Uses sliding window algorithm
 */
export function createUploadRateLimiter(
  maxRequests: number,
  windowSeconds: number
) {
  return new Ratelimit({
    redis: getRedisClient(),
    limiter: Ratelimit.slidingWindow(maxRequests, `${windowSeconds} s`),
    analytics: true,
    prefix: "upload_ratelimit",
  })
}

/**
 * Create rate limiter for bandwidth (bytes-based)
 * Uses token bucket algorithm for smooth rate limiting
 */
export function createBandwidthRateLimiter(
  maxBytes: number,
  windowSeconds: number
) {
  return new Ratelimit({
    redis: getRedisClient(),
    limiter: Ratelimit.tokenBucket(
      maxBytes,
      `${windowSeconds} s`,
      Math.floor(maxBytes / windowSeconds) // refill rate per second
    ),
    analytics: true,
    prefix: "bandwidth_ratelimit",
  })
}

export interface RateLimitResult {
  allowed: boolean
  limit: number
  remaining: number
  reset: number // Timestamp when limit resets
  retryAfter?: number // Seconds to wait before retrying
}

/**
 * Check if upload is allowed for a school
 * Checks both count and bandwidth limits
 */
export async function checkSchoolUploadLimit(
  schoolId: string,
  fileSize: number
): Promise<RateLimitResult> {
  // Check hourly upload count
  const countLimiter = createUploadRateLimiter(
    RATE_LIMITS.SCHOOL_UPLOADS_PER_HOUR,
    3600
  )

  const countResult = await countLimiter.limit(`school:${schoolId}:count`)

  if (!countResult.success) {
    return {
      allowed: false,
      limit: RATE_LIMITS.SCHOOL_UPLOADS_PER_HOUR,
      remaining: 0,
      reset: countResult.reset,
      retryAfter: Math.ceil((countResult.reset - Date.now()) / 1000),
    }
  }

  // Check hourly bandwidth
  const bandwidthLimiter = createBandwidthRateLimiter(
    RATE_LIMITS.SCHOOL_BYTES_PER_HOUR,
    3600
  )

  const bandwidthResult = await bandwidthLimiter.limit(
    `school:${schoolId}:bytes`,
    { rate: fileSize } // Consume tokens equal to file size
  )

  if (!bandwidthResult.success) {
    return {
      allowed: false,
      limit: RATE_LIMITS.SCHOOL_BYTES_PER_HOUR,
      remaining: bandwidthResult.remaining,
      reset: bandwidthResult.reset,
      retryAfter: Math.ceil((bandwidthResult.reset - Date.now()) / 1000),
    }
  }

  return {
    allowed: true,
    limit: RATE_LIMITS.SCHOOL_UPLOADS_PER_HOUR,
    remaining: countResult.remaining,
    reset: countResult.reset,
  }
}

/**
 * Check if upload is allowed for a user
 * Checks both count and bandwidth limits
 */
export async function checkUserUploadLimit(
  userId: string,
  fileSize: number
): Promise<RateLimitResult> {
  // Check hourly upload count
  const countLimiter = createUploadRateLimiter(
    RATE_LIMITS.USER_UPLOADS_PER_HOUR,
    3600
  )

  const countResult = await countLimiter.limit(`user:${userId}:count`)

  if (!countResult.success) {
    return {
      allowed: false,
      limit: RATE_LIMITS.USER_UPLOADS_PER_HOUR,
      remaining: 0,
      reset: countResult.reset,
      retryAfter: Math.ceil((countResult.reset - Date.now()) / 1000),
    }
  }

  // Check hourly bandwidth
  const bandwidthLimiter = createBandwidthRateLimiter(
    RATE_LIMITS.USER_BYTES_PER_HOUR,
    3600
  )

  const bandwidthResult = await bandwidthLimiter.limit(`user:${userId}:bytes`, {
    rate: fileSize,
  })

  if (!bandwidthResult.success) {
    return {
      allowed: false,
      limit: RATE_LIMITS.USER_BYTES_PER_HOUR,
      remaining: bandwidthResult.remaining,
      reset: bandwidthResult.reset,
      retryAfter: Math.ceil((bandwidthResult.reset - Date.now()) / 1000),
    }
  }

  return {
    allowed: true,
    limit: RATE_LIMITS.USER_UPLOADS_PER_HOUR,
    remaining: countResult.remaining,
    reset: countResult.reset,
  }
}

/**
 * Check if API endpoint access is allowed (by IP address)
 * Prevents brute force and DoS attacks
 */
export async function checkEndpointRateLimit(
  endpoint: string,
  ipAddress: string
): Promise<RateLimitResult> {
  const limiter = createUploadRateLimiter(
    RATE_LIMITS.UPLOAD_ENDPOINT_PER_MINUTE,
    60
  )

  const result = await limiter.limit(`endpoint:${endpoint}:${ipAddress}`)

  return {
    allowed: result.success,
    limit: RATE_LIMITS.UPLOAD_ENDPOINT_PER_MINUTE,
    remaining: result.remaining,
    reset: result.reset,
    retryAfter: result.success
      ? undefined
      : Math.ceil((result.reset - Date.now()) / 1000),
  }
}

/**
 * Get current rate limit status without consuming tokens
 * Useful for displaying remaining quota to users
 */
export async function getRateLimitStatus(
  key: string
): Promise<{ remaining: number; limit: number; reset: number } | null> {
  try {
    const client = getRedisClient()
    const data = await client.get(`upload_ratelimit:${key}`)

    if (!data) {
      return null
    }

    return data as { remaining: number; limit: number; reset: number }
  } catch {
    return null
  }
}

/**
 * Reset rate limit for a key (admin function)
 * Use with caution - only for emergency situations
 */
export async function resetRateLimit(key: string): Promise<void> {
  const client = getRedisClient()
  await client.del(`upload_ratelimit:${key}`)
  await client.del(`bandwidth_ratelimit:${key}`)
}

/**
 * Get rate limit analytics
 * Returns statistics about rate limit hits
 */
export async function getRateLimitAnalytics(
  prefix: string,
  startTime: Date,
  endTime: Date
): Promise<{
  totalRequests: number
  blockedRequests: number
  uniqueKeys: number
}> {
  // This would integrate with Upstash Analytics API
  // For now, return placeholder
  return {
    totalRequests: 0,
    blockedRequests: 0,
    uniqueKeys: 0,
  }
}

/**
 * Format rate limit error message for user
 */
export function formatRateLimitError(result: RateLimitResult): string {
  const resetDate = new Date(result.reset)
  const resetTime = resetDate.toLocaleTimeString()

  if (result.retryAfter) {
    if (result.retryAfter < 60) {
      return `Rate limit exceeded. Please try again in ${result.retryAfter} seconds.`
    } else if (result.retryAfter < 3600) {
      const minutes = Math.ceil(result.retryAfter / 60)
      return `Rate limit exceeded. Please try again in ${minutes} minutes.`
    } else {
      return `Rate limit exceeded. Limit resets at ${resetTime}.`
    }
  }

  return `Rate limit exceeded. You have ${result.remaining} requests remaining out of ${result.limit}.`
}

/**
 * Middleware helper for Next.js API routes
 * Usage: await withRateLimit(req, async () => { ... })
 */
export async function withRateLimit<T>(
  identifier: string,
  maxRequests: number,
  windowSeconds: number,
  action: () => Promise<T>
): Promise<T> {
  const limiter = createUploadRateLimiter(maxRequests, windowSeconds)
  const result = await limiter.limit(identifier)

  if (!result.success) {
    throw new Error(
      formatRateLimitError({
        allowed: false,
        limit: maxRequests,
        remaining: result.remaining,
        reset: result.reset,
        retryAfter: Math.ceil((result.reset - Date.now()) / 1000),
      })
    )
  }

  return action()
}

/**
 * Create custom rate limiter with specific configuration
 */
export function createCustomRateLimiter(config: {
  maxRequests: number
  windowSeconds: number
  prefix?: string
}) {
  return new Ratelimit({
    redis: getRedisClient(),
    limiter: Ratelimit.slidingWindow(
      config.maxRequests,
      `${config.windowSeconds} s`
    ),
    analytics: true,
    prefix: config.prefix || "custom_ratelimit",
  })
}
