// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import "server-only"

import { revalidateTag } from "next/cache"

/**
 * Tag used by `globalSpotlightSearch` (in
 * `src/components/atom/generic-command-menu/actions.ts`) to scope its
 * `unstable_cache` entries per tenant. Calling `revalidateSpotlight()`
 * after an entity create/delete drops the cached search results for
 * that one school without affecting any other tenant.
 *
 * Without this hook, search results stay cached for up to 60 s after a
 * write. The hook is only worth wiring in for high-frequency creates
 * where a one-minute lag would surprise the user.
 */
export const spotlightCacheTag = (schoolId: string) =>
  `spotlight:${schoolId}` as const

/**
 * Invalidate the spotlight result cache for one tenant.
 *
 * Call this from server actions that create / update / delete entities
 * the spotlight indexes (students, teachers, guardians, classes,
 * announcements, …). Safe to call from any server action — it's a
 * fire-and-forget signal to Next.js's data cache.
 *
 * @example
 *   await db.student.create({ ... })
 *   revalidateSpotlight(schoolId)
 *   revalidatePath(`/${lang}/students`)
 */
export function revalidateSpotlight(schoolId: string | null | undefined): void {
  if (!schoolId) return
  revalidateTag(spotlightCacheTag(schoolId), "max")
}
