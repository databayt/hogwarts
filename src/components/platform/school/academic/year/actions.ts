"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"

import type { SchoolYearDetail, SchoolYearRow } from "./types"
import {
  getSchoolYearsSchema,
  schoolYearCreateSchema,
  schoolYearUpdateSchema,
  type SchoolYearCreateInput,
  type SchoolYearUpdateInput,
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

export async function createSchoolYear(
  input: SchoolYearCreateInput
): Promise<ActionResponse<{ id: string }>> {
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return { success: false, error: "Missing school context" }
    }

    const parsed = schoolYearCreateSchema.parse(input)

    // Check for duplicate year name
    const existing = await db.schoolYear.findFirst({
      where: { schoolId, yearName: parsed.yearName },
      select: { id: true },
    })

    if (existing) {
      return {
        success: false,
        error: "A school year with this name already exists",
      }
    }

    const row = await db.schoolYear.create({
      data: {
        schoolId,
        yearName: parsed.yearName,
        startDate: parsed.startDate,
        endDate: parsed.endDate,
      },
    })

    revalidatePath(ACADEMIC_PATH)
    return { success: true, data: { id: row.id } }
  } catch (error) {
    console.error("[createSchoolYear] Error:", error)

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: `Validation error: ${error.issues.map((e) => e.message).join(", ")}`,
      }
    }

    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to create school year",
    }
  }
}

export async function updateSchoolYear(
  input: SchoolYearUpdateInput
): Promise<ActionResponse<void>> {
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return { success: false, error: "Missing school context" }
    }

    const parsed = schoolYearUpdateSchema.parse(input)
    const { id, ...rest } = parsed

    // Verify school year exists
    const existing = await db.schoolYear.findFirst({
      where: { id, schoolId },
      select: { id: true },
    })

    if (!existing) {
      return { success: false, error: "School year not found" }
    }

    // Check for duplicate year name (exclude current)
    if (rest.yearName) {
      const duplicate = await db.schoolYear.findFirst({
        where: { schoolId, yearName: rest.yearName, NOT: { id } },
        select: { id: true },
      })

      if (duplicate) {
        return {
          success: false,
          error: "A school year with this name already exists",
        }
      }
    }

    const data: Record<string, unknown> = {}
    if (typeof rest.yearName !== "undefined") data.yearName = rest.yearName
    if (typeof rest.startDate !== "undefined") data.startDate = rest.startDate
    if (typeof rest.endDate !== "undefined") data.endDate = rest.endDate

    await db.schoolYear.updateMany({ where: { id, schoolId }, data })

    revalidatePath(ACADEMIC_PATH)
    return { success: true, data: undefined }
  } catch (error) {
    console.error("[updateSchoolYear] Error:", error)

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: `Validation error: ${error.issues.map((e) => e.message).join(", ")}`,
      }
    }

    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to update school year",
    }
  }
}

export async function deleteSchoolYear(input: {
  id: string
}): Promise<ActionResponse<void>> {
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return { success: false, error: "Missing school context" }
    }

    const { id } = z.object({ id: z.string().min(1) }).parse(input)

    // Verify school year exists
    const existing = await db.schoolYear.findFirst({
      where: { id, schoolId },
      select: {
        id: true,
        _count: {
          select: { terms: true, periods: true },
        },
      },
    })

    if (!existing) {
      return { success: false, error: "School year not found" }
    }

    // Check for dependencies
    if (existing._count.terms > 0 || existing._count.periods > 0) {
      return {
        success: false,
        error:
          "Cannot delete school year with associated terms or periods. Delete them first.",
      }
    }

    await db.schoolYear.deleteMany({ where: { id, schoolId } })

    revalidatePath(ACADEMIC_PATH)
    return { success: true, data: undefined }
  } catch (error) {
    console.error("[deleteSchoolYear] Error:", error)

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: `Validation error: ${error.issues.map((e) => e.message).join(", ")}`,
      }
    }

    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to delete school year",
    }
  }
}

// ============================================================================
// Queries
// ============================================================================

export async function getSchoolYear(input: {
  id: string
}): Promise<ActionResponse<SchoolYearDetail | null>> {
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return { success: false, error: "Missing school context" }
    }

    const { id } = z.object({ id: z.string().min(1) }).parse(input)

    const year = await db.schoolYear.findFirst({
      where: { id, schoolId },
      include: {
        terms: {
          orderBy: { termNumber: "asc" },
          select: {
            id: true,
            termNumber: true,
            startDate: true,
            endDate: true,
            isActive: true,
          },
        },
        periods: {
          orderBy: { startTime: "asc" },
          select: {
            id: true,
            name: true,
            startTime: true,
            endTime: true,
          },
        },
      },
    })

    return { success: true, data: year as SchoolYearDetail | null }
  } catch (error) {
    console.error("[getSchoolYear] Error:", error)

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: `Validation error: ${error.issues.map((e) => e.message).join(", ")}`,
      }
    }

    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to fetch school year",
    }
  }
}

export async function getSchoolYears(
  input?: Partial<z.infer<typeof getSchoolYearsSchema>>
): Promise<ActionResponse<{ rows: SchoolYearRow[]; total: number }>> {
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return { success: false, error: "Missing school context" }
    }

    const sp = getSchoolYearsSchema.parse(input ?? {})

    const where: Record<string, unknown> = {
      schoolId,
      ...(sp.yearName
        ? { yearName: { contains: sp.yearName, mode: "insensitive" } }
        : {}),
    }

    const skip = (sp.page - 1) * sp.perPage
    const take = sp.perPage
    const orderBy =
      sp.sort && Array.isArray(sp.sort) && sp.sort.length
        ? sp.sort.map((s) => ({ [s.id]: s.desc ? "desc" : "asc" }))
        : [{ startDate: "desc" }]

    const [rows, count] = await Promise.all([
      db.schoolYear.findMany({
        where,
        orderBy,
        skip,
        take,
        include: {
          _count: {
            select: {
              terms: true,
              periods: true,
            },
          },
        },
      }),
      db.schoolYear.count({ where }),
    ])

    const mapped: SchoolYearRow[] = rows.map((y) => ({
      id: y.id,
      yearName: y.yearName,
      startDate: y.startDate.toISOString(),
      endDate: y.endDate.toISOString(),
      createdAt: y.createdAt.toISOString(),
      _count: y._count,
    }))

    return { success: true, data: { rows: mapped, total: count } }
  } catch (error) {
    console.error("[getSchoolYears] Error:", error)

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: `Validation error: ${error.issues.map((e) => e.message).join(", ")}`,
      }
    }

    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to fetch school years",
    }
  }
}

// Get all school years for dropdown select (simplified)
export async function getSchoolYearOptions(): Promise<
  ActionResponse<Array<{ id: string; yearName: string }>>
> {
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return { success: false, error: "Missing school context" }
    }

    const years = await db.schoolYear.findMany({
      where: { schoolId },
      orderBy: { startDate: "desc" },
      select: {
        id: true,
        yearName: true,
      },
    })

    return { success: true, data: years }
  } catch (error) {
    console.error("[getSchoolYearOptions] Error:", error)

    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to fetch school year options",
    }
  }
}
