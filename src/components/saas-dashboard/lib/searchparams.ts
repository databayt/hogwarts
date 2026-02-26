// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import {
  createSearchParamsCache,
  createSerializer,
  parseAsInteger,
  parseAsString,
} from "nuqs/server"

export const searchParams = {
  page: parseAsInteger.withDefault(1),
  perPage: parseAsInteger.withDefault(10),
  name: parseAsString,
  gender: parseAsString,
  category: parseAsString,
  // advanced filter
  // filters: getFiltersStateParser().withDefault([]),
  // joinOperator: parseAsStringEnum(['and', 'or']).withDefault('and')
}

export const searchParamsCache = createSearchParamsCache(searchParams)
export const serialize = createSerializer(searchParams)
