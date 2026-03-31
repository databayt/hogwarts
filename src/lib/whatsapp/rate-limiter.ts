/**
 * WhatsApp Rate Limiter
 *
 * Prevents WhatsApp number bans by enforcing sending limits:
 * - Per school: max 1 message/second, 500 DMs/day
 * - Per group: max 20 messages/hour
 * - New connections: warm-up period with lower limits
 *
 * Uses in-memory tracking (resets on server restart, which is safe
 * since rate limits are conservative enough to handle that).
 */

type RateWindow = {
  count: number
  resetAt: number // Unix timestamp in ms
}

// In-memory counters per school
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

/**
 * Check if a message can be sent, and if so, consume a rate limit token.
 * Returns true if allowed, false if rate-limited.
 */
export function checkAndConsumeRateLimit(
  schoolId: string,
  options?: {
    groupId?: string
    connectedSince?: Date
  }
): { allowed: boolean; retryAfterMs?: number } {
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
  const dailyLimit =
    options?.connectedSince &&
    now - options.connectedSince.getTime() < LIMITS.warmupDays * 86400000
      ? LIMITS.warmupDailyLimit
      : LIMITS.perDay

  const dailyWindow = getOrCreateWindow(
    schoolDailyCounters,
    schoolId,
    86400000 // 24 hours
  )
  if (dailyWindow.count >= dailyLimit) {
    return { allowed: false, retryAfterMs: dailyWindow.resetAt - now }
  }

  // 3. Group hourly limit
  if (options?.groupId) {
    const groupKey = `${schoolId}:${options.groupId}`
    const groupWindow = getOrCreateWindow(
      groupCounters,
      groupKey,
      3600000 // 1 hour
    )
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
 * Get current rate limit status for a school (for display in UI)
 */
export function getRateLimitStatus(schoolId: string): {
  dailyUsed: number
  dailyLimit: number
  dailyResetsAt: Date | null
} {
  const dailyWindow = schoolDailyCounters.get(schoolId)
  return {
    dailyUsed: dailyWindow?.count ?? 0,
    dailyLimit: LIMITS.perDay,
    dailyResetsAt: dailyWindow ? new Date(dailyWindow.resetAt) : null,
  }
}

/**
 * Clean up stale entries (call periodically)
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
