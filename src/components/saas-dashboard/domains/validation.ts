// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import {
  createSearchParamsCache,
  parseAsInteger,
  parseAsString,
} from "nuqs/server"

export const domainsSearchParams = createSearchParamsCache({
  page: parseAsInteger.withDefault(1),
  perPage: parseAsInteger.withDefault(10),
  search: parseAsString.withDefault(""),
  schoolName: parseAsString.withDefault(""),
  domain: parseAsString.withDefault(""),
  status: parseAsString.withDefault(""),
})

export type GetDomainsSearch = Awaited<
  ReturnType<typeof domainsSearchParams.parse>
>
