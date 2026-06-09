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
 * - `curriculum` defaults to `"US"` (United States). The dropdown round-trips
 *   `Curriculum.code` (canonical: ISO country code or `{body}-{programme}`),
 *   which matches the `Subject.curriculum` string column directly.
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
  curriculum: parseAsString.withDefault("US"),
  grade: parseAsInteger.withDefault(1),
})

export type CommunitySearchParams = ReturnType<
  typeof communitySearchParams.parse
>
