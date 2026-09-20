// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { Metadata } from "next"
import { headers } from "next/headers"

import { getSubdomainFromHost } from "@/lib/root-domain"
import { getSchoolBySubdomain } from "@/lib/subdomain-actions"
import { resolveSchoolDisplayName } from "@/components/template/site-header/display-name"

/**
 * Title + home-screen label naming one school. Kept in one place because
 * `appleWebApp` merges SHALLOWLY: a segment that sets it has to repeat the
 * root layout's `capable`/`statusBarStyle` or the installed app drops out of
 * standalone mode.
 */
export function schoolNameMetadata(displayName: string): Metadata {
  return {
    title: displayName,
    appleWebApp: {
      capable: true,
      title: displayName,
      statusBarStyle: "default",
    },
  }
}

/**
 * Title + home-screen label for a page served on a school's own host but
 * living OUTSIDE `/s/[subdomain]` — the auth group and `/accept-invite`.
 * Those routes are never rewritten under the tenant segment (see
 * `src/proxy.ts`), so the tenant layout's metadata cannot reach them and they
 * fell through to the platform's "بالقلم - نظام إدارة المدارس".
 *
 * Returns `{}` on the main host, which leaves the platform metadata in place.
 *
 * DYNAMIC: reads `headers()`. Only call it from a route that is already
 * dynamic — `[lang]/layout.tsx` deliberately avoids the request APIs so the
 * marketing pages can still be prerendered.
 */
export async function tenantHostMetadata(lang: string): Promise<Metadata> {
  const requestHeaders = await headers()
  const subdomain =
    requestHeaders.get("x-subdomain") ??
    getSubdomainFromHost(
      requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host")
    )
  if (!subdomain) return {}

  // Memoised for 60s, so repeated calls across a navigation cost one query.
  const result = await getSchoolBySubdomain(subdomain)
  if (!result.success || !result.data) return {}

  return schoolNameMetadata(await resolveSchoolDisplayName(result.data, lang))
}
