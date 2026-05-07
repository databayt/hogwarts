// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Build the school's tenant-aware base URL for redirects (Stripe success/cancel,
 * receipt deep links, credential delivery, etc).
 *
 * - production + subdomain → `https://${subdomain}.databayt.org`
 * - development + subdomain → `http://${subdomain}.localhost:3000`
 * - missing subdomain → falls back to `NEXT_PUBLIC_APP_URL` so non-tenant
 *   contexts (platform admin, dev fallback) still work.
 *
 * Lives in its own module (not actions.ts) because Next.js requires every
 * export from a `"use server"` file to be an async function.
 */
export function buildTenantBaseUrl(
  subdomain: string | null | undefined
): string {
  if (!subdomain) {
    return process.env.NEXT_PUBLIC_APP_URL || "https://app.databayt.org"
  }
  if (process.env.NODE_ENV === "production") {
    return `https://${subdomain}.databayt.org`
  }
  return `http://${subdomain}.localhost:3000`
}
