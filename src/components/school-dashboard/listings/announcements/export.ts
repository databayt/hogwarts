/**
 * Export functionality for announcements
 * Enables exporting announcement data to CSV format
 */

"use server"

import { auth } from "@/auth"
import { z } from "zod"

import { getTenantContext } from "@/lib/tenant-context"
import { arrayToCSV, generateCSVFilename } from "@/components/file"

import type { ActionResponse } from "./actions"
import { assertAnnouncementPermission, getAuthContext } from "./authorization"
import { getAnnouncementsList } from "./queries"
import type {
  AnnouncementListFilters,
  PaginationParams,
  SortParam,
} from "./queries"

// ============================================================================
// Types
// ============================================================================

type ExportFormat = "csv" | "json"

interface ExportParams extends Partial<AnnouncementListFilters> {
  page?: number
  perPage?: number
  sort?: SortParam[]
  format?: ExportFormat
}

// ============================================================================
// CSV Column Definitions
// ============================================================================

const ANNOUNCEMENT_EXPORT_COLUMNS = [
  { key: "id", label: "ID" },
  { key: "title", label: "Title" },
  { key: "lang", label: "Language" },
  { key: "scope", label: "Scope" },
  { key: "priority", label: "Priority" },
  { key: "published", label: "Published" },
  { key: "pinned", label: "Pinned" },
  { key: "featured", label: "Featured" },
  { key: "createdBy", label: "Created By (ID)" },
  { key: "createdAt", label: "Created Date" },
  { key: "publishedAt", label: "Published Date" },
  { key: "scheduledFor", label: "Scheduled For" },
  { key: "expiresAt", label: "Expires At" },
] as const

// ============================================================================
// Export Functions
// ============================================================================

/**
 * Export announcements to CSV
 * @param input - Export parameters (filters, pagination, sort)
 * @returns CSV string or error
 */
export async function exportAnnouncementsToCSV(
  input: ExportParams = {}
): Promise<ActionResponse<{ csv: string; filename: string }>> {
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

    // Check read permission (any authenticated user can export what they can see)
    try {
      assertAnnouncementPermission(authContext, "read")
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unauthorized to export announcements",
      }
    }

    // Get announcements with applied filters
    const { rows } = await getAnnouncementsList(schoolId, {
      title: input.title,
      scope: input.scope,
      published: input.published,
      priority: input.priority,
      createdBy: input.createdBy,
      classId: input.classId,
      role: input.role,
      page: input.page || 1,
      perPage: input.perPage || 1000, // Default to 1000 for exports
      sort: input.sort,
    })

    if (rows.length === 0) {
      return { success: false, error: "No announcements to export" }
    }

    // Map data to export format
    const exportData = rows.map((row) => ({
      id: row.id,
      title: row.title || "",
      lang: row.lang || "ar",
      scope: row.scope,
      priority: row.priority || "normal",
      published: row.published ? "Yes" : "No",
      pinned: row.pinned ? "Yes" : "No",
      featured: row.featured ? "Yes" : "No",
      createdBy: row.createdBy || "N/A",
      createdAt: new Date(row.createdAt).toLocaleString(),
      publishedAt: row.publishedAt
        ? new Date(row.publishedAt).toLocaleString()
        : "N/A",
      scheduledFor: row.scheduledFor
        ? new Date(row.scheduledFor).toLocaleString()
        : "N/A",
      expiresAt: row.expiresAt
        ? new Date(row.expiresAt).toLocaleString()
        : "N/A",
    }))

    // Generate CSV
    const csv = arrayToCSV(exportData, {
      columns: ANNOUNCEMENT_EXPORT_COLUMNS as any,
      includeHeaders: true,
    })

    // Generate filename with timestamp
    const filename = generateCSVFilename("announcements", {
      timestamp: true,
    })

    return {
      success: true,
      data: {
        csv,
        filename,
      },
    }
  } catch (error) {
    console.error("[exportAnnouncementsToCSV] Error:", error, {
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
          : "Failed to export announcements",
    }
  }
}

/**
 * Export selected announcements by IDs
 * @param input - Array of announcement IDs
 * @returns CSV string or error
 */
export async function exportSelectedAnnouncements(input: {
  ids: string[]
}): Promise<ActionResponse<{ csv: string; filename: string }>> {
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
    const { ids } = z
      .object({
        ids: z.array(z.string().min(1)).min(1).max(1000),
      })
      .parse(input)

    // Check read permission
    try {
      assertAnnouncementPermission(authContext, "read")
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unauthorized to export announcements",
      }
    }

    // Import getAnnouncementsByIds from queries
    const { getAnnouncementsByIds } = await import("./queries")

    // Fetch announcements by IDs
    const announcements = await getAnnouncementsByIds(schoolId, ids)

    if (announcements.length === 0) {
      return { success: false, error: "No announcements found" }
    }

    // Map data to export format
    const exportData = announcements.map((announcement) => ({
      id: announcement.id,
      title: announcement.title || "",
      lang: announcement.lang || "ar",
      scope: announcement.scope,
      priority: announcement.priority || "normal",
      published: announcement.published ? "Yes" : "No",
      pinned: announcement.pinned ? "Yes" : "No",
      featured: announcement.featured ? "Yes" : "No",
      createdBy: announcement.createdBy || "N/A",
      createdAt: new Date(announcement.createdAt).toLocaleString(),
      publishedAt: announcement.publishedAt
        ? new Date(announcement.publishedAt).toLocaleString()
        : "N/A",
      scheduledFor: announcement.scheduledFor
        ? new Date(announcement.scheduledFor).toLocaleString()
        : "N/A",
      expiresAt: announcement.expiresAt
        ? new Date(announcement.expiresAt).toLocaleString()
        : "N/A",
    }))

    // Generate CSV
    const csv = arrayToCSV(exportData, {
      columns: ANNOUNCEMENT_EXPORT_COLUMNS as any,
      includeHeaders: true,
    })

    // Generate filename with timestamp
    const filename = generateCSVFilename("announcements_selected", {
      timestamp: true,
    })

    return {
      success: true,
      data: {
        csv,
        filename,
      },
    }
  } catch (error) {
    console.error("[exportSelectedAnnouncements] Error:", error, {
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
          : "Failed to export announcements",
    }
  }
}

/**
 * Client-side helper to trigger CSV download
 * Note: This must be called from client components
 */
export function downloadAnnouncementsCSV(csv: string, filename: string): void {
  if (typeof window === "undefined") {
    throw new Error(
      "downloadAnnouncementsCSV can only be called in browser context"
    )
  }

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
