"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { revalidatePath } from "next/cache"
import { auth } from "@/auth"

import { ACTION_ERRORS, actionError } from "@/lib/action-errors"
import type { ActionResponse } from "@/lib/action-response"
import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"
import { getText } from "@/components/translation/display"

import {
  createYearLevelSchema,
  deleteYearLevelSchema,
  updateYearLevelSchema,
} from "./validation"

// ============================================================================
// Get Year Levels
// ============================================================================

export async function getYearLevels(
  displayLang?: "ar" | "en"
): Promise<ActionResponse> {
  try {
    const session = await auth()
    if (!session?.user) {
      return actionError(ACTION_ERRORS.NOT_AUTHENTICATED)
    }

    const { schoolId, role } = await getTenantContext()

    if (!schoolId) {
      return actionError(ACTION_ERRORS.MISSING_SCHOOL)
    }

    // Check permissions - ADMIN or DEVELOPER can access
    if (role !== "DEVELOPER" && role !== "ADMIN") {
      return actionError(ACTION_ERRORS.UNAUTHORIZED)
    }

    const yearLevels = await db.yearLevel.findMany({
      where: { schoolId },
      include: {
        _count: {
          select: {
            studentYearLevels: true,
            batches: true,
          },
        },
      },
      orderBy: { levelOrder: "asc" },
    })

    // Translate levelName for display
    const lang = displayLang || "ar"
    const translatedYearLevels = await Promise.all(
      yearLevels.map(async (level) => ({
        ...level,
        levelName: await getText(
          level.levelName,
          (level.lang as "ar" | "en") || "ar",
          lang,
          schoolId!
        ),
      }))
    )

    return {
      success: true,
      data: { yearLevels: translatedYearLevels },
    }
  } catch (error) {
    console.error("Failed to fetch year levels:", error)
    return actionError(
      ACTION_ERRORS.LOAD_FAILED,
      error instanceof Error ? error.message : undefined
    )
  }
}

// ============================================================================
// Create Year Level
// ============================================================================

export async function createYearLevel(
  formData: FormData
): Promise<ActionResponse> {
  try {
    const session = await auth()
    if (!session?.user) {
      return actionError(ACTION_ERRORS.NOT_AUTHENTICATED)
    }

    const { schoolId, role } = await getTenantContext()

    if (!schoolId) {
      return actionError(ACTION_ERRORS.MISSING_SCHOOL)
    }

    if (role !== "DEVELOPER" && role !== "ADMIN") {
      return actionError(ACTION_ERRORS.UNAUTHORIZED)
    }

    const data = {
      levelName: formData.get("levelName") as string,
      lang: (formData.get("lang") as string) || "ar",
      levelOrder: parseInt(formData.get("levelOrder") as string, 10),
    }

    const validated = createYearLevelSchema.parse(data)

    // Check for duplicate level name
    const existingName = await db.yearLevel.findFirst({
      where: { schoolId, levelName: validated.levelName },
    })

    if (existingName) {
      return actionError(ACTION_ERRORS.ALREADY_EXISTS)
    }

    // Check for duplicate level order
    const existingOrder = await db.yearLevel.findFirst({
      where: { schoolId, levelOrder: validated.levelOrder },
    })

    if (existingOrder) {
      return actionError(ACTION_ERRORS.ALREADY_EXISTS)
    }

    const yearLevel = await db.yearLevel.create({
      data: {
        schoolId,
        levelName: validated.levelName,
        lang: validated.lang || "ar",
        levelOrder: validated.levelOrder,
      },
    })

    revalidatePath("/students/year-levels")
    return {
      success: true,
      data: { yearLevel },
    }
  } catch (error) {
    console.error("Failed to create year level:", error)
    return actionError(
      ACTION_ERRORS.YEAR_LEVEL_CREATE_FAILED,
      error instanceof Error ? error.message : undefined
    )
  }
}

// ============================================================================
// Update Year Level
// ============================================================================

export async function updateYearLevel(
  formData: FormData
): Promise<ActionResponse> {
  try {
    const session = await auth()
    if (!session?.user) {
      return actionError(ACTION_ERRORS.NOT_AUTHENTICATED)
    }

    const { schoolId, role } = await getTenantContext()

    if (!schoolId) {
      return actionError(ACTION_ERRORS.MISSING_SCHOOL)
    }

    if (role !== "DEVELOPER" && role !== "ADMIN") {
      return actionError(ACTION_ERRORS.UNAUTHORIZED)
    }

    const levelOrderValue = formData.get("levelOrder")
    const data = {
      id: formData.get("id") as string,
      levelName: (formData.get("levelName") as string) || undefined,
      lang: (formData.get("lang") as string) || undefined,
      levelOrder: levelOrderValue
        ? parseInt(levelOrderValue as string, 10)
        : undefined,
    }

    const validated = updateYearLevelSchema.parse(data)

    // Check ownership
    const existing = await db.yearLevel.findFirst({
      where: { id: validated.id, schoolId },
    })

    if (!existing) {
      return actionError(ACTION_ERRORS.NOT_FOUND)
    }

    // Check for duplicate name if changing name
    if (validated.levelName && validated.levelName !== existing.levelName) {
      const duplicate = await db.yearLevel.findFirst({
        where: {
          schoolId,
          levelName: validated.levelName,
          NOT: { id: validated.id },
        },
      })
      if (duplicate) {
        return actionError(ACTION_ERRORS.ALREADY_EXISTS)
      }
    }

    // Check for duplicate order if changing order
    if (
      validated.levelOrder !== undefined &&
      validated.levelOrder !== existing.levelOrder
    ) {
      const duplicateOrder = await db.yearLevel.findFirst({
        where: {
          schoolId,
          levelOrder: validated.levelOrder,
          NOT: { id: validated.id },
        },
      })
      if (duplicateOrder) {
        return actionError(ACTION_ERRORS.ALREADY_EXISTS)
      }
    }

    // Use updateMany with schoolId for defense-in-depth
    await db.yearLevel.updateMany({
      where: { id: validated.id, schoolId },
      data: {
        ...(validated.levelName && { levelName: validated.levelName }),
        ...(validated.lang !== undefined && {
          lang: validated.lang,
        }),
        ...(validated.levelOrder !== undefined && {
          levelOrder: validated.levelOrder,
        }),
      },
    })

    revalidatePath("/students/year-levels")
    return {
      success: true,
      data: null,
    }
  } catch (error) {
    console.error("Failed to update year level:", error)
    return actionError(
      ACTION_ERRORS.YEAR_LEVEL_UPDATE_FAILED,
      error instanceof Error ? error.message : undefined
    )
  }
}

// ============================================================================
// Delete Year Level
// ============================================================================

export async function deleteYearLevel(
  formData: FormData
): Promise<ActionResponse> {
  try {
    const session = await auth()
    if (!session?.user) {
      return actionError(ACTION_ERRORS.NOT_AUTHENTICATED)
    }

    const { schoolId, role } = await getTenantContext()

    if (!schoolId) {
      return actionError(ACTION_ERRORS.MISSING_SCHOOL)
    }

    if (role !== "DEVELOPER" && role !== "ADMIN") {
      return actionError(ACTION_ERRORS.UNAUTHORIZED)
    }

    const data = {
      id: formData.get("id") as string,
    }

    const validated = deleteYearLevelSchema.parse(data)

    // Check ownership and dependencies
    const existing = await db.yearLevel.findFirst({
      where: { id: validated.id, schoolId },
      include: {
        _count: {
          select: {
            studentYearLevels: true,
            batches: true,
          },
        },
      },
    })

    if (!existing) {
      return actionError(ACTION_ERRORS.NOT_FOUND)
    }

    // Check for dependencies
    if (existing._count.studentYearLevels > 0) {
      return actionError(ACTION_ERRORS.HAS_DEPENDENCIES)
    }

    if (existing._count.batches > 0) {
      return actionError(ACTION_ERRORS.HAS_DEPENDENCIES)
    }

    // Use deleteMany with schoolId for defense-in-depth
    await db.yearLevel.deleteMany({
      where: { id: validated.id, schoolId },
    })

    revalidatePath("/students/year-levels")
    return { success: true }
  } catch (error) {
    console.error("Failed to delete year level:", error)
    return actionError(
      ACTION_ERRORS.YEAR_LEVEL_DELETE_FAILED,
      error instanceof Error ? error.message : undefined
    )
  }
}
