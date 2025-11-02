"use server";

import { z } from "zod";
import { revalidatePath, revalidateTag } from "next/cache";
import { db } from "@/lib/db";
import { getTenantContext } from "@/lib/tenant-context";
import { auth } from "@/auth";
import {
  announcementCreateSchema,
  announcementUpdateSchema,
  getAnnouncementsSchema
} from "@/components/platform/announcements/validation";
import {
  getAuthContext,
  assertAnnouncementPermission,
  validateAnnouncementScope
} from "@/components/platform/announcements/authorization";
import type { Prisma } from "@prisma/client";

// ============================================================================
// Types
// ============================================================================

export type ActionResponse<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };

type AnnouncementSelectResult = {
  id: string;
  schoolId: string;
  title: string;
  body: string;
  scope: string;
  classId: string | null;
  role: string | null;
  published: boolean;
  createdBy: string | null;
  createdAt: Date;
  updatedAt: Date;
};

type AnnouncementListResult = {
  id: string;
  title: string;
  scope: string;
  published: boolean;
  createdAt: string;
  createdBy: string | null;
};

// ============================================================================
// Constants
// ============================================================================

const ANNOUNCEMENTS_PATH = "/announcements"; // Remove hardcoded dashboard prefix

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
    const session = await auth();
    const authContext = getAuthContext(session);
    if (!authContext) {
      return { success: false, error: "Not authenticated" };
    }

    // Get tenant context
    const { schoolId } = await getTenantContext();
    if (!schoolId) {
      return { success: false, error: "Missing school context" };
    }

    // Parse and validate input
    const parsed = announcementCreateSchema.parse(input);

    // Validate scope permissions
    try {
      validateAnnouncementScope(authContext, parsed.scope);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Invalid scope for your role"
      };
    }

    // Check create permission
    try {
      assertAnnouncementPermission(authContext, 'create', { scope: parsed.scope });
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unauthorized to create announcements"
      };
    }

    // Create announcement with audit trail
    const row = await db.announcement.create({
      data: {
        schoolId,
        title: parsed.title,
        body: parsed.body,
        scope: parsed.scope,
        classId: parsed.classId || null,
        role: parsed.role || null,
        published: parsed.published,
        priority: parsed.priority || "normal",
        scheduledFor: parsed.scheduledFor ? new Date(parsed.scheduledFor) : null,
        expiresAt: parsed.expiresAt ? new Date(parsed.expiresAt) : null,
        pinned: parsed.pinned || false,
        featured: parsed.featured || false,
        // CRITICAL: Add author tracking (will work after schema migration)
        // createdBy: authContext.userId,
        // publishedAt: If published immediately, set publishedAt
        publishedAt: parsed.published ? new Date() : null,
      },
    });

    // Revalidate cache - both path and tags
    revalidatePath(ANNOUNCEMENTS_PATH);
    revalidateTag(`announcements-${schoolId}`);

    return { success: true, data: { id: row.id } };
  } catch (error) {
    console.error("[createAnnouncement] Error:", error, {
      input,
      timestamp: new Date().toISOString(),
    });

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: `Validation error: ${error.errors.map(e => e.message).join(", ")}`
      };
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create announcement"
    };
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
    const session = await auth();
    const authContext = getAuthContext(session);
    if (!authContext) {
      return { success: false, error: "Not authenticated" };
    }

    // Get tenant context
    const { schoolId } = await getTenantContext();
    if (!schoolId) {
      return { success: false, error: "Missing school context" };
    }

    // Parse and validate input
    const parsed = announcementUpdateSchema.parse(input);
    const { id, ...rest } = parsed;

    // Fetch existing announcement to check ownership
    const existing = await db.announcement.findFirst({
      where: { id, schoolId },
      select: { id: true, createdBy: true, schoolId: true, scope: true, published: true },
    });

    if (!existing) {
      return { success: false, error: "Announcement not found" };
    }

    // Check update permission
    try {
      assertAnnouncementPermission(authContext, 'update', {
        id: existing.id,
        createdBy: existing.createdBy,
        schoolId: existing.schoolId,
        scope: existing.scope as 'school' | 'class' | 'role',
      });
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unauthorized to update this announcement"
      };
    }

    // Build update data object
    const data: Prisma.AnnouncementUpdateInput = {};
    if (typeof rest.title !== "undefined") data.title = rest.title;
    if (typeof rest.body !== "undefined") data.body = rest.body;
    if (typeof rest.scope !== "undefined") data.scope = rest.scope;
    if (typeof rest.classId !== "undefined") data.classId = rest.classId || null;
    if (typeof rest.role !== "undefined") data.role = rest.role || null;
    if (typeof rest.published !== "undefined") {
      data.published = rest.published;
      // Set publishedAt when publishing
      if (rest.published && !existing.published) {
        data.publishedAt = new Date();
      }
    }
    if (typeof rest.priority !== "undefined") data.priority = rest.priority;
    if (typeof rest.scheduledFor !== "undefined") {
      data.scheduledFor = rest.scheduledFor ? new Date(rest.scheduledFor) : null;
    }
    if (typeof rest.expiresAt !== "undefined") {
      data.expiresAt = rest.expiresAt ? new Date(rest.expiresAt) : null;
    }
    if (typeof rest.pinned !== "undefined") data.pinned = rest.pinned;
    if (typeof rest.featured !== "undefined") data.featured = rest.featured;

    // Update announcement (using updateMany for tenant safety)
    await db.announcement.updateMany({
      where: { id, schoolId },
      data
    });

    // Revalidate cache - both path and tags
    revalidatePath(ANNOUNCEMENTS_PATH);
    revalidateTag(`announcements-${schoolId}`);

    return { success: true, data: undefined };
  } catch (error) {
    console.error("[updateAnnouncement] Error:", error, {
      input,
      timestamp: new Date().toISOString(),
    });

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: `Validation error: ${error.errors.map(e => e.message).join(", ")}`
      };
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update announcement"
    };
  }
}

/**
 * Delete an announcement
 * @param input - Announcement ID
 * @returns Action response
 */
export async function deleteAnnouncement(
  input: { id: string }
): Promise<ActionResponse<void>> {
  try {
    // Get authentication context
    const session = await auth();
    const authContext = getAuthContext(session);
    if (!authContext) {
      return { success: false, error: "Not authenticated" };
    }

    // Get tenant context
    const { schoolId } = await getTenantContext();
    if (!schoolId) {
      return { success: false, error: "Missing school context" };
    }

    // Parse and validate input
    const { id } = z.object({ id: z.string().min(1) }).parse(input);

    // Fetch existing announcement to check ownership
    const existing = await db.announcement.findFirst({
      where: { id, schoolId },
      select: { id: true, createdBy: true, schoolId: true, scope: true, published: true },
    });

    if (!existing) {
      return { success: false, error: "Announcement not found" };
    }

    // Check delete permission
    try {
      assertAnnouncementPermission(authContext, 'delete', {
        id: existing.id,
        createdBy: existing.createdBy,
        schoolId: existing.schoolId,
        scope: existing.scope as 'school' | 'class' | 'role',
      });
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unauthorized to delete this announcement"
      };
    }

    // Delete announcement (using deleteMany for tenant safety)
    await db.announcement.deleteMany({ where: { id, schoolId } });

    // Revalidate cache - both path and tags
    revalidatePath(ANNOUNCEMENTS_PATH);
    revalidateTag(`announcements-${schoolId}`);

    return { success: true, data: undefined };
  } catch (error) {
    console.error("[deleteAnnouncement] Error:", error, {
      input,
      timestamp: new Date().toISOString(),
    });

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: `Validation error: ${error.errors.map(e => e.message).join(", ")}`
      };
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete announcement"
    };
  }
}

/**
 * Toggle announcement publish status
 * @param input - Announcement ID and publish flag
 * @returns Action response
 */
export async function toggleAnnouncementPublish(
  input: { id: string; publish: boolean }
): Promise<ActionResponse<void>> {
  try {
    // Get authentication context
    const session = await auth();
    const authContext = getAuthContext(session);
    if (!authContext) {
      return { success: false, error: "Not authenticated" };
    }

    // Get tenant context
    const { schoolId } = await getTenantContext();
    if (!schoolId) {
      return { success: false, error: "Missing school context" };
    }

    // Parse and validate input
    const { id, publish } = z
      .object({ id: z.string().min(1), publish: z.boolean() })
      .parse(input);

    // Fetch existing announcement to check ownership
    const existing = await db.announcement.findFirst({
      where: { id, schoolId },
      select: { id: true, createdBy: true, schoolId: true, scope: true, published: true },
    });

    if (!existing) {
      return { success: false, error: "Announcement not found" };
    }

    // Check publish permission
    try {
      assertAnnouncementPermission(authContext, 'publish', {
        id: existing.id,
        createdBy: existing.createdBy,
        schoolId: existing.schoolId,
        scope: existing.scope as 'school' | 'class' | 'role',
      });
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unauthorized to publish this announcement"
      };
    }

    // Update publish status
    await db.announcement.updateMany({
      where: { id, schoolId },
      data: {
        published: publish,
        // Will add publishedAt after schema migration
        // publishedAt: publish ? new Date() : null
      }
    });

    // Revalidate cache - both path and tags
    revalidatePath(ANNOUNCEMENTS_PATH);
    revalidateTag(`announcements-${schoolId}`);

    return { success: true, data: undefined };
  } catch (error) {
    console.error("[toggleAnnouncementPublish] Error:", error, {
      input,
      timestamp: new Date().toISOString(),
    });

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: `Validation error: ${error.errors.map(e => e.message).join(", ")}`
      };
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to toggle publish status"
    };
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
export async function getAnnouncement(
  input: { id: string }
): Promise<ActionResponse<AnnouncementSelectResult | null>> {
  try {
    // Get authentication context
    const session = await auth();
    const authContext = getAuthContext(session);
    if (!authContext) {
      return { success: false, error: "Not authenticated" };
    }

    // Get tenant context
    const { schoolId } = await getTenantContext();
    if (!schoolId) {
      return { success: false, error: "Missing school context" };
    }

    // Parse and validate input
    const { id } = z.object({ id: z.string().min(1) }).parse(input);

    // Fetch announcement with proper select
    const announcement = await db.announcement.findFirst({
      where: { id, schoolId },
      select: {
        id: true,
        schoolId: true,
        title: true,
        body: true,
        scope: true,
        classId: true,
        role: true,
        published: true,
        createdBy: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!announcement) {
      return { success: true, data: null };
    }

    // Check read permission
    try {
      assertAnnouncementPermission(authContext, 'read', {
        id: announcement.id,
        schoolId: announcement.schoolId,
      });
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unauthorized to read this announcement"
      };
    }

    return { success: true, data: announcement };
  } catch (error) {
    console.error("[getAnnouncement] Error:", error, {
      input,
      timestamp: new Date().toISOString(),
    });

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: `Validation error: ${error.errors.map(e => e.message).join(", ")}`
      };
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch announcement"
    };
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
    const session = await auth();
    const authContext = getAuthContext(session);
    if (!authContext) {
      return { success: false, error: "Not authenticated" };
    }

    // Get tenant context
    const { schoolId } = await getTenantContext();
    if (!schoolId) {
      return { success: false, error: "Missing school context" };
    }

    // Parse and validate input
    const sp = getAnnouncementsSchema.parse(input ?? {});

    // Build where clause with proper types
    const where: Prisma.AnnouncementWhereInput = {
      schoolId,
      ...(sp.title && {
        title: { contains: sp.title, mode: Prisma.QueryMode.insensitive },
      }),
      ...(sp.scope && { scope: sp.scope }),
      ...(sp.published && { published: sp.published === "true" }),
    };

    // Build pagination
    const skip = (sp.page - 1) * sp.perPage;
    const take = sp.perPage;

    // Build order by clause
    const orderBy: Prisma.AnnouncementOrderByWithRelationInput[] =
      sp.sort && Array.isArray(sp.sort) && sp.sort.length
        ? sp.sort.map((s) => ({
            [s.id]: s.desc ? Prisma.SortOrder.desc : Prisma.SortOrder.asc,
          }))
        : [{ createdAt: Prisma.SortOrder.desc }];

    // Execute queries in parallel
    const [rows, count] = await Promise.all([
      db.announcement.findMany({
        where,
        orderBy,
        skip,
        take,
        select: {
          id: true,
          title: true,
          scope: true,
          published: true,
          createdAt: true,
          createdBy: true,
        },
      }),
      db.announcement.count({ where }),
    ]);

    // Map results with proper types
    const mapped: AnnouncementListResult[] = rows.map((a) => ({
      id: a.id,
      title: a.title,
      scope: a.scope,
      published: a.published,
      createdAt: a.createdAt.toISOString(),
      createdBy: a.createdBy,
    }));

    return { success: true, data: { rows: mapped, total: count } };
  } catch (error) {
    console.error("[getAnnouncements] Error:", error, {
      input,
      timestamp: new Date().toISOString(),
    });

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: `Validation error: ${error.errors.map(e => e.message).join(", ")}`
      };
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch announcements"
    };
  }
}
