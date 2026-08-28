// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { headers } from "next/headers"

import { mainOriginForHost, tenantOriginForHost } from "@/lib/root-domain"

/**
 * Build the school's tenant-aware base URL for redirects (Stripe/Tap
 * success/cancel, receipt deep links, credential delivery, etc).
 *
 * The root domain is taken from the CURRENT REQUEST's host — hogwarts serves
 * the same tenant on every registered root (`demo.databayt.org` and
 * `demo.balqalam.com`), and a payer who checked out from `alqabs.balqalam.com`
 * must land back on `alqabs.balqalam.com`. This used to hardcode
 * `https://${subdomain}.databayt.org`, which sent every balqalam.com family
 * to a host that no longer serves this app after paying.
 *
 * - production + subdomain → `https://${subdomain}.${root-of-request}`
 *   (primary root when the host is unknown, e.g. outside a request)
 * - development + subdomain → `http://${subdomain}.localhost:3000`
 * - missing subdomain → the platform origin (`NEXT_PUBLIC_APP_URL`, else the
 *   main host of the request's root)
 *
 * Lives in its own module (not actions.ts) because Next.js requires every
 * export from a `"use server"` file to be an async function.
 */
export function buildTenantBaseUrl(
  subdomain: string | null | undefined,
  host?: string | null
): string {
  if (!subdomain) {
    return (
      process.env.NEXT_PUBLIC_APP_URL ||
      (host ? mainOriginForHost(host) : "https://app.databayt.org")
    )
  }
  return tenantOriginForHost(host ?? null, subdomain)
}

/**
 * Request-aware variant: reads the current request's `host` header so the
 * redirect stays on the root domain the payer is actually using. Falls back
 * to the host-less form outside a request scope (crons, tests).
 */
export async function resolveTenantBaseUrl(
  subdomain: string | null | undefined
): Promise<string> {
  let host: string | null = null
  try {
    host = (await headers()).get("host")
  } catch {
    host = null
  }
  return buildTenantBaseUrl(subdomain, host)
}
