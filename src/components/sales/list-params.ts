import {
  createSearchParamsCache,
  parseAsArrayOf,
  parseAsInteger,
  parseAsString,
  parseAsStringEnum,
} from "nuqs/server"

import { LEAD_PRIORITY, LEAD_SOURCE, LEAD_STATUS, LEAD_TYPE } from "./constants"

export const salesSearchParams = createSearchParamsCache({
  page: parseAsInteger.withDefault(1),
  perPage: parseAsInteger.withDefault(20),
  search: parseAsString.withDefault(""),
  status: parseAsStringEnum(
    Object.keys(LEAD_STATUS) as (keyof typeof LEAD_STATUS)[]
  ),
  source: parseAsStringEnum(
    Object.keys(LEAD_SOURCE) as (keyof typeof LEAD_SOURCE)[]
  ),
  priority: parseAsStringEnum(
    Object.keys(LEAD_PRIORITY) as (keyof typeof LEAD_PRIORITY)[]
  ),
  leadType: parseAsStringEnum(
    Object.keys(LEAD_TYPE) as (keyof typeof LEAD_TYPE)[]
  ),
  sort: parseAsArrayOf(parseAsString),
})

export type SalesSearchParams = Awaited<
  ReturnType<typeof salesSearchParams.parse>
>
