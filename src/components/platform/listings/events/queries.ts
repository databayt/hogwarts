/**
 * Query builders for Events module
 * Pattern follows grades module for consistency
 *
 * Centralizes query logic for:
 * - Filtering, sorting, pagination
 * - Select objects (list vs detail)
 * - Multi-tenant safety (schoolId)
 */

import { Prisma } from "@prisma/client"

import { db } from "@/lib/db"

// ============================================================================
// Types
// ============================================================================

export type EventListFilters = {
  search?: string
  eventType?:
    | "ACADEMIC"
    | "SPORTS"
    | "CULTURAL"
    | "PARENT_MEETING"
    | "CELEBRATION"
    | "WORKSHOP"
    | "OTHER"
  status?: "PLANNED" | "ONGOING" | "COMPLETED" | "CANCELLED" | "POSTPONED"
  isPublic?: boolean
  dateFrom?: Date
  dateTo?: Date
}

export type PaginationParams = {
  page: number
  perPage: number
}

export type SortParam = {
  id: string
  desc?: boolean
}

export type EventQueryParams = EventListFilters &
  PaginationParams & {
    sort?: SortParam[]
  }

// ============================================================================
// Select Objects
// ============================================================================

/** Minimal fields for list display */
export const eventListSelect = {
  id: true,
  title: true,
  eventType: true,
  eventDate: true,
  startTime: true,
  endTime: true,
  location: true,
  organizer: true,
  targetAudience: true,
  maxAttendees: true,
  currentAttendees: true,
  status: true,
  isPublic: true,
  createdAt: true,
} as const

/** Full fields for detail/edit */
export const eventDetailSelect = {
  id: true,
  schoolId: true,
  title: true,
  description: true,
  eventType: true,
  eventDate: true,
  startTime: true,
  endTime: true,
  location: true,
  organizer: true,
  targetAudience: true,
  maxAttendees: true,
  currentAttendees: true,
  status: true,
  isPublic: true,
  registrationRequired: true,
  notes: true,
  createdAt: true,
  updatedAt: true,
} as const

// ============================================================================
// Query Builders
// ============================================================================

/**
 * Build where clause for event queries
 * @param schoolId - School ID for multi-tenant filtering (REQUIRED)
 * @param filters - Additional filters
 */
export function buildEventWhere(
  schoolId: string,
  filters: EventListFilters = {}
): Prisma.EventWhereInput {
  const where: Prisma.EventWhereInput = { schoolId }

  // Search by title or organizer
  if (filters.search) {
    where.OR = [
      {
        title: {
          contains: filters.search,
          mode: Prisma.QueryMode.insensitive,
        },
      },
      {
        organizer: {
          contains: filters.search,
          mode: Prisma.QueryMode.insensitive,
        },
      },
      {
        location: {
          contains: filters.search,
          mode: Prisma.QueryMode.insensitive,
        },
      },
    ]
  }

  // Event type filter
  if (filters.eventType) {
    where.eventType = filters.eventType
  }

  // Status filter
  if (filters.status) {
    where.status = filters.status
  }

  // Public/private filter
  if (filters.isPublic !== undefined) {
    where.isPublic = filters.isPublic
  }

  // Date range filter
  if (filters.dateFrom || filters.dateTo) {
    where.eventDate = {}
    if (filters.dateFrom) {
      where.eventDate.gte = filters.dateFrom
    }
    if (filters.dateTo) {
      where.eventDate.lte = filters.dateTo
    }
  }

  return where
}

/**
 * Build order by clause
 */
export function buildEventOrderBy(
  sortParams?: SortParam[]
): Prisma.EventOrderByWithRelationInput[] {
  if (sortParams?.length) {
    return sortParams.map((s) => ({
      [s.id]: s.desc ? Prisma.SortOrder.desc : Prisma.SortOrder.asc,
    }))
  }
  return [{ eventDate: Prisma.SortOrder.asc }]
}

/**
 * Build pagination params
 */
export function buildPagination(page: number, perPage: number) {
  return {
    skip: (page - 1) * perPage,
    take: perPage,
  }
}

// ============================================================================
// Query Functions
// ============================================================================

/**
 * Get events list with filtering, sorting, pagination
 */
export async function getEventList(
  schoolId: string,
  params: Partial<EventQueryParams> = {}
) {
  const where = buildEventWhere(schoolId, params)
  const orderBy = buildEventOrderBy(params.sort)
  const { skip, take } = buildPagination(params.page ?? 1, params.perPage ?? 20)

  const [rows, count] = await Promise.all([
    db.event.findMany({
      where,
      orderBy,
      skip,
      take,
      select: eventListSelect,
    }),
    db.event.count({ where }),
  ])

  return { rows, count }
}

/**
 * Get single event by ID
 */
export async function getEventDetail(schoolId: string, id: string) {
  return db.event.findFirst({
    where: { id, schoolId },
    select: eventDetailSelect,
  })
}

/**
 * Get upcoming events
 */
export async function getUpcomingEvents(schoolId: string, limit = 5) {
  const now = new Date()

  return db.event.findMany({
    where: {
      schoolId,
      eventDate: { gte: now },
      status: { in: ["PLANNED", "ONGOING"] },
    },
    orderBy: { eventDate: "asc" },
    take: limit,
    select: eventListSelect,
  })
}

/**
 * Get events for a specific date
 */
export async function getDayEvents(schoolId: string, date: Date) {
  const startOfDay = new Date(date)
  startOfDay.setHours(0, 0, 0, 0)
  const endOfDay = new Date(date)
  endOfDay.setHours(23, 59, 59, 999)

  return db.event.findMany({
    where: {
      schoolId,
      eventDate: {
        gte: startOfDay,
        lte: endOfDay,
      },
    },
    orderBy: { startTime: "asc" },
    select: eventListSelect,
  })
}

/**
 * Get public events (for calendar display)
 */
export async function getPublicEvents(schoolId: string) {
  return db.event.findMany({
    where: {
      schoolId,
      isPublic: true,
      status: { not: "CANCELLED" },
    },
    orderBy: { eventDate: "asc" },
    select: eventListSelect,
  })
}

/**
 * Check if events exist and belong to school
 */
export async function verifyEventOwnership(
  schoolId: string,
  eventIds: string[]
) {
  const events = await db.event.findMany({
    where: {
      id: { in: eventIds },
      schoolId,
    },
    select: { id: true },
  })

  return events.map((e) => e.id)
}

// ============================================================================
// Helpers
// ============================================================================

/**
 * Format event time range
 */
export function formatEventTime(event: {
  startTime: string
  endTime: string
}): string {
  return `${event.startTime} - ${event.endTime}`
}

/**
 * Get event type display label
 */
export function getEventTypeLabel(
  eventType:
    | "ACADEMIC"
    | "SPORTS"
    | "CULTURAL"
    | "PARENT_MEETING"
    | "CELEBRATION"
    | "WORKSHOP"
    | "OTHER"
): string {
  const labels: Record<string, string> = {
    ACADEMIC: "Academic",
    SPORTS: "Sports",
    CULTURAL: "Cultural",
    PARENT_MEETING: "Parent Meeting",
    CELEBRATION: "Celebration",
    WORKSHOP: "Workshop",
    OTHER: "Other",
  }
  return labels[eventType] || eventType
}

/**
 * Get event status color
 */
export function getEventStatusColor(
  status: "PLANNED" | "ONGOING" | "COMPLETED" | "CANCELLED" | "POSTPONED"
): string {
  switch (status) {
    case "PLANNED":
      return "blue"
    case "ONGOING":
      return "yellow"
    case "COMPLETED":
      return "green"
    case "CANCELLED":
      return "red"
    case "POSTPONED":
      return "orange"
    default:
      return "gray"
  }
}

/**
 * Get attendance status text
 */
export function getAttendanceStatus(
  current: number,
  max: number | null
): string {
  if (!max) return `${current} attending`
  return `${current}/${max}`
}
