// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { headers } from "next/headers"

import { tenantOriginForHost } from "@/lib/root-domain"
import { i18n, type Locale } from "@/components/internationalization/config"

/**
 * Absolute, locale-carrying URL into a tenant's own site — for links that leave
 * the app and come back later, which in practice means every link inside an
 * email.
 *
 * Those links were being assembled by hand as
 * `https://${subdomain}.databayt.org/application/status?token=…`, which is
 * wrong twice over:
 *
 *   1. **No locale.** An applicant who filled the form in Arabic got a link to
 *      a locale-less path, so the proxy re-derived a locale from their cookie
 *      or Accept-Language header rather than honouring the one they had just
 *      been using. Same class of bug the onboarding wizard carried until
 *      2026-08-08, where it silently flipped Arabic users to English.
 *   2. **The root domain is hardcoded.** `databayt.org` is only one of two
 *      roots — a school on `balqalam.com` was emailed a link to a host it does
 *      not serve. `tenantOriginForHost` reads the request's own host and keeps
 *      the reply on the same root, and returns the localhost origin in
 *      development so these links are followable while testing.
 *
 * `lang` is optional, and when it is absent the locale comes from the request's
 * own `x-locale` header rather than a constant. `src/proxy.ts` sets that header
 * on every request, so an action reached from an Arabic page emits Arabic links
 * whether or not its caller bothered to thread the locale down — which matters,
 * because `application-context.tsx` carries no locale at all and threading one
 * through the wizard provider would be a far wider change than the link is
 * worth. Passing `lang` explicitly still wins when a caller has it.
 */
export async function tenantUrl(
  subdomain: string,
  path: string,
  lang?: Locale | string
): Promise<string> {
  const h = await headers()
  const origin = tenantOriginForHost(h.get("host"), subdomain)
  const candidate = lang ?? h.get("x-locale") ?? undefined
  const locale = i18n.locales.includes(candidate as Locale)
    ? (candidate as Locale)
    : i18n.defaultLocale
  const suffix = path.startsWith("/") ? path : `/${path}`
  return `${origin}/${locale}${suffix}`
}
