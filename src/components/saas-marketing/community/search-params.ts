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
 * - `grade` is parsed as integer. Driven by the under-hero TabsNav (1..12).
 *   Absent / non-numeric → no grade filter (the "All" pill).
 *
 * Server pages call `communitySearchParams.parse(searchParams)` to get a
 * typed snapshot. The client `<TabsNav>` and `<FilterBar>` write via
 * `useQueryStates` from `nuqs`.
 */
export const communitySearchParams = createSearchParamsCache({
  curriculum: parseAsString.withDefault("us-k12"),
  grade: parseAsInteger,
})

export type CommunitySearchParams = ReturnType<
  typeof communitySearchParams.parse
>
