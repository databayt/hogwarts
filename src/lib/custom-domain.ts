// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Custom domain → tenant subdomain, via Upstash Redis (Edge-compatible).
 *
 * The operator writes `custom-domain:{host}` → subdomain when a school's
 * domain request is verified. Read by the proxy (URL rewriting) and by
 * `app/manifest.ts`, which the proxy never sees because its matcher skips
 * dotted paths. No server-only imports: this runs in the proxy.
 */

let _edgeRedis: import("@upstash/redis").Redis | null = null
let _edgeRedisAvailable: boolean | null = null

function getEdgeRedis(): import("@upstash/redis").Redis | null {
  if (_edgeRedisAvailable === false) return null
  if (_edgeRedis) return _edgeRedis
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) {
    _edgeRedisAvailable = false
    return null
  }
  try {
    const { Redis } =
      require("@upstash/redis") as typeof import("@upstash/redis")
    _edgeRedis = new Redis({ url, token })
    _edgeRedisAvailable = true
    return _edgeRedis
  } catch {
    _edgeRedisAvailable = false
    return null
  }
}

/**
 * Look up a custom domain → subdomain mapping from Redis
 * Returns the school's subdomain if the host is a verified custom domain
 */
export async function resolveCustomDomain(
  host: string
): Promise<string | null> {
  const r = getEdgeRedis()
  if (!r) return null
  try {
    return await r.get<string>(`custom-domain:${host}`)
  } catch {
    return null
  }
}
