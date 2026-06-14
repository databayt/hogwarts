// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
//
// In-process OAuth access-token cache shared by the native provider adapters.
// Provider tokens are valid ~1h; without caching every createMeeting would do a
// fresh token exchange + the create call, hammering the provider's token
// endpoint under a burst of scheduling.

type CachedToken = { token: string; expiresAt: number }

const cache = new Map<string, CachedToken>()
// In-flight exchanges so a burst of concurrent misses shares ONE fetcher call
// instead of stampeding the provider's token endpoint on a cold start.
const inflight = new Map<string, Promise<string>>()

/**
 * Return a cached access token for `key`, refreshing via `fetcher` when absent
 * or within 60s of expiry. `fetcher` returns the token + its lifetime in seconds.
 * Concurrent callers that all miss the cache share a single in-flight exchange.
 */
export async function getCachedToken(
  key: string,
  fetcher: () => Promise<{ token: string; expiresInSec: number }>
): Promise<string> {
  const hit = cache.get(key)
  if (hit && hit.expiresAt > Date.now()) return hit.token

  const pending = inflight.get(key)
  if (pending) return pending

  const p = fetcher()
    .then(({ token, expiresInSec }) => {
      cache.set(key, {
        token,
        expiresAt: Date.now() + Math.max(0, expiresInSec - 60) * 1000,
      })
      inflight.delete(key)
      return token
    })
    .catch((err) => {
      inflight.delete(key)
      throw err
    })
  inflight.set(key, p)
  return p
}

/** Test-only: drop all cached tokens + in-flight exchanges so suites stay isolated. */
export function clearTokenCache(): void {
  cache.clear()
  inflight.clear()
}
