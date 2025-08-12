import { createSearchParamsCache, parseAsInteger, parseAsString } from 'nuqs/server'

export const announcementsSearchParams = createSearchParamsCache({
  page: parseAsInteger.withDefault(1),
  perPage: parseAsInteger.withDefault(10),
  search: parseAsString.withDefault(''),
  title: parseAsString.withDefault(''),
  scope: parseAsString.withDefault(''),
  published: parseAsString.withDefault(''), // 'true' | 'false' | ''
})

export type AnnouncementsSearch = Awaited<ReturnType<typeof announcementsSearchParams.parse>>



