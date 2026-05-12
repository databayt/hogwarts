// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import {
  createSearchParamsCache,
  parseAsInteger,
  parseAsString,
} from "nuqs/server"

/**
 * URL state shared across `/community` (hub) and `/community/[slug]` (detail).
 *
 * - `curriculum` defaults to `"us-k12"` (International US). The dropdown
 *   round-trips `Curriculum.code`, which matches the legacy string column
 *   on `Subject.curriculum` directly.
 * - `grade` is parsed as integer and defaults to `1`. Driven by the under-hero
 *   TabsNav (1..12). The "All" pill was dropped — landing on `/community`
 *   should always highlight a real grade so the visitor sees a focused result
 *   set instead of every subject across every grade.
 *
 * Server pages call `communitySearchParams.parse(searchParams)` to get a
 * typed snapshot. The client `<TabsNav>` and `<FilterBar>` write via
 * `useQueryStates` from `nuqs`.
 */
export const communitySearchParams = createSearchParamsCache({
  curriculum: parseAsString.withDefault("us-k12"),
  grade: parseAsInteger.withDefault(1),
})

export type CommunitySearchParams = ReturnType<
  typeof communitySearchParams.parse
>
