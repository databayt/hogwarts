// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import {
  createSearchParamsCache,
  parseAsInteger,
  parseAsString,
} from "nuqs/server"

import { getSortingStateParser } from "@/components/table/lib/parsers"

export const classesSearchParams = createSearchParamsCache({
  page: parseAsInteger.withDefault(1),
  perPage: parseAsInteger.withDefault(20),
  // column filters (ids must match column ids)
  name: parseAsString.withDefault(""),
  subjectId: parseAsString.withDefault(""),
  teacherId: parseAsString.withDefault(""),
  termId: parseAsString.withDefault(""),
  sort: getSortingStateParser().withDefault([]),
})

export type ClassesSearch = Awaited<
  ReturnType<typeof classesSearchParams.parse>
>
