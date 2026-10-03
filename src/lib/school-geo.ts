// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import "server-only"

import { db } from "@/lib/db"
import type { SchoolGeo } from "@/lib/map-bias"
import { normalizeSubdomain } from "@/lib/subdomain"

// Same 60s in-memory TTL as getSchoolBySubdomain: the tenant layout asks on
// every request and a school moves its pin about never.
const TTL_MS = 60 * 1000
const cache = new Map<string, { data: SchoolGeo | null; expiresAt: number }>()

/**
 * The school's map point, as plain numbers (Decimal can't cross to the
 * client). Kept out of `subdomain-actions.ts` on purpose: that file is
 * "use server" and its school object is handed to client code in places.
 */
export async function getSchoolGeo(
  subdomain: string
): Promise<SchoolGeo | null> {
  const domain = normalizeSubdomain(subdomain)
  const now = Date.now()
  const hit = cache.get(domain)
  if (hit && hit.expiresAt > now) return hit.data

  try {
    const school = await db.school.findUnique({
      where: { domain },
      select: { latitude: true, longitude: true, country: true },
    })
    const data: SchoolGeo | null = school
      ? {
          latitude: school.latitude == null ? null : Number(school.latitude),
          longitude: school.longitude == null ? null : Number(school.longitude),
          country: school.country,
        }
      : null
    cache.set(domain, { data, expiresAt: now + TTL_MS })
    return data
  } catch {
    // A map hint is never worth failing a page over
    return null
  }
}
