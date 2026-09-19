// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { NextRequest, NextResponse } from "next/server"

import { normalizeForMatch } from "@/components/atom/generic-command-menu/normalize"
import { globalSearch } from "@/components/atom/generic-command-menu/server/global-search"
import type {
  Role,
  SpotlightGroupKind,
} from "@/components/atom/generic-command-menu/types"

import { authenticate, isAuthError } from "../lib/authenticate"

/**
 * Mobile Search API — the phone's half of the Spotlight palette.
 *
 * The web reaches the same engine through a server action
 * (`generic-command-menu/actions.ts`), which a phone cannot call, so this is
 * the same `globalSearch()` behind HTTP. Every predicate it runs hard-codes
 * the `schoolId` this token carries, and `buildEntityKindList` narrows the
 * kinds by role before a single query is built, so a tenant boundary cannot
 * be crossed from here.
 *
 * GET /api/mobile/search?q=…&kinds=student,teacher&lang=ar&limit=5
 *
 * Two deliberate differences from the action:
 *
 *  - No `unstable_cache`. That is an RSC revalidation primitive keyed to tags
 *    a route handler does not participate in; a 60s per-query cache is not
 *    worth a layer whose invalidation would only look like it works.
 *  - The `USER` refusal is explicit. `buildEntityKindList` already returns
 *    nothing for an un-onboarded account, but an empty 200 reads as "no
 *    matches" when the truth is "not allowed".
 */

/** `actions.ts` — kept in step with the web so one query means one result set. */
const MIN_QUERY_LENGTH = 2
const DEFAULT_PER_KIND = 5
const MAX_PER_KIND = 20

/** `SpotlightGroupKind`, as values — the union is a type and cannot be iterated. */
const KINDS: readonly SpotlightGroupKind[] = [
  "student",
  "teacher",
  "guardian",
  "class",
  "classroom",
  "subject",
  "vehicle",
  "driver",
  "route",
  "application",
  "payment",
  "invoice",
  "book",
  "announcement",
  "event",
]

/**
 * The roles the search engine understands. A token carrying anything else is
 * refused rather than cast into the union — a type-lie would reach Prisma.
 */
const ROLES: readonly Role[] = [
  "DEVELOPER",
  "ADMIN",
  "TEACHER",
  "STUDENT",
  "GUARDIAN",
  "ACCOUNTANT",
  "STAFF",
  "USER",
]

export async function GET(request: NextRequest) {
  try {
    const auth = await authenticate(request)
    if (isAuthError(auth)) return auth
    const { schoolId, userId } = auth

    if (!ROLES.includes(auth.role as Role)) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 })
    }
    const role = auth.role as Role
    // Signed in, but not yet part of a school: nothing is searchable.
    if (role === "USER") {
      return NextResponse.json({ error: "forbidden" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const query = (searchParams.get("q") || "").trim()
    if (query.length < MIN_QUERY_LENGTH) {
      return NextResponse.json({ error: "query_too_short" }, { status: 400 })
    }

    const kindsParam = searchParams.get("kinds")
    let kinds: SpotlightGroupKind[] | undefined
    if (kindsParam) {
      const requested = kindsParam
        .split(",")
        .map((kind) => kind.trim())
        .filter(Boolean)
      const unknown = requested.find(
        (kind) => !KINDS.includes(kind as SpotlightGroupKind)
      )
      if (unknown) {
        return NextResponse.json({ error: "invalid_kind" }, { status: 400 })
      }
      kinds = requested as SpotlightGroupKind[]
    }

    const lang = searchParams.get("lang") === "ar" ? "ar" : "en"
    const requestedLimit = Number(searchParams.get("limit"))
    const perKindLimit =
      Number.isFinite(requestedLimit) && requestedLimit > 0
        ? Math.min(Math.trunc(requestedLimit), MAX_PER_KIND)
        : DEFAULT_PER_KIND

    // Normalized before the predicates see it, exactly as the action does, so
    // "أحم" and "احم" reach the same rows on either side of the wire.
    const started = performance.now()
    const groups = await globalSearch({
      schoolId,
      userId,
      role,
      query: normalizeForMatch(query),
      locale: lang,
      kinds,
      perKindLimit,
    })
    const took = performance.now() - started

    return NextResponse.json({
      data: groups.map((group) => ({
        kind: group.kind,
        results: group.results.map((result) => ({
          id: result.id,
          label: result.label,
          secondary_label: result.secondaryLabel ?? null,
          // Carries no locale prefix; the app prepends its own.
          href: result.href,
          breadcrumb: result.breadcrumb ?? [],
          lang: result.lang ?? null,
        })),
      })),
      total: groups.reduce((sum, group) => sum + group.results.length, 0),
      took_ms: Math.round(took),
    })
  } catch (error) {
    console.error("[mobile/search] GET failed:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
