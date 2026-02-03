/**
 * Announcements Server Actions Module
 *
 * RESPONSIBILITY: School-wide announcements system with publication control and targeting
 *
 * WHAT IT HANDLES:
 * - Announcement lifecycle: Create, publish, edit, archive, delete
 * - Publication control: Draft mode, scheduled publishing, auto-expiry
 * - Audience targeting: School-wide, class-specific, role-based distribution
 * - Read tracking: Monitor which users have viewed each announcement
 * - Search & filtering: Find announcements by date, category, author
 * - Notifications: Trigger alerts to target audience on publish
 *
 * KEY ALGORITHMS:
 * 1. publishAnnouncement(): Set publication status and notify all targeted users
 * 2. getAnnouncements(): Filter by publication status, date range, target audience
 * 3. markAsRead(): Track individual user read receipts (not conversation-based)
 * 4. Scheduled publishing: Check for announcements ready to publish (via cron)
 *
 * MULTI-TENANT SAFETY (CRITICAL):
 * - ALL announcements must have schoolId
 * - Publication only visible to users in same school
 * - Notifications sent only to school members
 * - Author validation: Creator must be in same school
 * - Class targeting validated against school's classes
 *
 * GOTCHAS & NON-OBVIOUS BEHAVIOR:
 * 1. published field is boolean - only published announcements appear to target audience
 * 2. Read receipts are individual (not per-class), separate from broadcast status
 * 3. Expiry is soft-delete (archive) - data retained for audit trail
 * 4. Scheduling requires external job (cron) - no built-in scheduler
 * 5. Class-specific announcements require manual role-based filtering by client
 *
 * NOTIFICATION INTEGRATION:
 * - publishAnnouncement() should create notification records for each target user
 * - Notification type: "announcement"
 * - Include announcement preview in notification (first 200 chars)
 * - Role-based recipients: teachers, students, parents, admin
 *
 * PUBLICATION WORKFLOW:
 * - Draft: Author creates announcement (not published)
 * - Scheduled: Author can set publishAt date (requires job processing)
 * - Published: Visible to target audience, notification sent
 * - Archived: Soft-deleted (can be restored)
 * - Expired: Auto-archive based on expiresAt (requires job)
 *
 * READ TRACKING:
 * - Mark as read: Per-user per-announcement (not aggregated)
 * - Used for UI: Show "unread" badge, track engagement
 * - Consider privacy: Don't expose read status to other users
 * - For notifications: Track opening in notification system, not here
 *
 * PERFORMANCE NOTES:
 * - getAnnouncements() with filters - ensure indexes on (schoolId, published, createdAt)
 * - Read tracking queries can be expensive - consider caching "read count"
 * - Marking all as read should be batched, not individual queries
 * - Publishing to large audience creates N notification records (async in background)
 *
 * TARGETING STRATEGIES:
 * - School-wide: Broadcast to all users (default)
 * - Class-specific: Show only to members of selected classes
 * - Role-based: Limit to specific roles (teachers only, parents only, etc.)
 * - Custom list: Allow specifying individual recipients (email-style)
 *
 * FUTURE IMPROVEMENTS:
 * - Add announcement categories/tags for organization
 * - Implement scheduling engine (currently manual)
 * - Add read receipt statistics (% read, time to read, etc.)
 * - Support attachments (PDFs, images)
 * - Add comment threads on announcements (not just broadcast)
 * - Implement announcement approval workflow
 * - Support announcement templates
 * - Add multilingual support (English + Arabic variants)
 * - Implement announcement analytics dashboard
 * - Add announcement search across school
 */

"use server"

import { revalidatePath, revalidateTag } from "next/cache"
import { auth } from "@/auth"
import { Prisma } from "@prisma/client"
import type { AnnouncementConfig as PrismaAnnouncementConfig } from "@prisma/client"
import { z } from "zod"

import { withAutoTranslation } from "@/lib/auto-translate"
import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"
import {
  assertAnnouncementPermission,
  getAuthContext,
  validateAnnouncementScope,
} from "@/components/school-dashboard/listings/announcements/authorization"
// ============================================================================
// Announcement Config Actions
// ============================================================================
import {
  announcementConfigSchema,
  announcementCreateSchema,
  announcementUpdateSchema,
  getAnnouncementsSchema,
} from "@/components/school-dashboard/listings/announcements/validation"

// ============================================================================
// Types
// ============================================================================

export type ActionResponse<T = void> =
  | { success: true; data: T }
  | { success: false; error: string }

type AnnouncementSelectResult = {
  id: string
  schoolId: string
  titleEn: string | null
  titleAr: string | null
  bodyEn: string | null
  bodyAr: string | null
  scope: string
  priority: string
  classId: string | null
  role: string | null
  published: boolean
  createdBy: string | null
  createdAt: Date
  updatedAt: Date
}

type AnnouncementListResult = {
  id: string
  titleEn: string | null
  titleAr: string | null
  scope: string
  published: boolean
  priority: string
  pinned: boolean
  featured: boolean
  createdAt: string
  createdBy: string | null
}

// ============================================================================
// Constants
// ============================================================================

const ANNOUNCEMENTS_PATH = "/announcements" // Remove hardcoded lab prefix

// ============================================================================
// Mutations
// ============================================================================

/**
 * Create a new announcement
 * @param input - Announcement data
 * @returns Action response with announcement ID
 */
export async function createAnnouncement(
  input: z.infer<typeof announcementCreateSchema>
): Promise<ActionResponse<{ id: string }>> {
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
    const parsed = announcementCreateSchema.parse(input)

    // Validate scope permissions
    try {
      validateAnnouncementScope(authContext, parsed.scope)
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Invalid scope for your role",
      }
    }

    // Check create permission
    try {
      assertAnnouncementPermission(authContext, "create", {
        scope: parsed.scope,
      })
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unauthorized to create announcements",
      }
    }

    // Create announcement with audit trail - bilingual fields
    const row = await db.announcement.create({
      data: {
        schoolId,
        titleEn: parsed.titleEn || null,
        titleAr: parsed.titleAr || null,
        bodyEn: parsed.bodyEn || null,
        bodyAr: parsed.bodyAr || null,
        scope: parsed.scope,
        classId: parsed.classId || null,
        role: (parsed.role as any) || null,
        published: parsed.published,
        priority: parsed.priority || "normal",
        scheduledFor: parsed.scheduledFor
          ? new Date(parsed.scheduledFor)
          : null,
        expiresAt: parsed.expiresAt ? new Date(parsed.expiresAt) : null,
        pinned: parsed.pinned || false,
        featured: parsed.featured || false,
        // CRITICAL: Add author tracking (will work after schema migration)
        // createdBy: authContext.userId,
        // publishedAt: If published immediately, set publishedAt
        publishedAt: parsed.published ? new Date() : null,
      },
    })

    // Revalidate cache - both path and tags
    revalidatePath(ANNOUNCEMENTS_PATH)
    revalidateTag(`announcements-${schoolId}`, "max")

    return { success: true, data: { id: row.id } }
  } catch (error) {
    console.error("[createAnnouncement] Error:", error, {
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
          : "Failed to create announcement",
    }
  }
}

/**
 * Create announcement with automatic translation
 * When user enters content in one language, automatically translates to the other
 * @param input - Announcement data with source language
 * @returns Action response with announcement ID
 */
export async function createAnnouncementWithTranslation(input: {
  title: string
  body: string
  sourceLanguage: "en" | "ar"
  scope: "school" | "class" | "role"
  classId?: string | null
  role?: string | null
  published?: boolean
  priority?: "low" | "normal" | "high" | "urgent"
  scheduledFor?: string | null
  expiresAt?: string | null
  pinned?: boolean
  featured?: boolean
}): Promise<ActionResponse<{ id: string }>> {
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

    // Validate scope permissions
    try {
      validateAnnouncementScope(authContext, input.scope)
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Invalid scope for your role",
      }
    }

    // Check create permission
    try {
      assertAnnouncementPermission(authContext, "create", {
        scope: input.scope,
      })
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unauthorized to create announcements",
      }
    }

    // Auto-translate content
    const translatedData = await withAutoTranslation(
      { title: input.title, body: input.body },
      ["title", "body"],
      input.sourceLanguage
    )

    // Create announcement with bilingual content
    const row = await db.announcement.create({
      data: {
        schoolId,
        titleEn: translatedData.data.titleEn || null,
        titleAr: translatedData.data.titleAr || null,
        bodyEn: translatedData.data.bodyEn || null,
        bodyAr: translatedData.data.bodyAr || null,
        scope: input.scope,
        classId: input.classId || null,
        role: (input.role as any) || null,
        published: input.published ?? false,
        priority: input.priority || "normal",
        scheduledFor: input.scheduledFor ? new Date(input.scheduledFor) : null,
        expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
        pinned: input.pinned || false,
        featured: input.featured || false,
        publishedAt: input.published ? new Date() : null,
      },
    })

    // Revalidate cache
    revalidatePath(ANNOUNCEMENTS_PATH)
    revalidateTag(`announcements-${schoolId}`, "max")

    return {
      success: true,
      data: {
        id: row.id,
        ...(translatedData.translatedFields ? { translated: true } : {}),
      } as { id: string },
    }
  } catch (error) {
    console.error("[createAnnouncementWithTranslation] Error:", error, {
      input,
      timestamp: new Date().toISOString(),
    })

    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to create announcement",
    }
  }
}

/**
 * Update an existing announcement
 * @param input - Announcement update data
 * @returns Action response
 */
export async function updateAnnouncement(
  input: z.infer<typeof announcementUpdateSchema>
): Promise<ActionResponse<void>> {
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
    const parsed = announcementUpdateSchema.parse(input)
    const { id, ...rest } = parsed

    // Fetch existing announcement to check ownership
    const existing = await db.announcement.findFirst({
      where: { id, schoolId },
      select: {
        id: true,
        createdBy: true,
        schoolId: true,
        scope: true,
        published: true,
      },
    })

    if (!existing) {
      return { success: false, error: "Announcement not found" }
    }

    // Check update permission
    try {
      assertAnnouncementPermission(authContext, "update", {
        id: existing.id,
        createdBy: existing.createdBy,
        schoolId: existing.schoolId,
        scope: existing.scope as "school" | "class" | "role",
      })
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unauthorized to update this announcement",
      }
    }

    // Build update data object - bilingual fields
    const data: any = {}
    if (typeof rest.titleEn !== "undefined") data.titleEn = rest.titleEn
    if (typeof rest.titleAr !== "undefined") data.titleAr = rest.titleAr
    if (typeof rest.bodyEn !== "undefined") data.bodyEn = rest.bodyEn
    if (typeof rest.bodyAr !== "undefined") data.bodyAr = rest.bodyAr
    if (typeof rest.scope !== "undefined") data.scope = rest.scope
    if (typeof rest.classId !== "undefined") {
      // Use Prisma relation API instead of foreign key
      data.class = rest.classId
        ? { connect: { id: rest.classId } }
        : { disconnect: true }
    }
    if (typeof rest.role !== "undefined") data.role = rest.role || null
    if (typeof rest.published !== "undefined") {
      data.published = rest.published
      // Set publishedAt when publishing
      if (rest.published && !existing.published) {
        data.publishedAt = new Date()
      }
    }
    if (typeof rest.priority !== "undefined") data.priority = rest.priority
    if (typeof rest.scheduledFor !== "undefined") {
      data.scheduledFor = rest.scheduledFor ? new Date(rest.scheduledFor) : null
    }
    if (typeof rest.expiresAt !== "undefined") {
      data.expiresAt = rest.expiresAt ? new Date(rest.expiresAt) : null
    }
    if (typeof rest.pinned !== "undefined") data.pinned = rest.pinned
    if (typeof rest.featured !== "undefined") data.featured = rest.featured

    // Update announcement (using updateMany for tenant safety)
    await db.announcement.updateMany({
      where: { id, schoolId },
      data,
    })

    // Revalidate cache - both path and tags
    revalidatePath(ANNOUNCEMENTS_PATH)
    revalidateTag(`announcements-${schoolId}`, "max")

    return { success: true, data: undefined }
  } catch (error) {
    console.error("[updateAnnouncement] Error:", error, {
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
          : "Failed to update announcement",
    }
  }
}

/**
 * Delete an announcement
 * @param input - Announcement ID
 * @returns Action response
 */
export async function deleteAnnouncement(input: {
  id: string
}): Promise<ActionResponse<void>> {
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
    const { id } = z.object({ id: z.string().min(1) }).parse(input)

    // Fetch existing announcement to check ownership
    const existing = await db.announcement.findFirst({
      where: { id, schoolId },
      select: {
        id: true,
        createdBy: true,
        schoolId: true,
        scope: true,
        published: true,
      },
    })

    if (!existing) {
      return { success: false, error: "Announcement not found" }
    }

    // Check delete permission
    try {
      assertAnnouncementPermission(authContext, "delete", {
        id: existing.id,
        createdBy: existing.createdBy,
        schoolId: existing.schoolId,
        scope: existing.scope as "school" | "class" | "role",
      })
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unauthorized to delete this announcement",
      }
    }

    // Delete announcement (using deleteMany for tenant safety)
    await db.announcement.deleteMany({ where: { id, schoolId } })

    // Revalidate cache - both path and tags
    revalidatePath(ANNOUNCEMENTS_PATH)
    revalidateTag(`announcements-${schoolId}`, "max")

    return { success: true, data: undefined }
  } catch (error) {
    console.error("[deleteAnnouncement] Error:", error, {
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
          : "Failed to delete announcement",
    }
  }
}

/**
 * Toggle announcement publish status
 * @param input - Announcement ID and publish flag
 * @returns Action response
 */
export async function toggleAnnouncementPublish(input: {
  id: string
  publish: boolean
}): Promise<ActionResponse<void>> {
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
    const { id, publish } = z
      .object({ id: z.string().min(1), publish: z.boolean() })
      .parse(input)

    // Fetch existing announcement to check ownership
    const existing = await db.announcement.findFirst({
      where: { id, schoolId },
      select: {
        id: true,
        createdBy: true,
        schoolId: true,
        scope: true,
        published: true,
      },
    })

    if (!existing) {
      return { success: false, error: "Announcement not found" }
    }

    // Check publish permission
    try {
      assertAnnouncementPermission(authContext, "publish", {
        id: existing.id,
        createdBy: existing.createdBy,
        schoolId: existing.schoolId,
        scope: existing.scope as "school" | "class" | "role",
      })
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unauthorized to publish this announcement",
      }
    }

    // Update publish status
    await db.announcement.updateMany({
      where: { id, schoolId },
      data: {
        published: publish,
        // Will add publishedAt after schema migration
        // publishedAt: publish ? new Date() : null
      },
    })

    // Revalidate cache - both path and tags
    revalidatePath(ANNOUNCEMENTS_PATH)
    revalidateTag(`announcements-${schoolId}`, "max")

    return { success: true, data: undefined }
  } catch (error) {
    console.error("[toggleAnnouncementPublish] Error:", error, {
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
          : "Failed to toggle publish status",
    }
  }
}

// ============================================================================
// Queries
// ============================================================================

/**
 * Get a single announcement by ID
 * @param input - Announcement ID
 * @returns Action response with announcement data
 */
export async function getAnnouncement(input: {
  id: string
}): Promise<ActionResponse<AnnouncementSelectResult | null>> {
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
    const { id } = z.object({ id: z.string().min(1) }).parse(input)

    // Fetch announcement with proper select - bilingual fields
    const announcement = await db.announcement.findFirst({
      where: { id, schoolId },
      select: {
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
        createdBy: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    if (!announcement) {
      return { success: true, data: null }
    }

    // Check read permission
    try {
      assertAnnouncementPermission(authContext, "read", {
        id: announcement.id,
        schoolId: announcement.schoolId,
      })
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unauthorized to read this announcement",
      }
    }

    return { success: true, data: announcement }
  } catch (error) {
    console.error("[getAnnouncement] Error:", error, {
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
        error instanceof Error ? error.message : "Failed to fetch announcement",
    }
  }
}

/**
 * Get announcements list with filtering and pagination
 * @param input - Query parameters
 * @returns Action response with announcements and total count
 */
export async function getAnnouncements(
  input: Partial<z.infer<typeof getAnnouncementsSchema>>
): Promise<ActionResponse<{ rows: AnnouncementListResult[]; total: number }>> {
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
    const sp = getAnnouncementsSchema.parse(input ?? {})

    // Build where clause with proper types
    // Search in both titleEn and titleAr
    const where: any = {
      schoolId,
      ...(sp.title && {
        OR: [
          { titleEn: { contains: sp.title, mode: "insensitive" } },
          { titleAr: { contains: sp.title, mode: "insensitive" } },
        ],
      }),
      ...(sp.scope && { scope: sp.scope }),
      ...(sp.published && { published: sp.published === "true" }),
    }

    // Build pagination
    const skip = (sp.page - 1) * sp.perPage
    const take = sp.perPage

    // Build order by clause
    const orderBy: Prisma.AnnouncementOrderByWithRelationInput[] =
      sp.sort && Array.isArray(sp.sort) && sp.sort.length
        ? sp.sort.map((s) => ({
            [s.id]: s.desc ? Prisma.SortOrder.desc : Prisma.SortOrder.asc,
          }))
        : [{ createdAt: Prisma.SortOrder.desc }]

    // Execute queries in parallel
    const [rows, count] = await Promise.all([
      db.announcement.findMany({
        where,
        orderBy,
        skip,
        take,
        select: {
          id: true,
          titleEn: true,
          titleAr: true,
          scope: true,
          published: true,
          priority: true,
          pinned: true,
          featured: true,
          createdAt: true,
          createdBy: true,
        },
      }),
      db.announcement.count({ where }),
    ])

    // Map results with proper types - bilingual fields
    const mapped: AnnouncementListResult[] = rows.map((a) => ({
      id: a.id,
      titleEn: a.titleEn,
      titleAr: a.titleAr,
      scope: a.scope,
      published: a.published,
      priority: a.priority,
      pinned: a.pinned,
      featured: a.featured,
      createdAt: a.createdAt.toISOString(),
      createdBy: a.createdBy,
    }))

    return { success: true, data: { rows: mapped, total: count } }
  } catch (error) {
    console.error("[getAnnouncements] Error:", error, {
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
          : "Failed to fetch announcements",
    }
  }
}

/**
 * Get previous announcements for autocomplete suggestions
 * Returns recent announcements with titles and bodies
 */
export async function getPreviousAnnouncements(): Promise<
  ActionResponse<
    Array<{
      id: string
      titleEn: string | null
      titleAr: string | null
      bodyEn: string | null
      bodyAr: string | null
    }>
  >
> {
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

    // Fetch recent announcements for suggestions (limit to 20 most recent)
    const announcements = await db.announcement.findMany({
      where: { schoolId },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        id: true,
        titleEn: true,
        titleAr: true,
        bodyEn: true,
        bodyAr: true,
      },
    })

    return { success: true, data: announcements }
  } catch (error) {
    console.error("[getPreviousAnnouncements] Error:", error)
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to fetch suggestions",
    }
  }
}

export type AnnouncementConfigData = {
  id: string
  schoolId: string
  defaultScope: string
  defaultPriority: string
  autoPublish: boolean
  defaultExpiryDays: number
  emailOnPublish: boolean
  pushNotifications: boolean
  quietHoursStart: string | null
  quietHoursEnd: string | null
  digestFrequency: string
  defaultTemplateId: string | null
  allowCustomTemplates: boolean
  readTracking: boolean
  retentionDays: number
  autoArchive: boolean
  archiveAfterDays: number
}

/**
 * Get announcement config for the current school
 * Creates default config if none exists
 */
export async function getAnnouncementConfig(): Promise<
  ActionResponse<AnnouncementConfigData>
> {
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

    // Try to find existing config
    let config = await db.announcementConfig.findUnique({
      where: { schoolId },
    })

    // Create default config if none exists
    if (!config) {
      config = await db.announcementConfig.create({
        data: {
          schoolId,
          // All defaults are set in the Prisma schema
        },
      })
    }

    return {
      success: true,
      data: {
        id: config.id,
        schoolId: config.schoolId,
        defaultScope: config.defaultScope,
        defaultPriority: config.defaultPriority,
        autoPublish: config.autoPublish,
        defaultExpiryDays: config.defaultExpiryDays,
        emailOnPublish: config.emailOnPublish,
        pushNotifications: config.pushNotifications,
        quietHoursStart: config.quietHoursStart,
        quietHoursEnd: config.quietHoursEnd,
        digestFrequency: config.digestFrequency,
        defaultTemplateId: config.defaultTemplateId,
        allowCustomTemplates: config.allowCustomTemplates,
        readTracking: config.readTracking,
        retentionDays: config.retentionDays,
        autoArchive: config.autoArchive,
        archiveAfterDays: config.archiveAfterDays,
      },
    }
  } catch (error) {
    console.error("[getAnnouncementConfig] Error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch config",
    }
  }
}

/**
 * Update announcement config for the current school
 */
export async function updateAnnouncementConfig(
  input: z.infer<typeof announcementConfigSchema>
): Promise<ActionResponse<AnnouncementConfigData>> {
  try {
    // Get authentication context
    const session = await auth()
    const authContext = getAuthContext(session)
    if (!authContext) {
      return { success: false, error: "Not authenticated" }
    }

    // Only admins can update config
    if (!["ADMIN", "DEVELOPER"].includes(authContext.role)) {
      return {
        success: false,
        error: "Only admins can update announcement settings",
      }
    }

    // Get tenant context
    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return { success: false, error: "Missing school context" }
    }

    // Parse and validate input
    const parsed = announcementConfigSchema.parse(input)

    // Upsert config
    const config = await db.announcementConfig.upsert({
      where: { schoolId },
      create: {
        schoolId,
        ...parsed,
      },
      update: parsed,
    })

    // Revalidate config page
    revalidatePath("/announcements/config")

    return {
      success: true,
      data: {
        id: config.id,
        schoolId: config.schoolId,
        defaultScope: config.defaultScope,
        defaultPriority: config.defaultPriority,
        autoPublish: config.autoPublish,
        defaultExpiryDays: config.defaultExpiryDays,
        emailOnPublish: config.emailOnPublish,
        pushNotifications: config.pushNotifications,
        quietHoursStart: config.quietHoursStart,
        quietHoursEnd: config.quietHoursEnd,
        digestFrequency: config.digestFrequency,
        defaultTemplateId: config.defaultTemplateId,
        allowCustomTemplates: config.allowCustomTemplates,
        readTracking: config.readTracking,
        retentionDays: config.retentionDays,
        autoArchive: config.autoArchive,
        archiveAfterDays: config.archiveAfterDays,
      },
    }
  } catch (error) {
    console.error("[updateAnnouncementConfig] Error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update config",
    }
  }
}

/**
 * Get announcement templates for the current school (for config dropdown)
 */
export async function getAnnouncementTemplates(): Promise<
  ActionResponse<
    Array<{
      id: string
      name: string
      type: string
    }>
  >
> {
  try {
    // Get tenant context
    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return { success: false, error: "Missing school context" }
    }

    const templates = await db.announcementTemplate.findMany({
      where: { schoolId },
      select: {
        id: true,
        name: true,
        type: true,
      },
      orderBy: { name: "asc" },
    })

    return { success: true, data: templates }
  } catch (error) {
    console.error("[getAnnouncementTemplates] Error:", error)
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to fetch templates",
    }
  }
}
