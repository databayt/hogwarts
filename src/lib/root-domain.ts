// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Root-Domain Registry — multi-domain tenancy
 *
 * hogwarts serves the same app on several root (apex) domains:
 *   - databayt.org  → marketing/platform lives on ed.databayt.org,
 *                     tenants on <subdomain>.databayt.org
 *   - balqalam.com  → marketing/platform lives on the apex balqalam.com,
 *                     tenants on <subdomain>.balqalam.com
 *
 * A school's identity is its bare subdomain (School.domain = "demo"), so the
 * SAME school is reachable on every root domain (demo.databayt.org and
 * demo.balqalam.com). Sessions are scoped per root via the cookie Domain
 * attribute (.databayt.org / .balqalam.com) — SSO spans subdomains of one
 * root, never across roots.
 *
 * Every "which domain am I on?" decision must go through this module:
 *   - src/proxy.ts            → URL rewriting to /[lang]/s/[subdomain]
 *   - src/auth.ts             → cookie Domain + post-auth redirects
 *   - auth client components  → tenant/main origins from window.location
 *
 * Must stay Edge-safe and client-safe: pure string logic only — no Node
 * APIs, no server-only imports.
 */

export const ROOT_DOMAINS = ["databayt.org", "balqalam.com"] as const

export type RootDomain = (typeof ROOT_DOMAINS)[number]

/** Root used when the current host cannot be resolved (legacy default). */
export const PRIMARY_ROOT_DOMAIN: RootDomain = "databayt.org"

/**
 * Marketing/platform host per root — requests on these hosts are NOT tenants.
 * databayt.org's apex is the company site (a separate Vercel project), so the
 * platform lives on the `ed.` subdomain there; balqalam.com's apex IS the
 * platform.
 */
const MAIN_HOSTS: Record<RootDomain, string> = {
  "databayt.org": "ed.databayt.org",
  "balqalam.com": "balqalam.com",
}

function normalizeHost(host: string): string {
  return host.split(":")[0].toLowerCase()
}

/** Root domain a host belongs to, or null (localhost, previews, custom domains). */
export function getRootDomain(
  host: string | null | undefined
): RootDomain | null {
  if (!host) return null
  const h = normalizeHost(host)
  for (const root of ROOT_DOMAINS) {
    if (h === root || h.endsWith(`.${root}`)) return root
  }
  return null
}

/** Marketing/platform host for a root ("databayt.org" → "ed.databayt.org"). */
export function mainHostFor(root: RootDomain): string {
  return MAIN_HOSTS[root]
}

/**
 * True when the host is a marketing/platform host (root apex, www, or the
 * dedicated main host) or plain localhost — i.e. NOT a tenant subdomain.
 */
export function isMainDomainHost(host: string | null | undefined): boolean {
  if (!host) return false
  const h = normalizeHost(host)
  if (h === "localhost") return true
  const root = getRootDomain(h)
  if (!root) return false
  return h === root || h === `www.${root}` || h === MAIN_HOSTS[root]
}

/**
 * Tenant subdomain for a host, or null when the host is a marketing host,
 * plain localhost, or an unknown/custom domain.
 *
 * Handles every host shape the app serves:
 *   - Production roots:  demo.balqalam.com → "demo", school.databayt.org → "school"
 *   - Vercel previews:   tenant---branch.vercel.app → "tenant"
 *   - Development:       demo.localhost:3000 → "demo"
 */
export function getSubdomainFromHost(
  host: string | null | undefined
): string | null {
  if (!host) return null
  const h = normalizeHost(host)

  // Production root domains (apex/www/main hosts are never tenants)
  const root = getRootDomain(h)
  if (root) {
    if (isMainDomainHost(h)) return null
    return h.split(".")[0]
  }

  // Vercel preview: tenant---branch.vercel.app → "tenant"
  if (h.includes("---") && h.endsWith(".vercel.app")) {
    return h.split("---")[0]
  }

  // Development: subdomain.localhost → "subdomain"
  if (h.includes("localhost") && h.includes(".")) {
    const sub = h.split(".")[0]
    if (sub !== "www" && sub !== "localhost") return sub
  }

  return null
}

/**
 * Cookie Domain attribute for the current host, so sessions span every
 * subdomain of the SAME root (.databayt.org / .balqalam.com). Falls back to
 * the primary root when the host is unknown (legacy behavior for contexts
 * with no request). Returns undefined (host-only cookie) outside production
 * and on custom/preview domains — a browser rejects a Set-Cookie whose
 * Domain doesn't match the request host, so a wrong attribute silently
 * drops the session.
 */
export function cookieDomainForHost(
  host: string | null | undefined
): string | undefined {
  if (process.env.NODE_ENV !== "production") return undefined
  if (!host) return `.${PRIMARY_ROOT_DOMAIN}`
  const root = getRootDomain(host)
  return root ? `.${root}` : undefined
}

/**
 * Absolute origin for a tenant on the same root as `host` (server-side).
 * Development keeps the *.localhost:3000 scheme; unknown hosts fall back to
 * the primary root.
 */
export function tenantOriginForHost(
  host: string | null | undefined,
  subdomain: string
): string {
  if (process.env.NODE_ENV === "development") {
    return `http://${subdomain}.localhost:3000`
  }
  const root = getRootDomain(host) ?? PRIMARY_ROOT_DOMAIN
  return `https://${subdomain}.${root}`
}

/**
 * Absolute origin of the marketing/platform host on the same root as `host`
 * (server-side) — where centralized login/OAuth lives for that root.
 */
export function mainOriginForHost(host: string | null | undefined): string {
  if (process.env.NODE_ENV === "development") {
    return "http://localhost:3000"
  }
  const root = getRootDomain(host) ?? PRIMARY_ROOT_DOMAIN
  return `https://${MAIN_HOSTS[root]}`
}

/** Client-side: tenant origin on the current page's root domain. */
export function tenantOriginFromLocation(subdomain: string): string {
  if (typeof window === "undefined") return tenantOriginForHost(null, subdomain)
  const { hostname, protocol, port } = window.location
  const root = getRootDomain(hostname)
  if (root) return `https://${subdomain}.${root}`
  if (hostname.includes("localhost")) {
    return `${protocol}//${subdomain}.localhost${port ? `:${port}` : ""}`
  }
  return tenantOriginForHost(hostname, subdomain)
}

/** Client-side: marketing/platform origin on the current page's root domain. */
export function mainOriginFromLocation(): string {
  if (typeof window === "undefined") return mainOriginForHost(null)
  const { hostname, protocol, port } = window.location
  const root = getRootDomain(hostname)
  if (root) return `https://${MAIN_HOSTS[root]}`
  if (hostname.includes("localhost")) {
    return `${protocol}//localhost${port ? `:${port}` : ""}`
  }
  return mainOriginForHost(hostname)
}

/**
 * Client-side: bare root domain for "<school>.<root>" display URLs
 * (onboarding success screens). Keeps the full hostname on Vercel previews
 * and localhost so displayed URLs stay reachable.
 */
export function rootDomainFromLocation(): string {
  if (typeof window === "undefined") return PRIMARY_ROOT_DOMAIN
  const { hostname, port } = window.location
  const root = getRootDomain(hostname)
  if (root) return root
  if (hostname.endsWith(".vercel.app")) return hostname
  if (hostname.includes("localhost")) {
    return `localhost${port ? `:${port}` : ""}`
  }
  return PRIMARY_ROOT_DOMAIN
}
