import "server-only"

import { cookies, headers } from "next/headers"
import { auth } from "@/auth"
import type { UserRole } from "@prisma/client"

import { dbCircuitBreaker } from "@/lib/circuit-breaker"
import { db } from "@/lib/db"

// --- Two-tier cache: Redis (shared across instances) → in-memory (per-instance fallback) ---

let redis: import("@upstash/redis").Redis | null = null
let redisAvailable = true

function getRedis() {
  if (!redisAvailable) return null
  if (redis) return redis
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) {
    redisAvailable = false
    return null
  }
  try {
    // Dynamic require to avoid import errors when Upstash is not configured
    const { Redis } =
      require("@upstash/redis") as typeof import("@upstash/redis")
    redis = new Redis({ url, token })
    return redis
  } catch {
    redisAvailable = false
    return null
  }
}

// In-memory fallback cache
const subdomainCache = new Map<
  string,
  { schoolId: string | null; expiresAt: number }
>()
const MEMORY_CACHE_TTL_MS = 60 * 1000 // 1 minute (fallback)
const REDIS_CACHE_TTL_S = 300 // 5 minutes (shared)

/**
 * Get schoolId from subdomain with two-tier caching
 * 1. Redis (shared across all serverless instances, 5 min TTL)
 * 2. In-memory Map (per-instance fallback, 1 min TTL)
 * 3. Database lookup (last resort)
 */
async function getSchoolIdFromSubdomain(
  subdomain: string
): Promise<string | null> {
  const now = Date.now()

  // Tier 1: In-memory cache (fastest, per-instance)
  const memCached = subdomainCache.get(subdomain)
  if (memCached && memCached.expiresAt > now) {
    return memCached.schoolId
  }

  // Tier 2: Redis cache (shared across instances)
  const r = getRedis()
  if (r) {
    try {
      const redisCached = await r.get<string>(`tenant:${subdomain}`)
      if (redisCached !== null) {
        // Populate in-memory cache from Redis
        subdomainCache.set(subdomain, {
          schoolId: redisCached || null,
          expiresAt: now + MEMORY_CACHE_TTL_MS,
        })
        return redisCached || null
      }
    } catch {
      // Redis error — fall through to DB
    }
  }

  // Tier 3: Database lookup (wrapped in circuit breaker)
  try {
    const school = await dbCircuitBreaker.execute(() =>
      db.school.findUnique({
        where: { domain: subdomain },
        select: { id: true },
      })
    )
    const schoolId = school?.id ?? null

    // Write back to both caches
    subdomainCache.set(subdomain, {
      schoolId,
      expiresAt: now + MEMORY_CACHE_TTL_MS,
    })

    if (r) {
      // Fire-and-forget Redis write
      r.set(`tenant:${subdomain}`, schoolId ?? "", {
        ex: REDIS_CACHE_TTL_S,
      }).catch(() => {})
    }

    // Cleanup old in-memory entries periodically
    if (subdomainCache.size > 100) {
      for (const [key, value] of subdomainCache) {
        if (value.expiresAt < now) {
          subdomainCache.delete(key)
        }
      }
    }

    return schoolId
  } catch {
    return null
  }
}

/**
 * Tenant Context Resolution
 *
 * CRITICAL: This is the single source of truth for tenant isolation.
 * Every database query MUST use the schoolId from this context.
 *
 * Resolution priority (first wins):
 * 1. Impersonation cookie → For admin debugging without switching accounts
 * 2. x-subdomain header → From middleware URL rewriting (school.databayt.org)
 * 3. Session schoolId → From JWT token after authentication
 *
 * See: src/proxy.ts for how x-subdomain header is set
 */

// Extended user type that includes the properties added by our auth callbacks
type ExtendedUser = {
  id: string
  email?: string | null
  role?: string
  schoolId?: string | null
}

// Extended session type
type ExtendedSession = {
  user: ExtendedUser
}

export type TenantContext = {
  schoolId: string | null
  requestId: string | null
  role: UserRole | null
  isPlatformAdmin: boolean
}

export async function getTenantContext(): Promise<TenantContext> {
  try {
    const session = (await auth()) as ExtendedSession | null
    const cookieStore = await cookies()
    const hdrs = await headers()
    // Priority 1: Impersonation cookie (for admin debugging)
    // CRITICAL: Must be first - allows DEVELOPERs to view any school without switching sessions
    // GOTCHA: Clear this cookie when done debugging to prevent stuck impersonation
    const impersonatedSchoolId =
      cookieStore.get("impersonate_schoolId")?.value ?? null

    // Priority 2: Subdomain from middleware header → resolve to schoolId via DB lookup
    // The x-subdomain header contains raw domain (e.g., "acme"), but queries need schoolId
    // Uses cached lookup to avoid repeated DB queries
    let headerSchoolId: string | null = null
    const subdomain = hdrs.get("x-subdomain")
    if (subdomain) {
      headerSchoolId = await getSchoolIdFromSubdomain(subdomain)
    }

    // Priority 3: Session schoolId (from JWT after auth)
    // CRITICAL: Order matters - impersonation > subdomain > session
    const schoolId =
      impersonatedSchoolId ?? headerSchoolId ?? session?.user?.schoolId ?? null
    const role = (session?.user?.role as UserRole | undefined) ?? null
    const isPlatformAdmin = role === "DEVELOPER"
    const requestId =
      hdrs.get("x-vercel-id") ?? hdrs.get("x-request-id") ?? crypto.randomUUID()
    return { schoolId, requestId, role, isPlatformAdmin }
  } catch (error) {
    console.error("[getTenantContext] Error getting tenant context:", error)
    return {
      schoolId: null,
      requestId: null,
      role: null,
      isPlatformAdmin: false,
    }
  }
}
