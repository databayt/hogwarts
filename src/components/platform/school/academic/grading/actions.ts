"use server"

import { revalidatePath } from "next/cache"
import { Decimal } from "@prisma/client/runtime/library"
import { z } from "zod"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"

import type { ScoreRangeDetail, ScoreRangeRow } from "./types"
import {
  getScoreRangesSchema,
  scoreRangeCreateSchema,
  scoreRangeUpdateSchema,
  type ScoreRangeCreateInput,
  type ScoreRangeUpdateInput,
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

export async function createScoreRange(
  input: ScoreRangeCreateInput
): Promise<ActionResponse<{ id: string }>> {
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return { success: false, error: "Missing school context" }
    }

    const parsed = scoreRangeCreateSchema.parse(input)

    // Check for duplicate grade
    const existingGrade = await db.scoreRange.findFirst({
      where: { schoolId, grade: parsed.grade },
      select: { id: true },
    })

    if (existingGrade) {
      return {
        success: false,
        error: `Grade "${parsed.grade}" already exists in grading scale`,
      }
    }

    // Check for overlapping ranges
    const existingRanges = await db.scoreRange.findMany({
      where: { schoolId },
      select: { id: true, minScore: true, maxScore: true, grade: true },
    })

    for (const range of existingRanges) {
      const existingMin = Number(range.minScore)
      const existingMax = Number(range.maxScore)
      // Check if ranges overlap
      if (
        (parsed.minScore >= existingMin && parsed.minScore <= existingMax) ||
        (parsed.maxScore >= existingMin && parsed.maxScore <= existingMax) ||
        (parsed.minScore <= existingMin && parsed.maxScore >= existingMax)
      ) {
        return {
          success: false,
          error: `Score range ${parsed.minScore}-${parsed.maxScore} overlaps with existing grade "${range.grade}" (${existingMin}-${existingMax})`,
        }
      }
    }

    const row = await db.scoreRange.create({
      data: {
        schoolId,
        minScore: new Decimal(parsed.minScore),
        maxScore: new Decimal(parsed.maxScore),
        grade: parsed.grade,
      },
    })

    revalidatePath(ACADEMIC_PATH)
    return { success: true, data: { id: row.id } }
  } catch (error) {
    console.error("[createScoreRange] Error:", error)

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: `Validation error: ${error.issues.map((e) => e.message).join(", ")}`,
      }
    }

    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to create score range",
    }
  }
}

export async function updateScoreRange(
  input: ScoreRangeUpdateInput
): Promise<ActionResponse<void>> {
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return { success: false, error: "Missing school context" }
    }

    const parsed = scoreRangeUpdateSchema.parse(input)
    const { id, ...rest } = parsed

    // Verify score range exists
    const existing = await db.scoreRange.findFirst({
      where: { id, schoolId },
      select: { id: true, minScore: true, maxScore: true },
    })

    if (!existing) {
      return { success: false, error: "Score range not found" }
    }

    // Check for duplicate grade (exclude current)
    if (rest.grade) {
      const duplicateGrade = await db.scoreRange.findFirst({
        where: { schoolId, grade: rest.grade, NOT: { id } },
        select: { id: true },
      })

      if (duplicateGrade) {
        return {
          success: false,
          error: `Grade "${rest.grade}" already exists in grading scale`,
        }
      }
    }

    // Check for overlapping ranges (exclude current)
    const minScore = rest.minScore ?? Number(existing.minScore)
    const maxScore = rest.maxScore ?? Number(existing.maxScore)

    const existingRanges = await db.scoreRange.findMany({
      where: { schoolId, NOT: { id } },
      select: { id: true, minScore: true, maxScore: true, grade: true },
    })

    for (const range of existingRanges) {
      const existingMin = Number(range.minScore)
      const existingMax = Number(range.maxScore)
      if (
        (minScore >= existingMin && minScore <= existingMax) ||
        (maxScore >= existingMin && maxScore <= existingMax) ||
        (minScore <= existingMin && maxScore >= existingMax)
      ) {
        return {
          success: false,
          error: `Score range ${minScore}-${maxScore} overlaps with existing grade "${range.grade}" (${existingMin}-${existingMax})`,
        }
      }
    }

    const data: Record<string, unknown> = {}
    if (typeof rest.minScore !== "undefined")
      data.minScore = new Decimal(rest.minScore)
    if (typeof rest.maxScore !== "undefined")
      data.maxScore = new Decimal(rest.maxScore)
    if (typeof rest.grade !== "undefined") data.grade = rest.grade

    await db.scoreRange.updateMany({ where: { id, schoolId }, data })

    revalidatePath(ACADEMIC_PATH)
    return { success: true, data: undefined }
  } catch (error) {
    console.error("[updateScoreRange] Error:", error)

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: `Validation error: ${error.issues.map((e) => e.message).join(", ")}`,
      }
    }

    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to update score range",
    }
  }
}

export async function deleteScoreRange(input: {
  id: string
}): Promise<ActionResponse<void>> {
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return { success: false, error: "Missing school context" }
    }

    const { id } = z.object({ id: z.string().min(1) }).parse(input)

    // Verify score range exists
    const existing = await db.scoreRange.findFirst({
      where: { id, schoolId },
      select: { id: true },
    })

    if (!existing) {
      return { success: false, error: "Score range not found" }
    }

    await db.scoreRange.deleteMany({ where: { id, schoolId } })

    revalidatePath(ACADEMIC_PATH)
    return { success: true, data: undefined }
  } catch (error) {
    console.error("[deleteScoreRange] Error:", error)

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: `Validation error: ${error.issues.map((e) => e.message).join(", ")}`,
      }
    }

    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to delete score range",
    }
  }
}

// ============================================================================
// Queries
// ============================================================================

export async function getScoreRange(input: {
  id: string
}): Promise<ActionResponse<ScoreRangeDetail | null>> {
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return { success: false, error: "Missing school context" }
    }

    const { id } = z.object({ id: z.string().min(1) }).parse(input)

    const range = await db.scoreRange.findFirst({
      where: { id, schoolId },
    })

    if (!range) {
      return { success: true, data: null }
    }

    return {
      success: true,
      data: {
        id: range.id,
        schoolId: range.schoolId,
        minScore: Number(range.minScore),
        maxScore: Number(range.maxScore),
        grade: range.grade,
        createdAt: range.createdAt,
        updatedAt: range.updatedAt,
      },
    }
  } catch (error) {
    console.error("[getScoreRange] Error:", error)

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: `Validation error: ${error.issues.map((e) => e.message).join(", ")}`,
      }
    }

    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to fetch score range",
    }
  }
}

export async function getScoreRanges(
  input?: Partial<z.infer<typeof getScoreRangesSchema>>
): Promise<ActionResponse<{ rows: ScoreRangeRow[]; total: number }>> {
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return { success: false, error: "Missing school context" }
    }

    const sp = getScoreRangesSchema.parse(input ?? {})

    const where: Record<string, unknown> = {
      schoolId,
      ...(sp.grade
        ? { grade: { contains: sp.grade, mode: "insensitive" } }
        : {}),
    }

    const skip = (sp.page - 1) * sp.perPage
    const take = sp.perPage
    const orderBy =
      sp.sort && Array.isArray(sp.sort) && sp.sort.length
        ? sp.sort.map((s) => ({ [s.id]: s.desc ? "desc" : "asc" }))
        : [{ minScore: "desc" }]

    const [rows, count] = await Promise.all([
      db.scoreRange.findMany({
        where,
        orderBy,
        skip,
        take,
      }),
      db.scoreRange.count({ where }),
    ])

    const mapped: ScoreRangeRow[] = rows.map((r) => ({
      id: r.id,
      minScore: Number(r.minScore),
      maxScore: Number(r.maxScore),
      grade: r.grade,
      createdAt: r.createdAt.toISOString(),
    }))

    return { success: true, data: { rows: mapped, total: count } }
  } catch (error) {
    console.error("[getScoreRanges] Error:", error)

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: `Validation error: ${error.issues.map((e) => e.message).join(", ")}`,
      }
    }

    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to fetch score ranges",
    }
  }
}

// Get all score ranges for dropdown/display
export async function getScoreRangeOptions(): Promise<
  ActionResponse<
    Array<{ id: string; minScore: number; maxScore: number; grade: string }>
  >
> {
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return { success: false, error: "Missing school context" }
    }

    const ranges = await db.scoreRange.findMany({
      where: { schoolId },
      orderBy: { minScore: "desc" },
      select: {
        id: true,
        minScore: true,
        maxScore: true,
        grade: true,
      },
    })

    return {
      success: true,
      data: ranges.map((r) => ({
        id: r.id,
        minScore: Number(r.minScore),
        maxScore: Number(r.maxScore),
        grade: r.grade,
      })),
    }
  } catch (error) {
    console.error("[getScoreRangeOptions] Error:", error)

    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to fetch score range options",
    }
  }
}
