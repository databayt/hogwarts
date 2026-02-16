"use server"

import { revalidatePath } from "next/cache"
import { auth } from "@/auth"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"

import { contentOverrideSchema, subjectSelectionSchema } from "./validation"

// ============================================================================
// Authorization helper — ADMIN or DEVELOPER, requires schoolId
// ============================================================================

async function requireSchoolAdmin() {
  const session = await auth()
  const role = session?.user?.role
  if (role !== "ADMIN" && role !== "DEVELOPER") {
    throw new Error("Unauthorized: ADMIN or DEVELOPER role required")
  }
  const { schoolId } = await getTenantContext()
  if (!schoolId) {
    throw new Error("Missing school context")
  }
  return { session, schoolId }
}

// ============================================================================
// Toggle subject selection (add/remove from school)
// ============================================================================

export async function toggleSubjectSelection(
  catalogSubjectId: string,
  gradeId: string,
  streamId?: string | null
) {
  const { schoolId } = await requireSchoolAdmin()

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

    revalidatePath("/subjects/catalog")
    return { success: true, selected: false }
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

  revalidatePath("/subjects/catalog")
  return { success: true, selected: true }
}

// ============================================================================
// Bulk select subjects for a grade
// ============================================================================

export async function bulkSelectSubjects(
  catalogSubjectIds: string[],
  gradeId: string
) {
  const { schoolId } = await requireSchoolAdmin()

  let added = 0
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
      added++
    }
  }

  revalidatePath("/subjects/catalog")
  return { success: true, added }
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
) {
  const { schoolId } = await requireSchoolAdmin()

  const selection = await db.schoolSubjectSelection.findFirst({
    where: { id: selectionId, schoolId },
  })

  if (!selection) {
    throw new Error("Selection not found")
  }

  await db.schoolSubjectSelection.update({
    where: { id: selectionId },
    data,
  })

  revalidatePath("/subjects/catalog")
  return { success: true }
}

// ============================================================================
// Content overrides (hide/show chapters or lessons)
// ============================================================================

export async function toggleContentOverride(input: {
  catalogChapterId?: string | null
  catalogLessonId?: string | null
  isHidden: boolean
  reason?: string
}) {
  const { schoolId } = await requireSchoolAdmin()
  const session = await auth()
  const userId = session?.user?.id

  const validated = contentOverrideSchema.parse(input)

  if (!validated.catalogChapterId && !validated.catalogLessonId) {
    throw new Error("Must specify either a chapter or lesson")
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
          overriddenBy: userId || "unknown",
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
        overriddenBy: userId || "unknown",
      },
    })
  }

  revalidatePath("/subjects/catalog")
  return { success: true }
}

// ============================================================================
// Query: Get school's catalog selections
// ============================================================================

export async function getSchoolCatalogSelections() {
  const { schoolId } = await requireSchoolAdmin()

  const selections = await db.schoolSubjectSelection.findMany({
    where: { schoolId },
    include: {
      catalogSubject: {
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
      { catalogSubject: { sortOrder: "asc" } },
    ],
  })

  return selections
}
