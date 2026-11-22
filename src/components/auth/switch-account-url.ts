// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Where a switched-out person lands: the school's login page, optionally with
 * `callbackUrl` so signing in as the right account returns to where they were.
 */
export function loginUrlFor(lang: string, callbackUrl?: string): string {
  const base = `/${lang}/login`
  return callbackUrl
    ? `${base}?callbackUrl=${encodeURIComponent(callbackUrl)}`
    : base
}
