// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import {
  createSearchParamsCache,
  parseAsInteger,
  parseAsString,
  parseAsStringLiteral,
} from "nuqs/server"

export const staffSearchParams = {
  page: parseAsInteger.withDefault(1),
  perPage: parseAsInteger.withDefault(20),
  search: parseAsString.withDefault(""),
  sort: parseAsString.withDefault("createdAt"),
  order: parseAsStringLiteral(["asc", "desc"] as const).withDefault("desc"),
  employmentStatus: parseAsString,
  employmentType: parseAsString,
  departmentId: parseAsString,
}

export const staffSearchParamsCache = createSearchParamsCache(staffSearchParams)

export type StaffSearchParams = typeof staffSearchParams
