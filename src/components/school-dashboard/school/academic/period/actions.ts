"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"

import type { PeriodDetail, PeriodRow } from "./types"
import {
  getPeriodsSchema,
  periodCreateSchema,
  periodUpdateSchema,
  type PeriodCreateInput,
  type PeriodUpdateInput,
} from "./validation"

// ============================================================================
// Types
// ============================================================================

export type ActionResponse<T = void> =
  | { success: true; data: T }
  | { success: false; error: string }

const ACADEMIC_PATH = "/school/academic"

// Helper to convert time string to Date
function timeStringToDate(timeStr: string): Date {
  const [hours, minutes] = timeStr.split(":").map(Number)
  const date = new Date()
  date.setHours(hours, minutes, 0, 0)
  return date
}

// Helper to convert Date to time string
function dateToTimeString(date: Date): string {
  return date.toTimeString().slice(0, 5)
}

// ============================================================================
// Mutations
// ============================================================================

export async function createPeriod(
  input: PeriodCreateInput
): Promise<ActionResponse<{ id: string }>> {
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return { success: false, error: "Missing school context" }
    }

    const parsed = periodCreateSchema.parse(input)

    // Verify school year exists
    const year = await db.schoolYear.findFirst({
      where: { id: parsed.yearId, schoolId },
      select: { id: true },
    })

    if (!year) {
      return { success: false, error: "Academic year not found" }
    }

    // Check for duplicate period name in same year
    const existing = await db.period.findFirst({
      where: { schoolId, yearId: parsed.yearId, name: parsed.name },
      select: { id: true },
    })

    if (existing) {
      return {
        success: false,
        error: `Period "${parsed.name}" already exists for this academic year`,
      }
    }

    const row = await db.period.create({
      data: {
        schoolId,
        yearId: parsed.yearId,
        name: parsed.name,
        startTime: timeStringToDate(parsed.startTime),
        endTime: timeStringToDate(parsed.endTime),
      },
    })

    revalidatePath(ACADEMIC_PATH)
    return { success: true, data: { id: row.id } }
  } catch (error) {
    console.error("[createPeriod] Error:", error)

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: `Validation error: ${error.issues.map((e) => e.message).join(", ")}`,
      }
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create period",
    }
  }
}

export async function updatePeriod(
  input: PeriodUpdateInput
): Promise<ActionResponse<void>> {
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return { success: false, error: "Missing school context" }
    }

    const parsed = periodUpdateSchema.parse(input)
    const { id, ...rest } = parsed

    // Verify period exists
    const existing = await db.period.findFirst({
      where: { id, schoolId },
      select: { id: true, yearId: true },
    })

    if (!existing) {
      return { success: false, error: "Period not found" }
    }

    // Check for duplicate name (exclude current)
    if (rest.name) {
      const yearId = rest.yearId || existing.yearId
      const duplicate = await db.period.findFirst({
        where: { schoolId, yearId, name: rest.name, NOT: { id } },
        select: { id: true },
      })

      if (duplicate) {
        return {
          success: false,
          error: `Period "${rest.name}" already exists for this academic year`,
        }
      }
    }

    const data: Record<string, unknown> = {}
    if (typeof rest.yearId !== "undefined") data.yearId = rest.yearId
    if (typeof rest.name !== "undefined") data.name = rest.name
    if (typeof rest.startTime !== "undefined")
      data.startTime = timeStringToDate(rest.startTime)
    if (typeof rest.endTime !== "undefined")
      data.endTime = timeStringToDate(rest.endTime)

    await db.period.updateMany({ where: { id, schoolId }, data })

    revalidatePath(ACADEMIC_PATH)
    return { success: true, data: undefined }
  } catch (error) {
    console.error("[updatePeriod] Error:", error)

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: `Validation error: ${error.issues.map((e) => e.message).join(", ")}`,
      }
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update period",
    }
  }
}

export async function deletePeriod(input: {
  id: string
}): Promise<ActionResponse<void>> {
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return { success: false, error: "Missing school context" }
    }

    const { id } = z.object({ id: z.string().min(1) }).parse(input)

    // Verify period exists
    const existing = await db.period.findFirst({
      where: { id, schoolId },
      select: { id: true },
    })

    if (!existing) {
      return { success: false, error: "Period not found" }
    }

    await db.period.deleteMany({ where: { id, schoolId } })

    revalidatePath(ACADEMIC_PATH)
    return { success: true, data: undefined }
  } catch (error) {
    console.error("[deletePeriod] Error:", error)

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: `Validation error: ${error.issues.map((e) => e.message).join(", ")}`,
      }
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete period",
    }
  }
}

// ============================================================================
// Queries
// ============================================================================

export async function getPeriod(input: {
  id: string
}): Promise<ActionResponse<PeriodDetail | null>> {
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return { success: false, error: "Missing school context" }
    }

    const { id } = z.object({ id: z.string().min(1) }).parse(input)

    const period = await db.period.findFirst({
      where: { id, schoolId },
      include: {
        schoolYear: {
          select: {
            id: true,
            yearName: true,
          },
        },
      },
    })

    return { success: true, data: period as PeriodDetail | null }
  } catch (error) {
    console.error("[getPeriod] Error:", error)

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: `Validation error: ${error.issues.map((e) => e.message).join(", ")}`,
      }
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch period",
    }
  }
}

export async function getPeriods(
  input?: Partial<z.infer<typeof getPeriodsSchema>>
): Promise<ActionResponse<{ rows: PeriodRow[]; total: number }>> {
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return { success: false, error: "Missing school context" }
    }

    const sp = getPeriodsSchema.parse(input ?? {})

    const where: Record<string, unknown> = {
      schoolId,
      ...(sp.yearId ? { yearId: sp.yearId } : {}),
      ...(sp.name ? { name: { contains: sp.name, mode: "insensitive" } } : {}),
    }

    const skip = (sp.page - 1) * sp.perPage
    const take = sp.perPage
    const orderBy =
      sp.sort && Array.isArray(sp.sort) && sp.sort.length
        ? sp.sort.map((s) => ({ [s.id]: s.desc ? "desc" : "asc" }))
        : [{ startTime: "asc" }]

    const [rows, count] = await Promise.all([
      db.period.findMany({
        where,
        orderBy,
        skip,
        take,
        include: {
          schoolYear: {
            select: {
              id: true,
              yearName: true,
            },
          },
        },
      }),
      db.period.count({ where }),
    ])

    const mapped: PeriodRow[] = rows.map((p) => ({
      id: p.id,
      yearId: p.yearId,
      yearName: p.schoolYear.yearName,
      name: p.name,
      startTime: dateToTimeString(p.startTime),
      endTime: dateToTimeString(p.endTime),
      createdAt: p.createdAt.toISOString(),
    }))

    return { success: true, data: { rows: mapped, total: count } }
  } catch (error) {
    console.error("[getPeriods] Error:", error)

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: `Validation error: ${error.issues.map((e) => e.message).join(", ")}`,
      }
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch periods",
    }
  }
}

// Get all periods for dropdown select
export async function getPeriodOptions(): Promise<
  ActionResponse<Array<{ id: string; name: string; yearName: string }>>
> {
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return { success: false, error: "Missing school context" }
    }

    const periods = await db.period.findMany({
      where: { schoolId },
      orderBy: [{ schoolYear: { startDate: "desc" } }, { startTime: "asc" }],
      select: {
        id: true,
        name: true,
        schoolYear: {
          select: {
            yearName: true,
          },
        },
      },
    })

    return {
      success: true,
      data: periods.map((p) => ({
        id: p.id,
        name: p.name,
        yearName: p.schoolYear.yearName,
      })),
    }
  } catch (error) {
    console.error("[getPeriodOptions] Error:", error)

    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to fetch period options",
    }
  }
}
