// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import {
  createSearchParamsCache,
  parseAsInteger,
  parseAsString,
} from "nuqs/server"

import { getSortingStateParser } from "@/components/table/lib/parsers"

// Explicit column-id allowlists for `?sort=` — must match (a) the columns
// actually rendered with a sort control in the corresponding *-columns.tsx
// and (b) fields buildOrderBy can pass straight through to Prisma (real
// scalar columns on the queried model, not computed/aliased display values
// like `applicantName`/`campaignName`/`offerStatus`). Without an allowlist,
// getSortingStateParser() accepts any arbitrary field name.
const CAMPAIGN_SORT_IDS: string[] = [
  "name",
  "academicYear",
  "status",
  "applicationFee",
  "totalSeats",
  "startDate",
  "endDate",
]

const APPLICATION_SORT_IDS: string[] = [
  "applicationNumber",
  "applyingForClass",
  "status",
  "meritRank",
  "submittedAt",
]

const MERIT_SORT_IDS: string[] = [
  "meritRank",
  "applicationNumber",
  "category",
  "meritScore",
  "entranceScore",
  "interviewScore",
  "status",
]

const ENROLLMENT_SORT_IDS: string[] = [
  "meritRank",
  "applicationNumber",
  "applyingForClass",
]

// Campaigns search params
export const campaignsSearchParams = createSearchParamsCache({
  page: parseAsInteger.withDefault(1),
  perPage: parseAsInteger.withDefault(20),
  name: parseAsString.withDefault(""),
  status: parseAsString.withDefault(""),
  academicYear: parseAsString.withDefault(""),
  sort: getSortingStateParser(CAMPAIGN_SORT_IDS).withDefault([]),
})

export type CampaignsSearch = Awaited<
  ReturnType<typeof campaignsSearchParams.parse>
>

// Applications search params
export const applicationsSearchParams = createSearchParamsCache({
  page: parseAsInteger.withDefault(1),
  perPage: parseAsInteger.withDefault(20),
  search: parseAsString.withDefault(""),
  campaignId: parseAsString.withDefault(""),
  status: parseAsString.withDefault(""),
  applyingForClass: parseAsString.withDefault(""),
  sort: getSortingStateParser(APPLICATION_SORT_IDS).withDefault([]),
})

export type ApplicationsSearch = Awaited<
  ReturnType<typeof applicationsSearchParams.parse>
>

// Merit list search params
export const meritSearchParams = createSearchParamsCache({
  page: parseAsInteger.withDefault(1),
  perPage: parseAsInteger.withDefault(20),
  search: parseAsString.withDefault(""),
  campaignId: parseAsString.withDefault(""),
  category: parseAsString.withDefault(""),
  status: parseAsString.withDefault(""),
  sort: getSortingStateParser(MERIT_SORT_IDS).withDefault([]),
})

export type MeritSearch = Awaited<ReturnType<typeof meritSearchParams.parse>>

// Enrollment search params
export const enrollmentSearchParams = createSearchParamsCache({
  page: parseAsInteger.withDefault(1),
  perPage: parseAsInteger.withDefault(20),
  search: parseAsString.withDefault(""),
  campaignId: parseAsString.withDefault(""),
  offerStatus: parseAsString.withDefault(""),
  feeStatus: parseAsString.withDefault(""),
  documentStatus: parseAsString.withDefault(""),
  sort: getSortingStateParser(ENROLLMENT_SORT_IDS).withDefault([]),
})

export type EnrollmentSearch = Awaited<
  ReturnType<typeof enrollmentSearchParams.parse>
>
