import {
  createSearchParamsCache,
  parseAsInteger,
  parseAsString,
} from "nuqs/server"

import { getSortingStateParser } from "@/components/table/lib/parsers"

export const announcementsSearchParams = createSearchParamsCache({
  page: parseAsInteger.withDefault(1),
  perPage: parseAsInteger.withDefault(20),
  // column filters (ids must match column ids)
  title: parseAsString.withDefault(""),
  scope: parseAsString.withDefault(""),
  published: parseAsString.withDefault(""),
  sort: getSortingStateParser().withDefault([]),
})

export type AnnouncementsSearch = Awaited<
  ReturnType<typeof announcementsSearchParams.parse>
>
