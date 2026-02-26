// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import {
  createSearchParamsCache,
  parseAsInteger,
  parseAsString,
} from "nuqs/server"

export const billingSearchParams = createSearchParamsCache({
  page: parseAsInteger.withDefault(1),
  perPage: parseAsInteger.withDefault(10),
  search: parseAsString.withDefault(""),
  number: parseAsString.withDefault(""),
  tenantName: parseAsString.withDefault(""),
  status: parseAsString.withDefault(""),
})

export type GetBillingSearch = Awaited<
  ReturnType<typeof billingSearchParams.parse>
>
