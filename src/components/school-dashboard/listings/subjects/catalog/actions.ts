"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { revalidatePath } from "next/cache"
import { auth } from "@/auth"

import { ACTION_ERRORS, actionError } from "@/lib/action-errors"
import type { ActionResponse } from "@/lib/action-response"
import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"

import {
  contentOverrideSchema,
  instructorPreferenceSchema,
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
    return { ok: false, ...actionError(ACTION_ERRORS.MISSING_SCHOOL) }
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

    // Verify subject is PUBLISHED before allowing selection
    const existing = await db.schoolSubjectSelection.findFirst({
      where: {
        schoolId,
        catalogSubjectId,
        gradeId,
        streamId: streamId ?? null,
      },
    })

    if (!existing) {
      const subject = await db.catalogSubject.findFirst({
        where: { id: catalogSubjectId, status: "PUBLISHED" },
        select: { id: true },
      })
      if (!subject) {
        return {
          success: false,
          error: "Subject is not available for selection",
        }
      }
    }

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

    // Batch insert with skipDuplicates instead of N+1 find+create loop
    const { count: added } = await db.schoolSubjectSelection.createMany({
      data: catalogSubjectIds.map((catalogSubjectId) => ({
        schoolId,
        catalogSubjectId,
        gradeId,
        streamId: null,
        isRequired: true,
        isActive: true,
      })),
      skipDuplicates: true,
    })

    // Batch update usage counts with single raw query
    if (added > 0) {
      await db.$executeRawUnsafe(
        `UPDATE catalog_subjects SET "usageCount" = (
          SELECT COUNT(*) FROM school_subject_selections
          WHERE school_subject_selections."catalogSubjectId" = catalog_subjects.id
        ) WHERE id = ANY($1::text[])`,
        catalogSubjectIds
      )
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
      return actionError(ACTION_ERRORS.NOT_FOUND)
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
  lessonVideoId?: string | null
  isHidden: boolean
  reason?: string
}): Promise<ActionResponse> {
  try {
    const authResult = await requireSchoolAdmin()
    if (!authResult.ok) return { success: false, error: authResult.error }
    const { session, schoolId } = authResult
    const userId = session?.user?.id

    if (!userId) {
      return actionError(ACTION_ERRORS.UNKNOWN)
    }

    const validated = contentOverrideSchema.parse(input)

    if (
      !validated.catalogChapterId &&
      !validated.catalogLessonId &&
      !validated.lessonVideoId
    ) {
      return {
        success: false,
        error: "Must specify a chapter, lesson, or video",
      }
    }

    // Verify the school has selected the parent subject for this content
    if (validated.catalogChapterId) {
      const chapter = await db.catalogChapter.findFirst({
        where: { id: validated.catalogChapterId },
        select: { subjectId: true },
      })
      if (chapter) {
        const hasSelection = await db.schoolSubjectSelection.findFirst({
          where: { schoolId, catalogSubjectId: chapter.subjectId },
          select: { id: true },
        })
        if (!hasSelection) {
          return {
            success: false,
            error: "School has not selected this subject",
          }
        }
      }
    }

    // Check for existing override
    const existing = await db.schoolContentOverride.findFirst({
      where: {
        schoolId,
        catalogChapterId: validated.catalogChapterId ?? null,
        catalogLessonId: validated.catalogLessonId ?? null,
        lessonVideoId: validated.lessonVideoId ?? null,
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
          lessonVideoId: validated.lessonVideoId ?? null,
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

// ============================================================================
// Instructor preferences (set default video source per subject)
// ============================================================================

export async function setInstructorPreference(input: {
  catalogSubjectId: string
  preferredSchoolId?: string | null
  preferredUserId?: string | null
}): Promise<ActionResponse> {
  try {
    const authResult = await requireSchoolAdmin()
    if (!authResult.ok) return { success: false, error: authResult.error }
    const { schoolId } = authResult

    const validated = instructorPreferenceSchema.parse(input)

    await db.schoolInstructorPreference.upsert({
      where: {
        schoolId_catalogSubjectId: {
          schoolId,
          catalogSubjectId: validated.catalogSubjectId,
        },
      },
      update: {
        preferredSchoolId: validated.preferredSchoolId ?? null,
        preferredUserId: validated.preferredUserId ?? null,
      },
      create: {
        schoolId,
        catalogSubjectId: validated.catalogSubjectId,
        preferredSchoolId: validated.preferredSchoolId ?? null,
        preferredUserId: validated.preferredUserId ?? null,
      },
    })

    revalidatePath("/", "layout")
    return { success: true }
  } catch (error) {
    console.error("[setInstructorPreference] Error:", error)
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to set instructor preference",
    }
  }
}

export async function getInstructorPreference(
  catalogSubjectId: string
): Promise<ActionResponse> {
  try {
    const authResult = await requireSchoolAdmin()
    if (!authResult.ok) return { success: false, error: authResult.error }
    const { schoolId } = authResult

    const preference = await db.schoolInstructorPreference.findUnique({
      where: {
        schoolId_catalogSubjectId: {
          schoolId,
          catalogSubjectId,
        },
      },
    })

    return { success: true, data: preference }
  } catch (error) {
    console.error("[getInstructorPreference] Error:", error)
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to fetch instructor preference",
    }
  }
}

/**
 * Get available instructor sources for a subject.
 * Groups approved videos by school/user and returns video counts.
 */
export async function getAvailableInstructors(
  catalogSubjectId: string
): Promise<ActionResponse> {
  try {
    const authResult = await requireSchoolAdmin()
    if (!authResult.ok) return { success: false, error: authResult.error }
    const { schoolId } = authResult

    // Get all approved videos for lessons in this subject
    const videos = await db.lessonVideo.findMany({
      where: {
        lesson: { chapter: { subjectId: catalogSubjectId } },
        approvalStatus: "APPROVED",
        OR: [{ schoolId }, { visibility: "PUBLIC" }],
      },
      select: {
        schoolId: true,
        isFeatured: true,
        viewCount: true,
        school: { select: { id: true, name: true } },
        user: { select: { id: true, username: true, image: true } },
      },
    })

    // Group by source (school or individual teacher)
    const sourceMap = new Map<
      string,
      {
        type: "platform" | "school" | "teacher"
        id: string | null
        name: string
        image: string | null
        videoCount: number
        totalViews: number
      }
    >()

    for (const v of videos) {
      const key =
        v.isFeatured && !v.schoolId
          ? "platform"
          : v.schoolId
            ? `school:${v.schoolId}`
            : `teacher:${v.user.id}`

      const existing = sourceMap.get(key)
      if (existing) {
        existing.videoCount++
        existing.totalViews += v.viewCount
      } else {
        sourceMap.set(key, {
          type:
            v.isFeatured && !v.schoolId
              ? "platform"
              : v.schoolId
                ? "school"
                : "teacher",
          id: v.schoolId ?? v.user.id,
          name:
            v.isFeatured && !v.schoolId
              ? "Hogwarts"
              : (v.school?.name ?? v.user.username ?? "Unknown"),
          image: v.user.image,
          videoCount: 1,
          totalViews: v.viewCount,
        })
      }
    }

    // Get current preference
    const preference = await db.schoolInstructorPreference.findUnique({
      where: {
        schoolId_catalogSubjectId: { schoolId, catalogSubjectId },
      },
    })

    const instructors = Array.from(sourceMap.values()).sort(
      (a, b) => b.videoCount - a.videoCount
    )

    return {
      success: true,
      data: {
        instructors,
        currentPreference: preference,
      },
    }
  } catch (error) {
    console.error("[getAvailableInstructors] Error:", error)
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to fetch available instructors",
    }
  }
}
