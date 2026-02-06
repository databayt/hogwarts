/**
 * Read tracking system for announcements
 * Tracks user engagement and provides analytics
 */

"use server"

import { revalidateTag } from "next/cache"
import { auth } from "@/auth"
import { z } from "zod"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"

import type { ActionResponse } from "./actions"

// ============================================================================
// Types
// ============================================================================

export type ReadStatus = {
  isRead: boolean
  readAt: Date | null
  totalReads: number
  readPercentage: number
}

export type AnnouncementReadStats = {
  id: string
  title: string
  totalReads: number
  uniqueReaders: number
  readPercentage: number
  lastReadAt: Date | null
}

// ============================================================================
// Mutations
// ============================================================================

/**
 * Mark an announcement as read by the current user
 * @param input - Announcement ID
 * @returns Action response
 */
export async function markAnnouncementAsRead(input: {
  announcementId: string
}): Promise<ActionResponse<void>> {
  try {
    // Get authentication context
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "Not authenticated" }
    }

    const userId = session.user.id

    // Get tenant context
    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return { success: false, error: "Missing school context" }
    }

    // Parse and validate input
    const { announcementId } = z
      .object({ announcementId: z.string().min(1) })
      .parse(input)

    // Verify announcement exists and belongs to school
    const announcement = await db.announcement.findFirst({
      where: { id: announcementId, schoolId },
      select: { id: true },
    })

    if (!announcement) {
      return { success: false, error: "Announcement not found" }
    }

    // Create or update read record (upsert for idempotency)
    await db.announcementRead.upsert({
      where: {
        announcementId_userId: {
          announcementId,
          userId,
        },
      },
      create: {
        announcementId,
        userId,
        schoolId,
        readAt: new Date(),
      },
      update: {
        readAt: new Date(),
      },
    })

    // Invalidate cache for read status
    revalidateTag(`announcement-reads-${announcementId}`, "max")
    revalidateTag(`user-reads-${userId}`, "max")

    return { success: true, data: undefined }
  } catch (error) {
    console.error("[markAnnouncementAsRead] Error:", error, {
      input,
      timestamp: new Date().toISOString(),
    })

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: `Validation error: ${error.issues.map((e) => e.message).join(", ")}`,
      }
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to mark as read",
    }
  }
}

/**
 * Mark multiple announcements as read (bulk operation)
 * @param input - Array of announcement IDs
 * @returns Action response with count of marked announcements
 */
export async function markMultipleAnnouncementsAsRead(input: {
  announcementIds: string[]
}): Promise<ActionResponse<{ count: number }>> {
  try {
    // Get authentication context
    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "Not authenticated" }
    }

    const userId = session.user.id

    // Get tenant context
    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return { success: false, error: "Missing school context" }
    }

    // Parse and validate input
    const { announcementIds } = z
      .object({
        announcementIds: z.array(z.string().min(1)).min(1).max(100),
      })
      .parse(input)

    // Verify announcements exist and belong to school
    const announcements = await db.announcement.findMany({
      where: {
        id: { in: announcementIds },
        schoolId,
      },
      select: { id: true },
    })

    const validIds = announcements.map((a) => a.id)

    if (validIds.length === 0) {
      return { success: false, error: "No valid announcements found" }
    }

    // Create read records for all announcements
    const now = new Date()
    const readRecords = validIds.map((announcementId) => ({
      announcementId,
      userId,
      schoolId,
      readAt: now,
    }))

    // Use createMany with skipDuplicates for idempotency
    const result = await db.announcementRead.createMany({
      data: readRecords,
      skipDuplicates: true,
    })

    // Invalidate cache for all affected announcements
    validIds.forEach((id) => {
      revalidateTag(`announcement-reads-${id}`, "max")
    })
    revalidateTag(`user-reads-${userId}`, "max")

    return { success: true, data: { count: result.count } }
  } catch (error) {
    console.error("[markMultipleAnnouncementsAsRead] Error:", error, {
      input,
      timestamp: new Date().toISOString(),
    })

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: `Validation error: ${error.issues.map((e) => e.message).join(", ")}`,
      }
    }

    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to mark announcements as read",
    }
  }
}

// ============================================================================
// Queries
// ============================================================================

/**
 * Get read status for a specific announcement and user
 * @param announcementId - Announcement ID
 * @param userId - User ID
 * @returns Read status information
 */
export async function getAnnouncementReadStatus(
  announcementId: string,
  userId: string
): Promise<ReadStatus> {
  const readRecord = await db.announcementRead.findUnique({
    where: {
      announcementId_userId: {
        announcementId,
        userId,
      },
    },
    select: {
      readAt: true,
    },
  })

  const totalReads = await db.announcementRead.count({
    where: { announcementId },
  })

  // Calculate read percentage (would need total users in scope for accurate percentage)
  // For now, just return the count
  return {
    isRead: !!readRecord,
    readAt: readRecord?.readAt || null,
    totalReads,
    readPercentage: 0, // TODO: Calculate based on target audience size
  }
}

/**
 * Get unread announcement count for a user
 * @param userId - User ID
 * @param schoolId - School ID
 * @returns Number of unread announcements
 */
export async function getUnreadAnnouncementCount(
  userId: string,
  schoolId: string
): Promise<number> {
  // Get all published announcements
  const totalPublished = await db.announcement.count({
    where: {
      schoolId,
      published: true,
    },
  })

  // Get read announcements count
  const readCount = await db.announcementRead.count({
    where: {
      userId,
      announcement: {
        schoolId,
        published: true,
      },
    },
  })

  return totalPublished - readCount
}

/**
 * Get read statistics for an announcement
 * @param announcementId - Announcement ID
 * @returns Read statistics
 */
export async function getAnnouncementReadStatistics(
  announcementId: string
): Promise<ActionResponse<AnnouncementReadStats>> {
  try {
    // Get announcement details
    const announcement = await db.announcement.findUnique({
      where: { id: announcementId },
      select: {
        id: true,
        title: true,
        lang: true,
        schoolId: true,
        scope: true,
        classId: true,
        role: true,
      },
    })

    if (!announcement) {
      return { success: false, error: "Announcement not found" }
    }

    // Get read records
    const reads = await db.announcementRead.findMany({
      where: { announcementId },
      select: {
        userId: true,
        readAt: true,
      },
      orderBy: {
        readAt: "desc",
      },
    })

    const uniqueReaders = new Set(reads.map((r) => r.userId)).size
    const lastReadAt = reads.length > 0 ? reads[0].readAt : null

    // TODO: Calculate read percentage based on target audience
    // For school-wide: total users in school
    // For class: students in class
    // For role: users with that role
    const readPercentage = 0

    return {
      success: true,
      data: {
        id: announcement.id,
        title: announcement.title || "",
        totalReads: reads.length,
        uniqueReaders,
        readPercentage,
        lastReadAt,
      },
    }
  } catch (error) {
    console.error("[getAnnouncementReadStatistics] Error:", error, {
      announcementId,
      timestamp: new Date().toISOString(),
    })

    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to get read statistics",
    }
  }
}

/**
 * Get list of users who have read an announcement
 * @param announcementId - Announcement ID
 * @param limit - Maximum number of users to return
 * @returns List of users with read timestamps
 */
export async function getAnnouncementReaders(
  announcementId: string,
  limit = 50
): Promise<
  ActionResponse<
    Array<{
      userId: string
      readAt: Date
      username: string | null
      email: string | null
    }>
  >
> {
  try {
    const readers = await db.announcementRead.findMany({
      where: { announcementId },
      select: {
        userId: true,
        readAt: true,
        user: {
          select: {
            username: true,
            email: true,
          },
        },
      },
      orderBy: {
        readAt: "desc",
      },
      take: limit,
    })

    const mapped = readers.map((r) => ({
      userId: r.userId,
      readAt: r.readAt,
      username: r.user.username,
      email: r.user.email,
    }))

    return { success: true, data: mapped }
  } catch (error) {
    console.error("[getAnnouncementReaders] Error:", error, {
      announcementId,
      timestamp: new Date().toISOString(),
    })

    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to get readers",
    }
  }
}

/**
 * Get user's read announcement IDs
 * @param userId - User ID
 * @param schoolId - School ID
 * @returns Set of read announcement IDs
 */
export async function getUserReadAnnouncementIds(
  userId: string,
  schoolId: string
): Promise<Set<string>> {
  const reads = await db.announcementRead.findMany({
    where: {
      userId,
      announcement: {
        schoolId,
      },
    },
    select: {
      announcementId: true,
    },
  })

  return new Set(reads.map((r) => r.announcementId))
}
