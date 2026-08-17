// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { headers } from "next/headers"

import { env } from "@/env.mjs"
import { tenantOriginForHost } from "@/lib/root-domain"
import { i18n, type Locale } from "@/components/internationalization/config"

/**
 * Absolute, locale-carrying URL into the current tenant's own site — for
 * links that leave the app and come back later: email links (enrollment,
 * completion/certificate) and Stripe success/cancel redirects.
 *
 * These were all built from `env.NEXT_PUBLIC_APP_URL` — the MAIN host — but
 * no `/lumos` route exists outside the tenant segment, so on production
 * every such link 404'd for tenant users (a paying student was redirected to
 * a not-found page immediately after checkout). Same class of bug the
 * admission emails fixed with `tenantUrl` in
 * `school-marketing/admission/actions/urls.ts`; this is the lumos-local
 * equivalent (blocks don't import each other's action helpers).
 *
 * The tenant subdomain comes from the `x-subdomain` header the proxy stamps
 * on every tenant request, and `tenantOriginForHost` keeps the link on the
 * same root domain the request arrived on (databayt.org vs balqalam.com,
 * localhost in development). Outside a tenant context (no header) this falls
 * back to the old main-host behavior rather than guessing a school.
 *
 * `lang` wins when the caller has one; otherwise the request's `x-locale`
 * header (also proxy-stamped) keeps the link in the language the user was
 * just using.
 */
export async function lumosTenantUrl(
  path: string,
  lang?: Locale | string
): Promise<string> {
  const h = await headers()
  const subdomain = h.get("x-subdomain")
  const origin = subdomain
    ? tenantOriginForHost(h.get("host"), subdomain)
    : env.NEXT_PUBLIC_APP_URL
  const candidate = lang ?? h.get("x-locale") ?? undefined
  const locale = i18n.locales.includes(candidate as Locale)
    ? (candidate as Locale)
    : i18n.defaultLocale
  const suffix = path.startsWith("/") ? path : `/${path}`
  return `${origin}/${locale}${suffix}`
}
