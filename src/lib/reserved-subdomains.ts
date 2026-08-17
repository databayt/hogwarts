// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Subdomains a school may never claim.
 *
 * Tenants live at `<domain>.databayt.org`, and so do several things that are not
 * tenants. The wildcard is shared, so a school that claims one of these names
 * does not get a broken school -- it takes down the platform surface that was
 * already answering on that host.
 *
 * This list used to exist twice, in `components/onboarding/subdomain/config.ts`
 * and privately inside `dns-service.ts`, and the two had already drifted apart
 * (only one had `demo`; only the other had `static`). Both now read this file.
 * Add names here, nowhere else.
 */

/** Names owned by another databayt property on `*.databayt.org`. */
const PLATFORM = [
  "ed", // hogwarts' own marketing/platform host
  "kun", // kun.databayt.org, the engine docs site
  "crm", // crm.databayt.org
  // Twenty CRM workspaces -- each is a live host on this same wildcard.
  "hogwarts",
  "mkan",
  "sijillee",
  "moallimee",
] as const

/** Infrastructure and convention names. */
const INFRA = [
  "www", "mail", "email", "admin", "api", "app", "blog", "dev", "test",
  "staging", "prod", "production", "support", "help", "docs", "status",
  "cdn", "assets", "static", "files", "images", "media", "ftp", "sftp",
  "ssh", "ssl", "vpn", "secure", "login", "signup", "register", "account",
  "dashboard", "portal", "shop", "store", "preview",
  // `demo` is the auto-seeded demo school (prisma/seeds/ensure-demo.ts). The
  // seeder writes through Prisma directly, so reserving it here blocks only
  // a user from claiming the name out from under it.
  "demo",
] as const

export const RESERVED_SUBDOMAINS = [...PLATFORM, ...INFRA] as const

export type ReservedSubdomain = (typeof RESERVED_SUBDOMAINS)[number]

export function isReservedSubdomain(subdomain: string): boolean {
  return (RESERVED_SUBDOMAINS as readonly string[]).includes(
    subdomain.trim().toLowerCase()
  )
}
