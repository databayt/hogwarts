// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import {
  createSearchParamsCache,
  parseAsInteger,
  parseAsString,
} from "nuqs/server"

import { getSortingStateParser } from "@/components/table/lib/parsers"

export const assignmentsSearchParams = createSearchParamsCache({
  page: parseAsInteger.withDefault(1),
  perPage: parseAsInteger.withDefault(20),
  // column filters (ids must match column ids)
  title: parseAsString.withDefault(""),
  type: parseAsString.withDefault(""),
  classId: parseAsString.withDefault(""),
  sort: getSortingStateParser().withDefault([]),
})

export type AssignmentsSearch = Awaited<
  ReturnType<typeof assignmentsSearchParams.parse>
>
