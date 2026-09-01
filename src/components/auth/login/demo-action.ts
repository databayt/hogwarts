"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { headers } from "next/headers"

import { getSubdomainFromHost } from "@/lib/root-domain"

import { login } from "./action"
import {
  DEMO_ACCOUNT_PASSWORD,
  DEMO_ACCOUNTS,
  DEMO_SUBDOMAIN,
  type DemoRoleKey,
} from "./demo-accounts"

/**
 * Role-picker login for the demo tenant.
 *
 * Deliberately a thin wrapper: it resolves a role key to the seeded account and
 * hands off to `login()` unchanged, so the demo visitor gets exactly the session,
 * cookies and redirect they'd get by typing the credentials themselves.
 */
export async function demoRoleLogin(
  roleKey: string,
  options: { locale: string; callbackUrl?: string | null }
): Promise<Awaited<ReturnType<typeof login>>> {
  // A Server Action is a public endpoint — re-derive the tenant from the request
  // rather than trusting anything the caller sent. The proxy sets x-subdomain on
  // auth routes (src/proxy.ts); the host fallback covers the case where it doesn't
  // survive the action POST.
  const requestHeaders = await headers()
  const host =
    requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host")
  const subdomain =
    requestHeaders.get("x-subdomain") ?? getSubdomainFromHost(host)

  if (subdomain !== DEMO_SUBDOMAIN) {
    return { error: "INVALID_CREDENTIALS" }
  }

  const identifier = DEMO_ACCOUNTS[roleKey as DemoRoleKey]
  if (!identifier) {
    return { error: "INVALID_CREDENTIALS" }
  }

  return login(
    { identifier, password: DEMO_ACCOUNT_PASSWORD },
    {
      callbackUrl: options.callbackUrl,
      context: "school",
      subdomain: DEMO_SUBDOMAIN,
      locale: options.locale,
    }
  )
}
