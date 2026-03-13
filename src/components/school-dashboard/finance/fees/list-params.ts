// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import {
  createSearchParamsCache,
  parseAsInteger,
  parseAsString,
} from "nuqs/server"

import { getSortingStateParser } from "@/components/table/lib/parsers"

export const feesSearchParams = createSearchParamsCache({
  page: parseAsInteger.withDefault(1),
  perPage: parseAsInteger.withDefault(20),
  search: parseAsString.withDefault(""),
  status: parseAsString.withDefault(""),
  academicYear: parseAsString.withDefault(""),
  sort: getSortingStateParser().withDefault([]),
})

export type FeesSearch = Awaited<ReturnType<typeof feesSearchParams.parse>>
