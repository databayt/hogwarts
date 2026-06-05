/**
 * WhatsApp Rate Limiter
 *
 * Prevents WhatsApp number bans by enforcing sending limits:
 * - Per school: max 1 message/second, 500 DMs/day
 * - Per group: max 20 messages/hour
 * - New connections: warm-up period with lower limits
 *
 * STORAGE STRATEGY (mirrors src/lib/rate-limit.ts):
 * 1. If UPSTASH_REDIS_REST_URL is configured → durable counters shared across
 *    every serverless instance (the daily cap is then enforced globally — the
 *    ban-prevention property that in-memory counters cannot provide on Vercel).
 * 2. Otherwise → in-memory counters (per-process). Conservative limits make a
 *    cold-start reset acceptable for low/medium volume. This is the current
 *    default and keeps behavior identical until UPSTASH_* is set.
 *
 * `checkAndConsumeRateLimit` / `getRateLimitStatus` are async (Redis I/O); the
 * in-memory branch resolves synchronously.
 */

type RateWindow = {
  count: number
  resetAt: number // Unix timestamp in ms
}

// In-memory counters per school (fallback when Upstash is not configured)
const schoolCounters = new Map<string, RateWindow>()
const schoolDailyCounters = new Map<string, RateWindow>()
const groupCounters = new Map<string, RateWindow>()
const lastSendTime = new Map<string, number>()

const LIMITS = {
  perSecond: 1, // Max 1 message per second per school
  perDay: 500, // Max 500 DMs per day per school
  perGroupHour: 20, // Max 20 messages per hour per group
  warmupDays: 7, // Days before full limits apply
  warmupDailyLimit: 50, // Daily limit during warmup
} as const

const DAY_MS = 86_400_000
const HOUR_MS = 3_600_000

export type RateLimitResult = { allowed: boolean; retryAfterMs?: number }
export type RateLimitOptions = {
  groupId?: string
  connectedSince?: Date
}

function dailyLimitFor(connectedSince?: Date, now = Date.now()): number {
  return connectedSince &&
    now - connectedSince.getTime() < LIMITS.warmupDays * DAY_MS
    ? LIMITS.warmupDailyLimit
    : LIMITS.perDay
}

// --- Durable counters via Upstash Redis (when configured) ------------------

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
    // Sync lazy require keeps the client out of the import graph until needed.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require("@upstash/redis") as typeof import("@upstash/redis")
    _upstashRedis = new mod.Redis({ url, token })
    _upstashAvailable = true
    return _upstashRedis
  } catch {
    _upstashAvailable = false
    return null
  }
}

async function checkAndConsumeRedis(
  redis: import("@upstash/redis").Redis,
  schoolId: string,
  options?: RateLimitOptions
): Promise<RateLimitResult> {
  // 1. Per-second throttle — SET NX with a 1s TTL acts as a one-per-second lock
  const secKey = `wa:rl:sec:${schoolId}`
  const lock = await redis.set(secKey, "1", { nx: true, px: 1000 })
  if (lock === null) {
    return { allowed: false, retryAfterMs: 1000 }
  }

  // 2. Daily limit — atomic INCR, expire the window on first write
  const dayKey = `wa:rl:day:${schoolId}`
  const dailyCount = await redis.incr(dayKey)
  if (dailyCount === 1) {
    await redis.expire(dayKey, DAY_MS / 1000)
  }
  if (dailyCount > dailyLimitFor(options?.connectedSince)) {
    const ttl = await redis.pttl(dayKey)
    return { allowed: false, retryAfterMs: ttl > 0 ? ttl : DAY_MS }
  }

  // 3. Per-group hourly limit
  if (options?.groupId) {
    const groupKey = `wa:rl:grp:${schoolId}:${options.groupId}`
    const groupCount = await redis.incr(groupKey)
    if (groupCount === 1) {
      await redis.expire(groupKey, HOUR_MS / 1000)
    }
    if (groupCount > LIMITS.perGroupHour) {
      const ttl = await redis.pttl(groupKey)
      return { allowed: false, retryAfterMs: ttl > 0 ? ttl : HOUR_MS }
    }
  }

  return { allowed: true }
}

// --- In-memory fallback (per-process) --------------------------------------

function getOrCreateWindow(
  map: Map<string, RateWindow>,
  key: string,
  windowMs: number
): RateWindow {
  const now = Date.now()
  const existing = map.get(key)

  if (existing && existing.resetAt > now) {
    return existing
  }

  const window: RateWindow = { count: 0, resetAt: now + windowMs }
  map.set(key, window)
  return window
}

function checkAndConsumeMemory(
  schoolId: string,
  options?: RateLimitOptions
): RateLimitResult {
  const now = Date.now()

  // 1. Per-second throttle
  const lastSend = lastSendTime.get(schoolId) ?? 0
  const timeSinceLastSend = now - lastSend
  if (timeSinceLastSend < 1000 / LIMITS.perSecond) {
    return {
      allowed: false,
      retryAfterMs: 1000 / LIMITS.perSecond - timeSinceLastSend,
    }
  }

  // 2. Daily limit
  const dailyLimit = dailyLimitFor(options?.connectedSince, now)
  const dailyWindow = getOrCreateWindow(schoolDailyCounters, schoolId, DAY_MS)
  if (dailyWindow.count >= dailyLimit) {
    return { allowed: false, retryAfterMs: dailyWindow.resetAt - now }
  }

  // 3. Group hourly limit
  if (options?.groupId) {
    const groupKey = `${schoolId}:${options.groupId}`
    const groupWindow = getOrCreateWindow(groupCounters, groupKey, HOUR_MS)
    if (groupWindow.count >= LIMITS.perGroupHour) {
      return { allowed: false, retryAfterMs: groupWindow.resetAt - now }
    }
    groupWindow.count++
  }

  // Consume tokens
  dailyWindow.count++
  lastSendTime.set(schoolId, now)

  return { allowed: true }
}

/**
 * Check if a message can be sent, and if so, consume a rate limit token.
 * Returns true if allowed, false if rate-limited.
 *
 * Durable across instances when Upstash is configured; otherwise in-memory.
 */
export async function checkAndConsumeRateLimit(
  schoolId: string,
  options?: RateLimitOptions
): Promise<RateLimitResult> {
  const redis = getUpstashRedis()
  if (redis) {
    try {
      return await checkAndConsumeRedis(redis, schoolId, options)
    } catch (err) {
      // Never let a Redis hiccup block sending — degrade to in-memory.
      console.error("[whatsapp-rate-limiter] Redis error, falling back:", err)
    }
  }
  return checkAndConsumeMemory(schoolId, options)
}

/**
 * Get current rate limit status for a school (for display in UI)
 */
export async function getRateLimitStatus(schoolId: string): Promise<{
  dailyUsed: number
  dailyLimit: number
  dailyResetsAt: Date | null
}> {
  const redis = getUpstashRedis()
  if (redis) {
    try {
      const dayKey = `wa:rl:day:${schoolId}`
      const [used, ttl] = await Promise.all([
        redis.get<number>(dayKey),
        redis.pttl(dayKey),
      ])
      return {
        dailyUsed: Number(used ?? 0),
        dailyLimit: LIMITS.perDay,
        dailyResetsAt: ttl && ttl > 0 ? new Date(Date.now() + ttl) : null,
      }
    } catch (err) {
      console.error("[whatsapp-rate-limiter] Redis status error:", err)
    }
  }
  const dailyWindow = schoolDailyCounters.get(schoolId)
  return {
    dailyUsed: dailyWindow?.count ?? 0,
    dailyLimit: LIMITS.perDay,
    dailyResetsAt: dailyWindow ? new Date(dailyWindow.resetAt) : null,
  }
}

/**
 * Clean up stale in-memory entries (call periodically). No-op for the Redis
 * path, where TTLs expire keys automatically.
 */
export function cleanupStaleEntries(): void {
  const now = Date.now()
  for (const [key, window] of schoolCounters) {
    if (window.resetAt <= now) schoolCounters.delete(key)
  }
  for (const [key, window] of schoolDailyCounters) {
    if (window.resetAt <= now) schoolDailyCounters.delete(key)
  }
  for (const [key, window] of groupCounters) {
    if (window.resetAt <= now) groupCounters.delete(key)
  }
}
