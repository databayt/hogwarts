import { createSearchParamsCache, parseAsInteger, parseAsString } from 'nuqs/server'
import { getSortingStateParser } from '@/components/table/lib/parsers'

export const teachersSearchParams = createSearchParamsCache({
  page: parseAsInteger.withDefault(1),
  perPage: parseAsInteger.withDefault(20),
  // column filters (ids must match column ids)
  name: parseAsString.withDefault(''),
  emailAddress: parseAsString.withDefault(''),
  status: parseAsString.withDefault(''),
  sort: getSortingStateParser().withDefault([]),
})

export type TeachersSearch = Awaited<ReturnType<typeof teachersSearchParams.parse>>


