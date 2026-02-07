"use server"

import { revalidatePath } from "next/cache"

import { getDisplayText } from "@/lib/content-display"
import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"

import type { ActionResult } from "./types"
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
): Promise<ActionResult> {
  try {
    const { schoolId, role } = await getTenantContext()

    if (!schoolId) {
      return { success: false, message: "School not found" }
    }

    // Check permissions - ADMIN or DEVELOPER can access
    if (role !== "DEVELOPER" && role !== "ADMIN") {
      return { success: false, message: "Insufficient permissions" }
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
        levelName: await getDisplayText(
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
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to fetch year levels",
    }
  }
}

// ============================================================================
// Create Year Level
// ============================================================================

export async function createYearLevel(
  formData: FormData
): Promise<ActionResult> {
  try {
    const { schoolId, role } = await getTenantContext()

    if (!schoolId) {
      return { success: false, message: "School not found" }
    }

    if (role !== "DEVELOPER" && role !== "ADMIN") {
      return { success: false, message: "Insufficient permissions" }
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
      return {
        success: false,
        message: "A year level with this name already exists",
      }
    }

    // Check for duplicate level order
    const existingOrder = await db.yearLevel.findFirst({
      where: { schoolId, levelOrder: validated.levelOrder },
    })

    if (existingOrder) {
      return {
        success: false,
        message: `Level order ${validated.levelOrder} is already in use`,
      }
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
      message: "Year level created successfully",
      data: { yearLevel },
    }
  } catch (error) {
    console.error("Failed to create year level:", error)
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to create year level",
    }
  }
}

// ============================================================================
// Update Year Level
// ============================================================================

export async function updateYearLevel(
  formData: FormData
): Promise<ActionResult> {
  try {
    const { schoolId, role } = await getTenantContext()

    if (!schoolId) {
      return { success: false, message: "School not found" }
    }

    if (role !== "DEVELOPER" && role !== "ADMIN") {
      return { success: false, message: "Insufficient permissions" }
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
      return { success: false, message: "Year level not found" }
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
        return {
          success: false,
          message: "A year level with this name already exists",
        }
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
        return {
          success: false,
          message: `Level order ${validated.levelOrder} is already in use`,
        }
      }
    }

    const yearLevel = await db.yearLevel.update({
      where: { id: validated.id },
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
      message: "Year level updated successfully",
      data: { yearLevel },
    }
  } catch (error) {
    console.error("Failed to update year level:", error)
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to update year level",
    }
  }
}

// ============================================================================
// Delete Year Level
// ============================================================================

export async function deleteYearLevel(
  formData: FormData
): Promise<ActionResult> {
  try {
    const { schoolId, role } = await getTenantContext()

    if (!schoolId) {
      return { success: false, message: "School not found" }
    }

    if (role !== "DEVELOPER" && role !== "ADMIN") {
      return { success: false, message: "Insufficient permissions" }
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
      return { success: false, message: "Year level not found" }
    }

    // Check for dependencies
    if (existing._count.studentYearLevels > 0) {
      return {
        success: false,
        message: `Cannot delete year level with ${existing._count.studentYearLevels} enrolled student(s). Please reassign students first.`,
      }
    }

    if (existing._count.batches > 0) {
      return {
        success: false,
        message: `Cannot delete year level with ${existing._count.batches} batch(es). Please reassign batches first.`,
      }
    }

    await db.yearLevel.delete({
      where: { id: validated.id },
    })

    revalidatePath("/students/year-levels")
    return { success: true, message: "Year level deleted successfully" }
  } catch (error) {
    console.error("Failed to delete year level:", error)
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to delete year level",
    }
  }
}
