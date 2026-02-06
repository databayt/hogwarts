"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"

import type { YearLevelDetail, YearLevelRow } from "./types"
import {
  getYearLevelsSchema,
  yearLevelCreateSchema,
  yearLevelUpdateSchema,
  type YearLevelCreateInput,
  type YearLevelUpdateInput,
} from "./validation"

// ============================================================================
// Types
// ============================================================================

export type ActionResponse<T = void> =
  | { success: true; data: T }
  | { success: false; error: string }

const ACADEMIC_PATH = "/school/academic"

// ============================================================================
// Mutations
// ============================================================================

export async function createYearLevel(
  input: YearLevelCreateInput
): Promise<ActionResponse<{ id: string }>> {
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return { success: false, error: "Missing school context" }
    }

    const parsed = yearLevelCreateSchema.parse(input)

    // Check for duplicate level name
    const existingName = await db.yearLevel.findFirst({
      where: { schoolId, levelName: parsed.levelName },
      select: { id: true },
    })

    if (existingName) {
      return {
        success: false,
        error: `Level "${parsed.levelName}" already exists`,
      }
    }

    // Check for duplicate level order
    const existingOrder = await db.yearLevel.findFirst({
      where: { schoolId, levelOrder: parsed.levelOrder },
      select: { id: true },
    })

    if (existingOrder) {
      return {
        success: false,
        error: `Level order ${parsed.levelOrder} is already used`,
      }
    }

    const row = await db.yearLevel.create({
      data: {
        schoolId,
        levelName: parsed.levelName,
        lang: parsed.lang || "ar",
        levelOrder: parsed.levelOrder,
      },
    })

    revalidatePath(ACADEMIC_PATH)
    return { success: true, data: { id: row.id } }
  } catch (error) {
    console.error("[createYearLevel] Error:", error)

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: `Validation error: ${error.issues.map((e) => e.message).join(", ")}`,
      }
    }

    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to create year level",
    }
  }
}

export async function updateYearLevel(
  input: YearLevelUpdateInput
): Promise<ActionResponse<void>> {
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return { success: false, error: "Missing school context" }
    }

    const parsed = yearLevelUpdateSchema.parse(input)
    const { id, ...rest } = parsed

    // Verify year level exists
    const existing = await db.yearLevel.findFirst({
      where: { id, schoolId },
      select: { id: true },
    })

    if (!existing) {
      return { success: false, error: "Year level not found" }
    }

    // Check for duplicate name (exclude current)
    if (rest.levelName) {
      const duplicateName = await db.yearLevel.findFirst({
        where: { schoolId, levelName: rest.levelName, NOT: { id } },
        select: { id: true },
      })

      if (duplicateName) {
        return {
          success: false,
          error: `Level "${rest.levelName}" already exists`,
        }
      }
    }

    // Check for duplicate order (exclude current)
    if (rest.levelOrder) {
      const duplicateOrder = await db.yearLevel.findFirst({
        where: { schoolId, levelOrder: rest.levelOrder, NOT: { id } },
        select: { id: true },
      })

      if (duplicateOrder) {
        return {
          success: false,
          error: `Level order ${rest.levelOrder} is already used`,
        }
      }
    }

    const data: Record<string, unknown> = {}
    if (typeof rest.levelName !== "undefined") data.levelName = rest.levelName
    if (typeof rest.lang !== "undefined") data.lang = rest.lang
    if (typeof rest.levelOrder !== "undefined")
      data.levelOrder = rest.levelOrder

    await db.yearLevel.updateMany({ where: { id, schoolId }, data })

    revalidatePath(ACADEMIC_PATH)
    return { success: true, data: undefined }
  } catch (error) {
    console.error("[updateYearLevel] Error:", error)

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: `Validation error: ${error.issues.map((e) => e.message).join(", ")}`,
      }
    }

    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to update year level",
    }
  }
}

export async function deleteYearLevel(input: {
  id: string
}): Promise<ActionResponse<void>> {
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return { success: false, error: "Missing school context" }
    }

    const { id } = z.object({ id: z.string().min(1) }).parse(input)

    // Verify year level exists
    const existing = await db.yearLevel.findFirst({
      where: { id, schoolId },
      select: {
        id: true,
        _count: {
          select: { batches: true, studentYearLevels: true },
        },
      },
    })

    if (!existing) {
      return { success: false, error: "Year level not found" }
    }

    // Check for dependencies
    if (existing._count.batches > 0 || existing._count.studentYearLevels > 0) {
      return {
        success: false,
        error: "Cannot delete year level with associated batches or students",
      }
    }

    await db.yearLevel.deleteMany({ where: { id, schoolId } })

    revalidatePath(ACADEMIC_PATH)
    return { success: true, data: undefined }
  } catch (error) {
    console.error("[deleteYearLevel] Error:", error)

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: `Validation error: ${error.issues.map((e) => e.message).join(", ")}`,
      }
    }

    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to delete year level",
    }
  }
}

// ============================================================================
// Queries
// ============================================================================

export async function getYearLevel(input: {
  id: string
}): Promise<ActionResponse<YearLevelDetail | null>> {
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return { success: false, error: "Missing school context" }
    }

    const { id } = z.object({ id: z.string().min(1) }).parse(input)

    const level = await db.yearLevel.findFirst({
      where: { id, schoolId },
    })

    return { success: true, data: level as YearLevelDetail | null }
  } catch (error) {
    console.error("[getYearLevel] Error:", error)

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: `Validation error: ${error.issues.map((e) => e.message).join(", ")}`,
      }
    }

    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to fetch year level",
    }
  }
}

export async function getYearLevels(
  input?: Partial<z.infer<typeof getYearLevelsSchema>>
): Promise<ActionResponse<{ rows: YearLevelRow[]; total: number }>> {
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return { success: false, error: "Missing school context" }
    }

    const sp = getYearLevelsSchema.parse(input ?? {})

    const where: Record<string, unknown> = {
      schoolId,
      ...(sp.levelName
        ? { levelName: { contains: sp.levelName, mode: "insensitive" } }
        : {}),
    }

    const skip = (sp.page - 1) * sp.perPage
    const take = sp.perPage
    const orderBy =
      sp.sort && Array.isArray(sp.sort) && sp.sort.length
        ? sp.sort.map((s) => ({ [s.id]: s.desc ? "desc" : "asc" }))
        : [{ levelOrder: "asc" }]

    const [rows, count] = await Promise.all([
      db.yearLevel.findMany({
        where,
        orderBy,
        skip,
        take,
        include: {
          _count: {
            select: {
              batches: true,
              studentYearLevels: true,
            },
          },
        },
      }),
      db.yearLevel.count({ where }),
    ])

    const mapped: YearLevelRow[] = rows.map((l) => ({
      id: l.id,
      levelName: l.levelName,
      lang: l.lang,
      levelOrder: l.levelOrder,
      createdAt: l.createdAt.toISOString(),
      _count: l._count,
    }))

    return { success: true, data: { rows: mapped, total: count } }
  } catch (error) {
    console.error("[getYearLevels] Error:", error)

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: `Validation error: ${error.issues.map((e) => e.message).join(", ")}`,
      }
    }

    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to fetch year levels",
    }
  }
}

// Get all year levels for dropdown select
export async function getYearLevelOptions(): Promise<
  ActionResponse<
    Array<{
      id: string
      levelName: string
      lang: string
      levelOrder: number
    }>
  >
> {
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return { success: false, error: "Missing school context" }
    }

    const levels = await db.yearLevel.findMany({
      where: { schoolId },
      orderBy: { levelOrder: "asc" },
      select: {
        id: true,
        levelName: true,
        lang: true,
        levelOrder: true,
      },
    })

    return { success: true, data: levels }
  } catch (error) {
    console.error("[getYearLevelOptions] Error:", error)

    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to fetch year level options",
    }
  }
}
