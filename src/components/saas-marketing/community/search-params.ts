// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import {
  createSearchParamsCache,
  parseAsInteger,
  parseAsString,
} from "nuqs/server"

/**
 * URL state shared across `/community` and every drill-down page.
 *
 * - `curriculum` is `Curriculum.code` ("national", "us-k12", ...) — DB-id-agnostic
 *   and matches the legacy string column on `Subject.curriculum`.
 * - `grade` is parsed as integer; non-numeric values become null and the filter
 *   is skipped.
 *
 * Server pages call `communitySearchParams.parse(searchParams)` to get a typed
 * snapshot. The client `<FilterBar>` reads/writes via `useQueryStates`.
 */
export const communitySearchParams = createSearchParamsCache({
  curriculum: parseAsString.withDefault(""),
  grade: parseAsInteger,
})

export type CommunitySearchParams = ReturnType<
  typeof communitySearchParams.parse
>
