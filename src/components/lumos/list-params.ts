// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import {
  createSearchParamsCache,
  parseAsInteger,
  parseAsString,
} from "nuqs/server"

import { getSortingStateParser } from "@/components/table/lib/parsers"

export const lumosCoursesSearchParams = createSearchParamsCache({
  page: parseAsInteger.withDefault(1),
  perPage: parseAsInteger.withDefault(12),
  search: parseAsString.withDefault(""),
  title: parseAsString.withDefault(""),
  category: parseAsString.withDefault(""),
  // Empty, NOT "1". A bare /lumos/courses is the browse view — one shelf per
  // grade — and any value here switches the page to the flat single-grade
  // grid. Defaulting to a grade made that browse state unreachable.
  level: parseAsString.withDefault(""),
  isPublished: parseAsString.withDefault(""),
  sort: getSortingStateParser().withDefault([]),
})

export type LumosCoursesSearch = Awaited<
  ReturnType<typeof lumosCoursesSearchParams.parse>
>
