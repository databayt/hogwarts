"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { revalidatePath } from "next/cache"
import { auth } from "@/auth"

import type { ActionResponse } from "@/lib/action-response"
import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"

import {
  contentOverrideSchema,
  subjectSelectionUpdateSchema,
} from "./validation"

// ============================================================================
// Authorization helper — ADMIN or DEVELOPER, requires schoolId
// ============================================================================

async function requireSchoolAdmin(): Promise<
  { ok: true; session: any; schoolId: string } | { ok: false; error: string }
> {
  const session = await auth()
  const role = session?.user?.role
  if (role !== "ADMIN" && role !== "DEVELOPER") {
    return {
      ok: false,
      error: "Unauthorized: ADMIN or DEVELOPER role required",
    }
  }
  const { schoolId } = await getTenantContext()
  if (!schoolId) {
    return { ok: false, error: "Missing school context" }
  }
  return { ok: true, session, schoolId }
}

// ============================================================================
// Toggle subject selection (add/remove from school)
// ============================================================================

export async function toggleSubjectSelection(
  catalogSubjectId: string,
  gradeId: string,
  streamId?: string | null
): Promise<ActionResponse<{ selected: boolean }>> {
  try {
    const authResult = await requireSchoolAdmin()
    if (!authResult.ok) return { success: false, error: authResult.error }
    const { schoolId } = authResult

    // Check if already selected
    const existing = await db.schoolSubjectSelection.findFirst({
      where: {
        schoolId,
        catalogSubjectId,
        gradeId,
        streamId: streamId ?? null,
      },
    })

    if (existing) {
      // Remove selection
      await db.schoolSubjectSelection.delete({ where: { id: existing.id } })

      // Update usage count
      const usageCount = await db.schoolSubjectSelection.count({
        where: { catalogSubjectId },
      })
      await db.catalogSubject.update({
        where: { id: catalogSubjectId },
        data: { usageCount },
      })

      revalidatePath("/", "layout")
      return { success: true, data: { selected: false } }
    }

    // Add selection
    await db.schoolSubjectSelection.create({
      data: {
        schoolId,
        catalogSubjectId,
        gradeId,
        streamId: streamId ?? null,
        isRequired: true,
        isActive: true,
      },
    })

    // Update usage count
    const usageCount = await db.schoolSubjectSelection.count({
      where: { catalogSubjectId },
    })
    await db.catalogSubject.update({
      where: { id: catalogSubjectId },
      data: { usageCount },
    })

    revalidatePath("/", "layout")
    return { success: true, data: { selected: true } }
  } catch (error) {
    console.error("[toggleSubjectSelection] Error:", error)
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to toggle subject selection",
    }
  }
}

// ============================================================================
// Bulk select subjects for a grade
// ============================================================================

export async function bulkSelectSubjects(
  catalogSubjectIds: string[],
  gradeId: string
): Promise<ActionResponse<{ added: number }>> {
  try {
    const authResult = await requireSchoolAdmin()
    if (!authResult.ok) return { success: false, error: authResult.error }
    const { schoolId } = authResult

    let added = 0
    const affectedSubjectIds: string[] = []

    for (const catalogSubjectId of catalogSubjectIds) {
      const existing = await db.schoolSubjectSelection.findFirst({
        where: {
          schoolId,
          catalogSubjectId,
          gradeId,
          streamId: null,
        },
      })

      if (!existing) {
        await db.schoolSubjectSelection.create({
          data: {
            schoolId,
            catalogSubjectId,
            gradeId,
            streamId: null,
            isRequired: true,
            isActive: true,
          },
        })
        affectedSubjectIds.push(catalogSubjectId)
        added++
      }
    }

    // Update usageCount for all affected subjects
    for (const catalogSubjectId of affectedSubjectIds) {
      const usageCount = await db.schoolSubjectSelection.count({
        where: { catalogSubjectId },
      })
      await db.catalogSubject.update({
        where: { id: catalogSubjectId },
        data: { usageCount },
      })
    }

    revalidatePath("/", "layout")
    return { success: true, data: { added } }
  } catch (error) {
    console.error("[bulkSelectSubjects] Error:", error)
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to bulk select subjects",
    }
  }
}

// ============================================================================
// Update selection details
// ============================================================================

export async function updateSubjectSelection(
  selectionId: string,
  data: {
    isRequired?: boolean
    weeklyPeriods?: number
    customName?: string
    isActive?: boolean
  }
): Promise<ActionResponse> {
  try {
    const authResult = await requireSchoolAdmin()
    if (!authResult.ok) return { success: false, error: authResult.error }
    const { schoolId } = authResult

    // Validate input
    const parsed = subjectSelectionUpdateSchema.parse(data)

    const selection = await db.schoolSubjectSelection.findFirst({
      where: { id: selectionId, schoolId },
    })

    if (!selection) {
      return { success: false, error: "Selection not found" }
    }

    await db.schoolSubjectSelection.update({
      where: { id: selectionId },
      data: parsed,
    })

    revalidatePath("/", "layout")
    return { success: true }
  } catch (error) {
    console.error("[updateSubjectSelection] Error:", error)
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to update subject selection",
    }
  }
}

// ============================================================================
// Content overrides (hide/show chapters or lessons)
// ============================================================================

export async function toggleContentOverride(input: {
  catalogChapterId?: string | null
  catalogLessonId?: string | null
  isHidden: boolean
  reason?: string
}): Promise<ActionResponse> {
  try {
    const authResult = await requireSchoolAdmin()
    if (!authResult.ok) return { success: false, error: authResult.error }
    const { session, schoolId } = authResult
    const userId = session?.user?.id

    if (!userId) {
      return { success: false, error: "Missing user identity" }
    }

    const validated = contentOverrideSchema.parse(input)

    if (!validated.catalogChapterId && !validated.catalogLessonId) {
      return {
        success: false,
        error: "Must specify either a chapter or lesson",
      }
    }

    // Check for existing override
    const existing = await db.schoolContentOverride.findFirst({
      where: {
        schoolId,
        catalogChapterId: validated.catalogChapterId ?? null,
        catalogLessonId: validated.catalogLessonId ?? null,
      },
    })

    if (existing) {
      if (!validated.isHidden) {
        // Remove override (unhide)
        await db.schoolContentOverride.delete({ where: { id: existing.id } })
      } else {
        // Update override
        await db.schoolContentOverride.update({
          where: { id: existing.id },
          data: {
            isHidden: validated.isHidden,
            reason: validated.reason,
            overriddenBy: userId,
          },
        })
      }
    } else if (validated.isHidden) {
      // Create new override
      await db.schoolContentOverride.create({
        data: {
          schoolId,
          catalogChapterId: validated.catalogChapterId ?? null,
          catalogLessonId: validated.catalogLessonId ?? null,
          isHidden: true,
          reason: validated.reason,
          overriddenBy: userId,
        },
      })
    }

    revalidatePath("/", "layout")
    return { success: true }
  } catch (error) {
    console.error("[toggleContentOverride] Error:", error)
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to toggle content override",
    }
  }
}

// ============================================================================
// Query: Get school's catalog selections
// ============================================================================

export async function getSchoolCatalogSelections(): Promise<ActionResponse> {
  try {
    const authResult = await requireSchoolAdmin()
    if (!authResult.ok) return { success: false, error: authResult.error }
    const { schoolId } = authResult

    const selections = await db.schoolSubjectSelection.findMany({
      where: { schoolId },
      include: {
        subject: {
          select: {
            id: true,
            name: true,
            slug: true,
            department: true,
            levels: true,
            color: true,
            imageKey: true,
            status: true,
            totalChapters: true,
            totalLessons: true,
          },
        },
        grade: {
          select: {
            id: true,
            name: true,
            gradeNumber: true,
          },
        },
      },
      orderBy: [
        { grade: { gradeNumber: "asc" } },
        { subject: { sortOrder: "asc" } },
      ],
    })

    return { success: true, data: selections }
  } catch (error) {
    console.error("[getSchoolCatalogSelections] Error:", error)
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to fetch catalog selections",
    }
  }
}
