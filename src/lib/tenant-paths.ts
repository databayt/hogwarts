// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Paths that exist ONLY inside a school's tenant tree
 * (src/app/[lang]/s/[subdomain]/...) and have no twin on the bare root host.
 *
 * Opened on balqalam.com they fall through to the root site's 404 — a teacher
 * who landed on the root with a live-class link (a Chrome Custom Tab opened
 * from WhatsApp or an app) lost the room on every reload. The proxy sends a
 * signed-in visitor to /<lang>/my-school?next=<path>, which resolves their
 * school and forwards them to <school>.<root><path>.
 *
 * Deliberately excludes routes that ALSO exist on the root (the SaaS
 * dashboard's /dashboard, /billing, /sales, /compliance, /catalog, /parent,
 * /unauthorized, ...): those are valid root pages for their own audience.
 */
const TENANT_ONLY_PREFIXES = [
  "/live",
  "/live-classes",
  "/admission",
  "/application",
  "/attendance",
  "/cards",
  "/charts",
  "/conference",
  "/exams",
  "/finance",
  "/lab",
  "/library",
  "/lumos",
  "/my-assignments",
  "/my-fees",
  "/notifications",
  "/profile",
  "/school",
  "/settings",
  "/stats",
  "/timetable",
  "/transportation",
  "/whatsapp",
]

/** `pathWithoutLocale` is the request path with the /<lang> prefix removed. */
export function isTenantOnlyPath(pathWithoutLocale: string): boolean {
  return TENANT_ONLY_PREFIXES.some(
    (p) => pathWithoutLocale === p || pathWithoutLocale.startsWith(`${p}/`)
  )
}

/**
 * Accept only a same-site absolute path as the post-resolution target:
 * "/ar/live/join/x?y=1" yes; "//evil.com", "https://…", "" no.
 */
export function safeTenantNext(next: string | null | undefined): string | null {
  if (!next || !next.startsWith("/") || next.startsWith("//")) return null
  if (next.includes("\\")) return null
  return next
}
