/**
 * Bulk operations for announcements
 * Enables efficient management of multiple announcements at once
 */

"use server"

import { revalidatePath, revalidateTag } from "next/cache"
import { auth } from "@/auth"
import type { Prisma } from "@prisma/client"
import { z } from "zod"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"

import type { ActionResponse } from "./actions"
import { assertAnnouncementPermission, getAuthContext } from "./authorization"
import { verifyAnnouncementOwnership } from "./queries"

// ============================================================================
// Constants
// ============================================================================

const ANNOUNCEMENTS_PATH = "/announcements"

// ============================================================================
// Validation Schemas
// ============================================================================

const bulkIdsSchema = z.object({
  ids: z.array(z.string().min(1)).min(1).max(100),
})

// ============================================================================
// Bulk Mutation Functions
// ============================================================================

/**
 * Bulk publish announcements
 * @param input - Array of announcement IDs
 * @returns Action response with count of published announcements
 */
export async function bulkPublishAnnouncements(input: {
  ids: string[]
}): Promise<ActionResponse<{ count: number }>> {
  try {
    // Get authentication context
    const session = await auth()
    const authContext = getAuthContext(session)
    if (!authContext) {
      return { success: false, error: "Not authenticated" }
    }

    // Get tenant context
    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return { success: false, error: "Missing school context" }
    }

    // Parse and validate input
    const { ids } = bulkIdsSchema.parse(input)

    // Check bulk action permission
    try {
      assertAnnouncementPermission(authContext, "bulk_action")
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unauthorized for bulk actions",
      }
    }

    // Verify announcements exist and belong to school
    const validIds = await verifyAnnouncementOwnership(schoolId, ids)

    if (validIds.length === 0) {
      return { success: false, error: "No valid announcements found" }
    }

    // Bulk update announcements
    const result = await db.announcement.updateMany({
      where: {
        id: { in: validIds },
        schoolId,
      },
      data: {
        published: true,
        // Will add publishedAt after schema migration
        // publishedAt: new Date(),
      },
    })

    // Revalidate cache
    revalidatePath(ANNOUNCEMENTS_PATH)
    revalidateTag(`announcements-${schoolId}`, "max")

    return { success: true, data: { count: result.count } }
  } catch (error) {
    console.error("[bulkPublishAnnouncements] Error:", error, {
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
          : "Failed to publish announcements",
    }
  }
}

/**
 * Bulk unpublish announcements
 * @param input - Array of announcement IDs
 * @returns Action response with count of unpublished announcements
 */
export async function bulkUnpublishAnnouncements(input: {
  ids: string[]
}): Promise<ActionResponse<{ count: number }>> {
  try {
    // Get authentication context
    const session = await auth()
    const authContext = getAuthContext(session)
    if (!authContext) {
      return { success: false, error: "Not authenticated" }
    }

    // Get tenant context
    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return { success: false, error: "Missing school context" }
    }

    // Parse and validate input
    const { ids } = bulkIdsSchema.parse(input)

    // Check bulk action permission
    try {
      assertAnnouncementPermission(authContext, "bulk_action")
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unauthorized for bulk actions",
      }
    }

    // Verify announcements exist and belong to school
    const validIds = await verifyAnnouncementOwnership(schoolId, ids)

    if (validIds.length === 0) {
      return { success: false, error: "No valid announcements found" }
    }

    // Bulk update announcements
    const result = await db.announcement.updateMany({
      where: {
        id: { in: validIds },
        schoolId,
      },
      data: {
        published: false,
        // Will add publishedAt after schema migration
        // publishedAt: null,
      },
    })

    // Revalidate cache
    revalidatePath(ANNOUNCEMENTS_PATH)
    revalidateTag(`announcements-${schoolId}`, "max")

    return { success: true, data: { count: result.count } }
  } catch (error) {
    console.error("[bulkUnpublishAnnouncements] Error:", error, {
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
          : "Failed to unpublish announcements",
    }
  }
}

/**
 * Bulk delete announcements
 * @param input - Array of announcement IDs
 * @returns Action response with count of deleted announcements
 */
export async function bulkDeleteAnnouncements(input: {
  ids: string[]
}): Promise<ActionResponse<{ count: number }>> {
  try {
    // Get authentication context
    const session = await auth()
    const authContext = getAuthContext(session)
    if (!authContext) {
      return { success: false, error: "Not authenticated" }
    }

    // Get tenant context
    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return { success: false, error: "Missing school context" }
    }

    // Parse and validate input
    const { ids } = bulkIdsSchema.parse(input)

    // Check bulk action permission
    try {
      assertAnnouncementPermission(authContext, "bulk_action")
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unauthorized for bulk actions",
      }
    }

    // Verify announcements exist and belong to school
    const validIds = await verifyAnnouncementOwnership(schoolId, ids)

    if (validIds.length === 0) {
      return { success: false, error: "No valid announcements found" }
    }

    // Bulk delete announcements (using deleteMany for tenant safety)
    const result = await db.announcement.deleteMany({
      where: {
        id: { in: validIds },
        schoolId,
      },
    })

    // Revalidate cache
    revalidatePath(ANNOUNCEMENTS_PATH)
    revalidateTag(`announcements-${schoolId}`, "max")

    return { success: true, data: { count: result.count } }
  } catch (error) {
    console.error("[bulkDeleteAnnouncements] Error:", error, {
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
          : "Failed to delete announcements",
    }
  }
}

/**
 * Bulk update announcement priority
 * @param input - Array of announcement IDs and priority level
 * @returns Action response with count of updated announcements
 */
export async function bulkUpdatePriority(input: {
  ids: string[]
  priority: "low" | "normal" | "high" | "urgent"
}): Promise<ActionResponse<{ count: number }>> {
  try {
    // Get authentication context
    const session = await auth()
    const authContext = getAuthContext(session)
    if (!authContext) {
      return { success: false, error: "Not authenticated" }
    }

    // Get tenant context
    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return { success: false, error: "Missing school context" }
    }

    // Parse and validate input
    const validated = z
      .object({
        ids: z.array(z.string().min(1)).min(1).max(100),
        priority: z.enum(["low", "normal", "high", "urgent"]),
      })
      .parse(input)

    // Check bulk action permission
    try {
      assertAnnouncementPermission(authContext, "bulk_action")
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unauthorized for bulk actions",
      }
    }

    // Verify announcements exist and belong to school
    const validIds = await verifyAnnouncementOwnership(schoolId, validated.ids)

    if (validIds.length === 0) {
      return { success: false, error: "No valid announcements found" }
    }

    // Bulk update priority
    const result = await db.announcement.updateMany({
      where: {
        id: { in: validIds },
        schoolId,
      },
      data: {
        priority: validated.priority,
      },
    })

    // Revalidate cache
    revalidatePath(ANNOUNCEMENTS_PATH)
    revalidateTag(`announcements-${schoolId}`, "max")

    return { success: true, data: { count: result.count } }
  } catch (error) {
    console.error("[bulkUpdatePriority] Error:", error, {
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
        error instanceof Error ? error.message : "Failed to update priority",
    }
  }
}

/**
 * Bulk pin/unpin announcements
 * @param input - Array of announcement IDs and pin flag
 * @returns Action response with count of updated announcements
 */
export async function bulkTogglePin(input: {
  ids: string[]
  pinned: boolean
}): Promise<ActionResponse<{ count: number }>> {
  try {
    // Get authentication context
    const session = await auth()
    const authContext = getAuthContext(session)
    if (!authContext) {
      return { success: false, error: "Not authenticated" }
    }

    // Get tenant context
    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return { success: false, error: "Missing school context" }
    }

    // Parse and validate input
    const validated = z
      .object({
        ids: z.array(z.string().min(1)).min(1).max(100),
        pinned: z.boolean(),
      })
      .parse(input)

    // Check bulk action permission
    try {
      assertAnnouncementPermission(authContext, "bulk_action")
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unauthorized for bulk actions",
      }
    }

    // Verify announcements exist and belong to school
    const validIds = await verifyAnnouncementOwnership(schoolId, validated.ids)

    if (validIds.length === 0) {
      return { success: false, error: "No valid announcements found" }
    }

    // Bulk update pinned status
    const result = await db.announcement.updateMany({
      where: {
        id: { in: validIds },
        schoolId,
      },
      data: {
        pinned: validated.pinned,
      },
    })

    // Revalidate cache
    revalidatePath(ANNOUNCEMENTS_PATH)
    revalidateTag(`announcements-${schoolId}`, "max")

    return { success: true, data: { count: result.count } }
  } catch (error) {
    console.error("[bulkTogglePin] Error:", error, {
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
        error instanceof Error ? error.message : "Failed to toggle pin status",
    }
  }
}
