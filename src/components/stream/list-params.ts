// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import {
  createSearchParamsCache,
  parseAsInteger,
  parseAsString,
} from "nuqs/server"

import { getSortingStateParser } from "@/components/table/lib/parsers"

export const streamCoursesSearchParams = createSearchParamsCache({
  page: parseAsInteger.withDefault(1),
  perPage: parseAsInteger.withDefault(12),
  title: parseAsString.withDefault(""),
  category: parseAsString.withDefault(""),
  level: parseAsString.withDefault("1"),
  isPublished: parseAsString.withDefault(""),
  sort: getSortingStateParser().withDefault([]),
})

export type StreamCoursesSearch = Awaited<
  ReturnType<typeof streamCoursesSearchParams.parse>
>
