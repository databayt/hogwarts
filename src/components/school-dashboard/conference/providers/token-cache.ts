// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
//
// In-process OAuth access-token cache shared by the native provider adapters.
// Provider tokens are valid ~1h; without caching every createMeeting would do a
// fresh token exchange + the create call, hammering the provider's token
// endpoint under a burst of scheduling.

type CachedToken = { token: string; expiresAt: number }

const cache = new Map<string, CachedToken>()

/**
 * Return a cached access token for `key`, refreshing via `fetcher` when absent
 * or within 60s of expiry. `fetcher` returns the token + its lifetime in seconds.
 */
export async function getCachedToken(
  key: string,
  fetcher: () => Promise<{ token: string; expiresInSec: number }>
): Promise<string> {
  const now = Date.now()
  const hit = cache.get(key)
  if (hit && hit.expiresAt > now) return hit.token

  const { token, expiresInSec } = await fetcher()
  cache.set(key, {
    token,
    expiresAt: now + Math.max(0, expiresInSec - 60) * 1000,
  })
  return token
}

/** Test-only: drop all cached tokens so suites stay isolated. */
export function clearTokenCache(): void {
  cache.clear()
}
