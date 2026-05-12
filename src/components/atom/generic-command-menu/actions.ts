"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import "server-only"

import { auth } from "@/auth"

import { getTenantContext } from "@/lib/tenant-context"
import { unstable_cache } from "@/components/table/lib/unstable-cache"

import { normalizeForMatch } from "./normalize"
import { globalSearch } from "./server/global-search"
import type { Role, SpotlightGroupKind, SpotlightResultGroup } from "./types"

const MIN_QUERY_LENGTH = 2
const MAX_RESULTS_PER_KIND = 5
const CACHE_TTL_S = 60

export interface GlobalSpotlightSearchInput {
  query: string
  locale?: "en" | "ar"
  kinds?: SpotlightGroupKind[]
}

export type GlobalSpotlightSearchOutput =
  | { ok: true; groups: SpotlightResultGroup[]; took: number }
  | {
      ok: false
      errorCode:
        | "UNAUTHENTICATED"
        | "MISSING_SCHOOL_CONTEXT"
        | "QUERY_TOO_SHORT"
        | "FORBIDDEN"
    }

/**
 * Cross-feature spotlight search across school-dashboard entities.
 *
 * Tenant-safe by construction: every per-kind predicate hard-codes
 * `schoolId` from `getTenantContext()`, and the cache key includes
 * `schoolId` + role + locale so two tenants never share results.
 *
 * RBAC narrowing: STUDENT/GUARDIAN/TEACHER are restricted to their own
 * scope (see `rbac-predicates.ts`). USER (signed-in but not yet onboarded)
 * gets `FORBIDDEN`.
 */
export async function globalSpotlightSearch(
  input: GlobalSpotlightSearchInput
): Promise<GlobalSpotlightSearchOutput> {
  const session = await auth()
  if (!session?.user?.id) return { ok: false, errorCode: "UNAUTHENTICATED" }

  const ctx = await getTenantContext()
  if (!ctx.schoolId) {
    return { ok: false, errorCode: "MISSING_SCHOOL_CONTEXT" }
  }
  const role = (ctx.role as Role | null) ?? "USER"
  if (role === "USER") return { ok: false, errorCode: "FORBIDDEN" }

  const trimmed = input.query.trim()
  if (trimmed.length < MIN_QUERY_LENGTH) {
    return { ok: false, errorCode: "QUERY_TOO_SHORT" }
  }

  // Normalize query so client- and server-side matching agree (alef
  // variants, harakat, ya/ta-marbuta, etc.). Cache key uses normalized
  // form so "أحم" and "احم" hit the same entry.
  const normalized = normalizeForMatch(trimmed)
  const userId = session.user.id
  const schoolId = ctx.schoolId
  const locale = input.locale ?? "en"
  const kindsKey = (input.kinds ?? []).slice().sort().join(",")

  const cached = unstable_cache(
    async (q: string) =>
      globalSearch({
        schoolId,
        userId,
        role,
        query: q,
        locale,
        kinds: input.kinds,
        perKindLimit: MAX_RESULTS_PER_KIND,
      }),
    ["spotlight", schoolId, role, locale, normalized, kindsKey],
    { revalidate: CACHE_TTL_S, tags: [`spotlight:${schoolId}`] }
  )

  const start = performance.now()
  const groups = await cached(normalized)
  return { ok: true, groups, took: performance.now() - start }
}
