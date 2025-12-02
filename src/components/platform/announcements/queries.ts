/**
 * Shared query builders and utilities for announcements
 * Consolidates query logic to eliminate duplication and improve maintainability
 *
 * Bilingual Support:
 * - All announcements have titleEn/titleAr and bodyEn/bodyAr fields
 * - Locale-based display is handled in the content/columns components
 * - Fallback logic: if preferred locale is missing, use the other language
 */

import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";

// ============================================================================
// Types
// ============================================================================

export type AnnouncementListFilters = {
  title?: string; // Searches both titleEn and titleAr
  scope?: string;
  published?: string;
  priority?: string;
  createdBy?: string;
  classId?: string;
  role?: string;
};

export type PaginationParams = {
  page: number;
  perPage: number;
};

export type SortParam = {
  id: string;
  desc: boolean;
};

export type AnnouncementSortParams = {
  sort?: SortParam[];
};

export type AnnouncementQueryParams = AnnouncementListFilters &
  PaginationParams &
  AnnouncementSortParams;

// Select types for different query contexts - bilingual fields
export const announcementListSelect = {
  id: true,
  titleEn: true,
  titleAr: true,
  scope: true,
  priority: true,
  published: true,
  createdAt: true,
  createdBy: true,
  pinned: true,
  featured: true,
  publishedAt: true,
  scheduledFor: true,
  expiresAt: true,
} as const;

export const announcementDetailSelect = {
  id: true,
  schoolId: true,
  titleEn: true,
  titleAr: true,
  bodyEn: true,
  bodyAr: true,
  scope: true,
  priority: true,
  classId: true,
  role: true,
  published: true,
  publishedAt: true,
  scheduledFor: true,
  expiresAt: true,
  pinned: true,
  featured: true,
  createdBy: true,
  createdAt: true,
  updatedAt: true,
  class: {
    select: {
      id: true,
      name: true,
    },
  },
  creator: {
    select: {
      id: true,
      username: true,
      email: true,
      image: true,
    },
  },
} as const;

// ============================================================================
// Query Builders
// ============================================================================

/**
 * Build where clause for announcement queries
 * @param schoolId - School ID for multi-tenant filtering
 * @param filters - Additional filters
 * @returns Prisma where input
 */
export function buildAnnouncementWhere(
  schoolId: string,
  filters: AnnouncementListFilters = {}
): Prisma.AnnouncementWhereInput {
  const where: Prisma.AnnouncementWhereInput = {
    schoolId,
  };

  // Text search - search in both English and Arabic titles
  if (filters.title) {
    where.OR = [
      {
        titleEn: {
          contains: filters.title,
          mode: Prisma.QueryMode.insensitive,
        },
      },
      {
        titleAr: {
          contains: filters.title,
          mode: Prisma.QueryMode.insensitive,
        },
      },
    ];
  }

  // Enum filters
  if (filters.scope) {
    where.scope = filters.scope as any;
  }

  if (filters.priority) {
    where.priority = filters.priority as any;
  }

  // Boolean filter
  if (filters.published) {
    where.published = filters.published === "true";
  }

  // Relation filters
  if (filters.createdBy) {
    where.createdBy = filters.createdBy;
  }

  if (filters.classId) {
    where.classId = filters.classId;
  }

  if (filters.role) {
    where.role = filters.role as any;
  }

  return where;
}

/**
 * Build order by clause for announcement queries
 * @param sortParams - Sort parameters
 * @returns Prisma order by input
 */
export function buildAnnouncementOrderBy(
  sortParams?: SortParam[]
): Prisma.AnnouncementOrderByWithRelationInput[] {
  if (sortParams && Array.isArray(sortParams) && sortParams.length > 0) {
    return sortParams.map((s) => ({
      [s.id]: s.desc ? Prisma.SortOrder.desc : Prisma.SortOrder.asc,
    }));
  }

  // Default: pinned first, then by created date descending
  return [
    { pinned: Prisma.SortOrder.desc },
    { createdAt: Prisma.SortOrder.desc },
  ];
}

/**
 * Build pagination params
 * @param page - Page number (1-indexed)
 * @param perPage - Items per page
 * @returns Object with skip and take
 */
export function buildPagination(page: number, perPage: number) {
  return {
    skip: (page - 1) * perPage,
    take: perPage,
  };
}

// ============================================================================
// Query Functions
// ============================================================================

/**
 * Get announcements list with filtering, sorting, and pagination
 * @param schoolId - School ID for multi-tenant filtering
 * @param params - Query parameters
 * @returns Promise with announcements and total count
 */
export async function getAnnouncementsList(
  schoolId: string,
  params: Partial<AnnouncementQueryParams> = {}
) {
  const where = buildAnnouncementWhere(schoolId, params);
  const orderBy = buildAnnouncementOrderBy(params.sort);
  const { skip, take } = buildPagination(
    params.page ?? 1,
    params.perPage ?? 10
  );

  // Execute queries in parallel for better performance
  const [rows, count] = await Promise.all([
    db.announcement.findMany({
      where,
      orderBy,
      skip,
      take,
      select: announcementListSelect,
    }),
    db.announcement.count({ where }),
  ]);

  return { rows, count };
}

/**
 * Get a single announcement by ID with full details
 * @param schoolId - School ID for multi-tenant filtering
 * @param announcementId - Announcement ID
 * @returns Promise with announcement or null
 */
export async function getAnnouncementDetail(
  schoolId: string,
  announcementId: string
) {
  return db.announcement.findFirst({
    where: {
      id: announcementId,
      schoolId,
    },
    select: announcementDetailSelect,
  });
}

/**
 * Get announcements for a specific class
 * @param schoolId - School ID
 * @param classId - Class ID
 * @param includeSchoolWide - Include school-wide announcements
 * @returns Promise with announcements
 */
export async function getClassAnnouncements(
  schoolId: string,
  classId: string,
  includeSchoolWide = true
) {
  const where: Prisma.AnnouncementWhereInput = {
    schoolId,
    published: true,
    OR: [
      { scope: "class", classId },
      ...(includeSchoolWide ? [{ scope: "school" as const }] : []),
    ],
  };

  return db.announcement.findMany({
    where,
    orderBy: buildAnnouncementOrderBy(),
    select: announcementListSelect,
  });
}

/**
 * Get announcements for a specific role
 * @param schoolId - School ID
 * @param role - User role
 * @param includeSchoolWide - Include school-wide announcements
 * @returns Promise with announcements
 */
export async function getRoleAnnouncements(
  schoolId: string,
  role: string,
  includeSchoolWide = true
) {
  const where: any = {
    schoolId,
    published: true,
    OR: [
      { scope: "role", role },
      ...(includeSchoolWide ? [{ scope: "school" as const }] : []),
    ],
  };

  return db.announcement.findMany({
    where,
    orderBy: buildAnnouncementOrderBy(),
    select: announcementListSelect,
  });
}

/**
 * Get scheduled announcements that need to be published
 * @param schoolId - School ID (optional, for all schools if omitted)
 * @returns Promise with announcements ready to publish
 */
export async function getScheduledAnnouncementsToPublish(schoolId?: string) {
  const where: Prisma.AnnouncementWhereInput = {
    ...(schoolId && { schoolId }),
    published: false,
    scheduledFor: {
      lte: new Date(),
    },
  };

  return db.announcement.findMany({
    where,
    select: {
      id: true,
      schoolId: true,
      titleEn: true,
      titleAr: true,
      scheduledFor: true,
    },
  });
}

/**
 * Get expired announcements that should be archived
 * @param schoolId - School ID (optional, for all schools if omitted)
 * @returns Promise with expired announcements
 */
export async function getExpiredAnnouncements(schoolId?: string) {
  const where: Prisma.AnnouncementWhereInput = {
    ...(schoolId && { schoolId }),
    published: true,
    expiresAt: {
      lte: new Date(),
    },
  };

  return db.announcement.findMany({
    where,
    select: {
      id: true,
      schoolId: true,
      titleEn: true,
      titleAr: true,
      expiresAt: true,
    },
  });
}

/**
 * Get pinned announcements for a school
 * @param schoolId - School ID
 * @returns Promise with pinned announcements
 */
export async function getPinnedAnnouncements(schoolId: string) {
  return db.announcement.findMany({
    where: {
      schoolId,
      published: true,
      pinned: true,
    },
    orderBy: [
      { featured: Prisma.SortOrder.desc },
      { createdAt: Prisma.SortOrder.desc },
    ],
    select: announcementListSelect,
    take: 5, // Limit to top 5 pinned announcements
  });
}

/**
 * Get announcement statistics for a school
 * @param schoolId - School ID
 * @returns Promise with statistics
 */
export async function getAnnouncementStats(schoolId: string) {
  const [total, published, scheduled, expired] = await Promise.all([
    db.announcement.count({ where: { schoolId } }),
    db.announcement.count({ where: { schoolId, published: true } }),
    db.announcement.count({
      where: {
        schoolId,
        published: false,
        scheduledFor: { gte: new Date() },
      },
    }),
    db.announcement.count({
      where: {
        schoolId,
        published: true,
        expiresAt: { lte: new Date() },
      },
    }),
  ]);

  return {
    total,
    published,
    scheduled,
    expired,
    draft: total - published - scheduled,
  };
}

// ============================================================================
// Bulk Query Functions
// ============================================================================

/**
 * Check if multiple announcements exist and belong to school
 * @param schoolId - School ID
 * @param announcementIds - Array of announcement IDs
 * @returns Promise with array of found IDs
 */
export async function verifyAnnouncementOwnership(
  schoolId: string,
  announcementIds: string[]
) {
  const announcements = await db.announcement.findMany({
    where: {
      id: { in: announcementIds },
      schoolId,
    },
    select: {
      id: true,
    },
  });

  return announcements.map((a) => a.id);
}

/**
 * Get announcements by multiple IDs
 * @param schoolId - School ID
 * @param announcementIds - Array of announcement IDs
 * @returns Promise with announcements
 */
export async function getAnnouncementsByIds(
  schoolId: string,
  announcementIds: string[]
) {
  return db.announcement.findMany({
    where: {
      id: { in: announcementIds },
      schoolId,
    },
    select: announcementDetailSelect,
  });
}

// ============================================================================
// Locale Helpers
// ============================================================================

/**
 * Get localized title with fallback
 * @param announcement - Announcement with titleEn and titleAr
 * @param locale - Current locale ('en' or 'ar')
 * @returns Title in preferred language or fallback
 */
export function getLocalizedTitle(
  announcement: { titleEn: string | null; titleAr: string | null },
  locale: string
): string {
  if (locale === 'ar') {
    return announcement.titleAr || announcement.titleEn || '';
  }
  return announcement.titleEn || announcement.titleAr || '';
}

/**
 * Get localized body with fallback
 * @param announcement - Announcement with bodyEn and bodyAr
 * @param locale - Current locale ('en' or 'ar')
 * @returns Body in preferred language or fallback
 */
export function getLocalizedBody(
  announcement: { bodyEn: string | null; bodyAr: string | null },
  locale: string
): string {
  if (locale === 'ar') {
    return announcement.bodyAr || announcement.bodyEn || '';
  }
  return announcement.bodyEn || announcement.bodyAr || '';
}
