// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import "server-only"

import { resolveCustomDomain } from "@/lib/custom-domain"
import {
  getRootDomain,
  getSubdomainFromHost,
  isMainDomainHost,
} from "@/lib/root-domain"
import { PLATFORM_SCHOOL_ID } from "@/lib/platform-tenant"
import { getSchoolIdFromSubdomain } from "@/lib/tenant-context"

export type HostTenant =
  | { kind: "platform"; schoolId: typeof PLATFORM_SCHOOL_ID }
  | { kind: "school"; schoolId: string; subdomain: string }
  | { kind: "unknown" }

const PLATFORM: HostTenant = { kind: "platform", schoolId: PLATFORM_SCHOOL_ID }

/**
 * The tenant a request's Host names. API routes never pass through the proxy
 * (its matcher skips `api/`), so they get no `x-subdomain` header: the Host is
 * the only tenant signal a route handler can trust. A tenant named in the
 * request body can't be trusted.
 *
 * Main hosts, plain localhost and hosts that map to no school subdomain
 * (previews, a raw container address) are the platform. A subdomain that
 * resolves to no school, or to the platform sentinel itself (`platform` is
 * its reserved domain), is unknown.
 */
export async function tenantForHost(
  host: string | null | undefined
): Promise<HostTenant> {
  if (!host) return { kind: "unknown" }
  if (isMainDomainHost(host)) return PLATFORM

  let subdomain = getSubdomainFromHost(host)
  if (!subdomain && !getRootDomain(host)) {
    subdomain = await resolveCustomDomain(host.split(":")[0]!.toLowerCase())
  }
  if (!subdomain) return PLATFORM

  const schoolId = await getSchoolIdFromSubdomain(subdomain)
  if (!schoolId || schoolId === PLATFORM_SCHOOL_ID) return { kind: "unknown" }
  return { kind: "school", schoolId, subdomain }
}
