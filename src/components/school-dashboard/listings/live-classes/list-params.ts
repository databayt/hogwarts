// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import {
  createSearchParamsCache,
  parseAsInteger,
  parseAsString,
} from "nuqs/server"

import { getSortingStateParser } from "@/components/table/lib/parsers"

export const liveClassesSearchParams = createSearchParamsCache({
  page: parseAsInteger.withDefault(1),
  perPage: parseAsInteger.withDefault(20),
  // column filters (ids must match column ids)
  title: parseAsString.withDefault(""),
  status: parseAsString.withDefault(""),
  sort: getSortingStateParser().withDefault([]),
})

export type LiveClassesSearch = Awaited<
  ReturnType<typeof liveClassesSearchParams.parse>
>
