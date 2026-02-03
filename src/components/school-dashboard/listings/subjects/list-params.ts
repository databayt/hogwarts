import {
  createSearchParamsCache,
  parseAsInteger,
  parseAsString,
} from "nuqs/server"

import { getSortingStateParser } from "@/components/table/lib/parsers"

export const subjectsSearchParams = createSearchParamsCache({
  page: parseAsInteger.withDefault(1),
  perPage: parseAsInteger.withDefault(20),
  // column filters (ids must match column ids)
  subjectName: parseAsString.withDefault(""),
  departmentId: parseAsString.withDefault(""),
  sort: getSortingStateParser().withDefault([]),
})

export type SubjectsSearch = Awaited<
  ReturnType<typeof subjectsSearchParams.parse>
>
