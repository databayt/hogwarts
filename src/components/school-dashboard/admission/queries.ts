// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Query builders and utilities for admission module
 * Handles campaigns, applications, merit lists, and enrollment
 */

import type {
  AdmissionApplicationStatus,
  AdmissionChannel,
  AdmissionStatus,
} from "@prisma/client"
import { Prisma } from "@prisma/client"

import { db } from "@/lib/db"

// ============================================================================
// Types
// ============================================================================

export type CampaignListFilters = {
  name?: string
  status?: string
  academicYear?: string
}

export type ApplicationListFilters = {
  search?: string
  campaignId?: string
  status?: string
  applyingForClass?: string
  /** Admission channel; defaults to "PORTAL" (the reviewed pipeline). Pass a
   *  specific channel to filter, or "all" to include direct-admit/bulk rows. */
  channel?: string
}

export type MeritListFilters = {
  search?: string
  campaignId?: string
  category?: string
  status?: string
}

export type EnrollmentFilters = {
  search?: string
  campaignId?: string
  offerStatus?: string
  feeStatus?: string
  documentStatus?: string
  /** Admission channel; defaults to "PORTAL". Pass "all" to include direct-admit/bulk. */
  channel?: string
}

export type PaginationParams = {
  page: number
  perPage: number
}

export type SortParam = {
  id: string
  desc: boolean
}

// ============================================================================
// Select Types
// ============================================================================

export const campaignListSelect = {
  id: true,
  name: true,
  academicYear: true,
  startDate: true,
  endDate: true,
  status: true,
  totalSeats: true,
  applicationFee: true,
  createdAt: true,
  _count: {
    select: {
      applications: true,
    },
  },
} as const

export const applicationListSelect = {
  id: true,
  applicationNumber: true,
  firstName: true,
  lastName: true,
  email: true,
  phone: true,
  applyingForClass: true,
  status: true,
  meritScore: true,
  meritRank: true,
  applicationFeePaid: true,
  submittedAt: true,
  createdAt: true,
  campaign: {
    select: {
      id: true,
      name: true,
    },
  },
} as const

export const applicationDetailSelect = {
  id: true,
  schoolId: true,
  applicationNumber: true,
  lang: true,
  firstName: true,
  middleName: true,
  lastName: true,
  dateOfBirth: true,
  gender: true,
  nationality: true,
  religion: true,
  category: true,
  email: true,
  phone: true,
  alternatePhone: true,
  address: true,
  city: true,
  state: true,
  postalCode: true,
  country: true,
  fatherName: true,
  fatherOccupation: true,
  fatherPhone: true,
  fatherEmail: true,
  motherName: true,
  motherOccupation: true,
  motherPhone: true,
  motherEmail: true,
  guardianName: true,
  guardianRelation: true,
  guardianPhone: true,
  guardianEmail: true,
  previousSchool: true,
  previousClass: true,
  previousMarks: true,
  previousPercentage: true,
  achievements: true,
  applyingForClass: true,
  preferredStream: true,
  secondLanguage: true,
  thirdLanguage: true,
  documents: true,
  photoUrl: true,
  signatureUrl: true,
  status: true,
  submittedAt: true,
  reviewedAt: true,
  reviewedBy: true,
  reviewNotes: true,
  entranceScore: true,
  interviewScore: true,
  meritScore: true,
  meritRank: true,
  waitlistNumber: true,
  admissionOffered: true,
  offerDate: true,
  offerExpiryDate: true,
  offerAccepted: true,
  offerAcceptedAt: true,
  admissionConfirmed: true,
  confirmationDate: true,
  enrollmentNumber: true,
  applicationFeePaid: true,
  registrationFeePaid: true,
  registrationFeeAmount: true,
  registrationFeeMethod: true,
  registrationFeeReference: true,
  registrationFeeDate: true,
  paymentId: true,
  paymentDate: true,
  createdAt: true,
  updatedAt: true,
  campaign: {
    select: {
      id: true,
      name: true,
      academicYear: true,
    },
  },
} as const

// Fields pulled for the read-time AI-extraction merge in getApplicationDetail
// (see below) — deliberately narrow, no schoolId leak beyond the where-scope.
export const documentJobSelect = {
  fileUrl: true,
  status: true,
  resultData: true,
  confidence: true,
  jobType: true,
} as const

export type DocumentJobSummary = Prisma.DocumentProcessingJobGetPayload<{
  select: typeof documentJobSelect
}>

export type ApplicationDetail = Prisma.ApplicationGetPayload<{
  select: typeof applicationDetailSelect
}> & {
  /** AI document-processing jobs matched to this application's documents by
   *  fileUrl — merged in at read time (see getApplicationDetail). */
  documentJobs: DocumentJobSummary[]
}

// ============================================================================
// Query Builders
// ============================================================================

export function buildCampaignWhere(
  schoolId: string,
  filters: CampaignListFilters = {}
): Prisma.AdmissionCampaignWhereInput {
  const where: Prisma.AdmissionCampaignWhereInput = { schoolId }

  if (filters.name) {
    where.name = {
      contains: filters.name,
      mode: Prisma.QueryMode.insensitive,
    }
  }

  if (filters.status) {
    where.status = filters.status as AdmissionStatus
  }

  if (filters.academicYear) {
    where.academicYear = filters.academicYear
  }

  return where
}

export function buildApplicationWhere(
  schoolId: string,
  filters: ApplicationListFilters = {}
): Prisma.ApplicationWhereInput {
  const where: Prisma.ApplicationWhereInput = { schoolId }

  // Default the review surface to the reviewed pipeline (PORTAL). Direct-admit
  // and bulk-imported students are real admission records but stay out of the
  // Applications tab unless explicitly requested, so it isn't flooded.
  if (filters.channel !== "all") {
    where.channel = (filters.channel ?? "PORTAL") as AdmissionChannel
  }

  if (filters.search) {
    where.OR = [
      {
        firstName: {
          contains: filters.search,
          mode: Prisma.QueryMode.insensitive,
        },
      },
      {
        lastName: {
          contains: filters.search,
          mode: Prisma.QueryMode.insensitive,
        },
      },
      {
        email: { contains: filters.search, mode: Prisma.QueryMode.insensitive },
      },
      {
        applicationNumber: {
          contains: filters.search,
          mode: Prisma.QueryMode.insensitive,
        },
      },
    ]
  }

  if (filters.campaignId) {
    where.campaignId = filters.campaignId
  }

  if (filters.status) {
    where.status = filters.status as AdmissionApplicationStatus
  }

  if (filters.applyingForClass) {
    where.applyingForClass = filters.applyingForClass
  }

  return where
}

/**
 * Case-insensitive OR-contains search shared by the merit and enrollment
 * tabs. Broader than buildApplicationWhere's search (adds guardianName) —
 * merit/enrollment reviewers commonly search by the guardian's name.
 */
function buildApplicantSearchOr(
  search: string
): NonNullable<Prisma.ApplicationWhereInput["OR"]> {
  return [
    { firstName: { contains: search, mode: Prisma.QueryMode.insensitive } },
    { lastName: { contains: search, mode: Prisma.QueryMode.insensitive } },
    {
      guardianName: { contains: search, mode: Prisma.QueryMode.insensitive },
    },
    { email: { contains: search, mode: Prisma.QueryMode.insensitive } },
    {
      applicationNumber: {
        contains: search,
        mode: Prisma.QueryMode.insensitive,
      },
    },
  ]
}

// Statuses generateMeritList actually pools + ranks (see actions.ts
// generateMeritList). Applications that later moved to REJECTED/WITHDRAWN
// keep a stale meritRank from a prior ranking run — restrict the default
// view to the live pool; an explicit `filters.status` below overrides this
// for an audit look-up (e.g. reviewing rejected-but-ranked entries).
const MERIT_POOL_STATUSES: AdmissionApplicationStatus[] = [
  "SHORTLISTED",
  "SELECTED",
  "WAITLISTED",
]

export function buildMeritWhere(
  schoolId: string,
  filters: MeritListFilters = {}
): Prisma.ApplicationWhereInput {
  const where: Prisma.ApplicationWhereInput = {
    schoolId,
    meritRank: { not: null },
    status: { in: MERIT_POOL_STATUSES },
  }

  if (filters.search) {
    where.OR = buildApplicantSearchOr(filters.search)
  }

  if (filters.campaignId) {
    where.campaignId = filters.campaignId
  }

  if (filters.category) {
    where.category = filters.category
  }

  if (filters.status) {
    where.status = filters.status as AdmissionApplicationStatus
  }

  return where
}

export function buildEnrollmentWhere(
  schoolId: string,
  filters: EnrollmentFilters = {}
): Prisma.ApplicationWhereInput {
  const where: Prisma.ApplicationWhereInput = {
    schoolId,
    status: {
      in: ["SELECTED", "ADMITTED"] as AdmissionApplicationStatus[],
    },
  }

  // Direct-admit/bulk students are already ADMITTED and don't go through the
  // enrollment-confirmation step, so keep them out of this tab by default.
  if (filters.channel !== "all") {
    where.channel = (filters.channel ?? "PORTAL") as AdmissionChannel
  }

  if (filters.search) {
    where.OR = buildApplicantSearchOr(filters.search)
  }

  if (filters.campaignId) {
    where.campaignId = filters.campaignId
  }

  if (filters.offerStatus === "accepted") {
    where.admissionConfirmed = true
  } else if (filters.offerStatus === "pending") {
    where.admissionOffered = true
    where.admissionConfirmed = false
  }

  // Registration fee is the real-money fee paid to secure the seat; the
  // (free-application) applicationFeePaid flag is not what the enrollment
  // fee badge or money flow use — see Application.registrationFeePaid.
  if (filters.feeStatus === "paid") {
    where.registrationFeePaid = true
  } else if (filters.feeStatus === "unpaid") {
    where.registrationFeePaid = false
  }

  return where
}

export function buildOrderBy<T>(
  sortParams?: SortParam[],
  defaultSort?: Prisma.Enumerable<T>
): Prisma.Enumerable<T> {
  if (sortParams && Array.isArray(sortParams) && sortParams.length > 0) {
    return sortParams.map((s) => ({
      [s.id]: s.desc ? Prisma.SortOrder.desc : Prisma.SortOrder.asc,
    })) as any
  }
  return defaultSort || ([{ createdAt: Prisma.SortOrder.desc }] as any)
}

export function buildPagination(page: number, perPage: number) {
  return {
    skip: (page - 1) * perPage,
    take: perPage,
  }
}

// ============================================================================
// Query Functions
// ============================================================================

export async function getCampaignsList(
  schoolId: string,
  params: Partial<
    CampaignListFilters & PaginationParams & { sort?: SortParam[] }
  > = {}
) {
  const where = buildCampaignWhere(schoolId, params)
  const orderBy =
    buildOrderBy<Prisma.AdmissionCampaignOrderByWithRelationInput>(
      params.sort,
      [{ startDate: Prisma.SortOrder.desc }]
    )
  const { skip, take } = buildPagination(params.page ?? 1, params.perPage ?? 20)

  const [rows, count] = await Promise.all([
    db.admissionCampaign.findMany({
      where,
      orderBy,
      skip,
      take,
      select: campaignListSelect,
    }),
    db.admissionCampaign.count({ where }),
  ])

  return { rows, count }
}

export async function getCampaignDetail(schoolId: string, campaignId: string) {
  return db.admissionCampaign.findFirst({
    where: { id: campaignId, schoolId },
    include: {
      _count: {
        select: { applications: true },
      },
    },
  })
}

export async function getApplicationsList(
  schoolId: string,
  params: Partial<
    ApplicationListFilters & PaginationParams & { sort?: SortParam[] }
  > = {}
) {
  const where = buildApplicationWhere(schoolId, params)
  const orderBy = buildOrderBy<Prisma.ApplicationOrderByWithRelationInput>(
    params.sort,
    [{ createdAt: Prisma.SortOrder.desc }]
  )
  const { skip, take } = buildPagination(params.page ?? 1, params.perPage ?? 20)

  const [rows, count] = await Promise.all([
    db.application.findMany({
      where,
      orderBy,
      skip,
      take,
      select: applicationListSelect,
    }),
    db.application.count({ where }),
  ])

  return { rows, count }
}

/** Extract the `url` string of every entry in the raw `Application.documents`
 *  JSON blob, tolerating both legacy `{name,url}` and ProcessedDocument
 *  shapes. Never throws on malformed JSON — returns []. */
function extractDocumentUrls(documents: Prisma.JsonValue | null): string[] {
  if (!Array.isArray(documents)) return []
  const urls: string[] = []
  for (const entry of documents) {
    if (entry && typeof entry === "object" && !Array.isArray(entry)) {
      const url = (entry as Record<string, unknown>).url
      if (typeof url === "string" && url.length > 0) urls.push(url)
    }
  }
  return urls
}

export async function getApplicationDetail(
  schoolId: string,
  applicationId: string
): Promise<ApplicationDetail | null> {
  const application = await db.application.findFirst({
    where: { id: applicationId, schoolId },
    select: applicationDetailSelect,
  })

  if (!application) return null

  // Read-time merge: surface the latest AI extraction status/results from
  // DocumentProcessingJob without writing anything back (this is a read-only
  // query function — see ai/actions.ts getDocumentProcessingStatus for the
  // write-back variant, which currently has no callers and so never runs).
  // Jobs are matched to documents by fileUrl (each upload gets its own job).
  const documentUrls = extractDocumentUrls(application.documents)
  const documentJobs = documentUrls.length
    ? await db.documentProcessingJob.findMany({
        where: { schoolId, fileUrl: { in: documentUrls } },
        select: documentJobSelect,
      })
    : []

  return { ...application, documentJobs }
}

export async function getMeritList(
  schoolId: string,
  params: Partial<
    MeritListFilters & PaginationParams & { sort?: SortParam[] }
  > = {}
) {
  const where = buildMeritWhere(schoolId, params)
  const orderBy = buildOrderBy<Prisma.ApplicationOrderByWithRelationInput>(
    params.sort,
    [{ meritRank: Prisma.SortOrder.asc }]
  )
  const { skip, take } = buildPagination(params.page ?? 1, params.perPage ?? 20)

  const [rows, count] = await Promise.all([
    db.application.findMany({
      where,
      orderBy,
      skip,
      take,
      select: {
        ...applicationListSelect,
        category: true,
        entranceScore: true,
        interviewScore: true,
      },
    }),
    db.application.count({ where }),
  ])

  return { rows, count }
}

export async function getEnrollmentList(
  schoolId: string,
  params: Partial<
    EnrollmentFilters & PaginationParams & { sort?: SortParam[] }
  > = {}
) {
  const where = buildEnrollmentWhere(schoolId, params)
  const orderBy = buildOrderBy<Prisma.ApplicationOrderByWithRelationInput>(
    params.sort,
    [{ meritRank: Prisma.SortOrder.asc }]
  )
  const { skip, take } = buildPagination(params.page ?? 1, params.perPage ?? 20)

  const [rows, count] = await Promise.all([
    db.application.findMany({
      where,
      orderBy,
      skip,
      take,
      select: {
        ...applicationListSelect,
        admissionOffered: true,
        offerDate: true,
        offerExpiryDate: true,
        admissionConfirmed: true,
        confirmationDate: true,
        applicationFeePaid: true,
        paymentDate: true,
        documents: true,
        offerAccepted: true,
        registrationFeePaid: true,
      },
    }),
    db.application.count({ where }),
  ])

  return { rows, count }
}

// ============================================================================
// Stats Functions
// ============================================================================

export async function getAdmissionStats(schoolId: string) {
  const [
    totalApplications,
    pendingReview,
    shortlisted,
    admitted,
    activeCampaigns,
  ] = await Promise.all([
    db.application.count({ where: { schoolId } }),
    db.application.count({ where: { schoolId, status: "UNDER_REVIEW" } }),
    db.application.count({ where: { schoolId, status: "SHORTLISTED" } }),
    db.application.count({ where: { schoolId, status: "ADMITTED" } }),
    db.admissionCampaign.count({ where: { schoolId, status: "OPEN" } }),
  ])

  return {
    totalApplications,
    pendingReview,
    shortlisted,
    admitted,
    activeCampaigns,
  }
}

export async function getCampaignStats(schoolId: string, campaignId: string) {
  const [total, byStatus] = await Promise.all([
    db.application.count({ where: { schoolId, campaignId } }),
    db.application.groupBy({
      by: ["status"],
      where: { schoolId, campaignId },
      _count: true,
    }),
  ])

  return {
    total,
    byStatus: byStatus.reduce(
      (acc, curr) => {
        acc[curr.status] = curr._count
        return acc
      },
      {} as Record<string, number>
    ),
  }
}

export async function getMeritStats(schoolId: string, campaignId?: string) {
  const baseWhere = { schoolId, meritRank: { not: null } } as const
  const where = campaignId ? { ...baseWhere, campaignId } : baseWhere

  const [totalRanked, selected, waitlisted, avgScoreResult] = await Promise.all(
    [
      db.application.count({ where }),
      db.application.count({
        where: {
          ...where,
          status: "SELECTED" as AdmissionApplicationStatus,
        },
      }),
      db.application.count({
        where: {
          ...where,
          status: "WAITLISTED" as AdmissionApplicationStatus,
        },
      }),
      db.application.aggregate({
        where,
        _avg: { meritScore: true },
      }),
    ]
  )

  return {
    totalRanked,
    selected,
    waitlisted,
    avgScore: avgScoreResult._avg.meritScore?.toNumber() ?? 0,
  }
}

export async function getEnrollmentStats(
  schoolId: string,
  campaignId?: string
) {
  const baseWhere = {
    schoolId,
    status: {
      in: ["SELECTED", "ADMITTED"] as AdmissionApplicationStatus[],
    },
  }
  const where = campaignId ? { ...baseWhere, campaignId } : baseWhere

  const [
    awaitingEnrollment,
    enrolled,
    feesPending,
    documentsPending,
    pendingPlacement,
  ] = await Promise.all([
    db.application.count({ where: { ...where, admissionConfirmed: false } }),
    db.application.count({ where: { ...where, admissionConfirmed: true } }),
    db.application.count({ where: { ...where, applicationFeePaid: false } }),
    db.application.count({
      where: {
        ...where,
        OR: [
          { documents: { equals: Prisma.AnyNull } },
          { documents: { equals: [] } },
        ],
      },
    }),
    // Count admitted students without section placement
    // Query students directly: admitted applications whose student has no section
    db.student.count({
      where: {
        schoolId,
        sectionId: null,
        user: {
          applications: {
            some: {
              schoolId,
              admissionConfirmed: true,
              status: { in: ["SELECTED", "ADMITTED"] },
              ...(campaignId ? { campaignId } : {}),
            },
          },
        },
      },
    }),
  ])

  return {
    awaitingEnrollment,
    enrolled,
    feesPending,
    documentsPending,
    pendingPlacement,
  }
}

// ============================================================================
// Campaign Options for Filters
// ============================================================================

export async function getCampaignOptions(schoolId: string) {
  const campaigns = await db.admissionCampaign.findMany({
    where: { schoolId },
    select: { id: true, name: true, academicYear: true },
    orderBy: { startDate: Prisma.SortOrder.desc },
  })

  return campaigns.map((c) => ({
    value: c.id,
    label: `${c.name} (${c.academicYear})`,
  }))
}
