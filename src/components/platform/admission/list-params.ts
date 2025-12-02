import { createSearchParamsCache, parseAsInteger, parseAsString } from 'nuqs/server'
import { getSortingStateParser } from '@/components/table/lib/parsers'

// Campaigns search params
export const campaignsSearchParams = createSearchParamsCache({
  page: parseAsInteger.withDefault(1),
  perPage: parseAsInteger.withDefault(20),
  name: parseAsString.withDefault(''),
  status: parseAsString.withDefault(''),
  academicYear: parseAsString.withDefault(''),
  sort: getSortingStateParser().withDefault([]),
})

export type CampaignsSearch = Awaited<ReturnType<typeof campaignsSearchParams.parse>>

// Applications search params
export const applicationsSearchParams = createSearchParamsCache({
  page: parseAsInteger.withDefault(1),
  perPage: parseAsInteger.withDefault(20),
  search: parseAsString.withDefault(''),
  campaignId: parseAsString.withDefault(''),
  status: parseAsString.withDefault(''),
  applyingForClass: parseAsString.withDefault(''),
  sort: getSortingStateParser().withDefault([]),
})

export type ApplicationsSearch = Awaited<ReturnType<typeof applicationsSearchParams.parse>>

// Merit list search params
export const meritSearchParams = createSearchParamsCache({
  page: parseAsInteger.withDefault(1),
  perPage: parseAsInteger.withDefault(20),
  campaignId: parseAsString.withDefault(''),
  category: parseAsString.withDefault(''),
  status: parseAsString.withDefault(''),
  sort: getSortingStateParser().withDefault([]),
})

export type MeritSearch = Awaited<ReturnType<typeof meritSearchParams.parse>>

// Enrollment search params
export const enrollmentSearchParams = createSearchParamsCache({
  page: parseAsInteger.withDefault(1),
  perPage: parseAsInteger.withDefault(20),
  campaignId: parseAsString.withDefault(''),
  offerStatus: parseAsString.withDefault(''),
  feeStatus: parseAsString.withDefault(''),
  documentStatus: parseAsString.withDefault(''),
  sort: getSortingStateParser().withDefault([]),
})

export type EnrollmentSearch = Awaited<ReturnType<typeof enrollmentSearchParams.parse>>
