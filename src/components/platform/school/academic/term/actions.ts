"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"

import type { TermDetail, TermRow } from "./types"
import {
  getTermsSchema,
  termCreateSchema,
  termUpdateSchema,
  type TermCreateInput,
  type TermUpdateInput,
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

export async function createTerm(
  input: TermCreateInput
): Promise<ActionResponse<{ id: string }>> {
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return { success: false, error: "Missing school context" }
    }

    const parsed = termCreateSchema.parse(input)

    // Verify school year exists
    const year = await db.schoolYear.findFirst({
      where: { id: parsed.yearId, schoolId },
      select: { id: true },
    })

    if (!year) {
      return { success: false, error: "Academic year not found" }
    }

    // Check for duplicate term number in same year
    const existing = await db.term.findFirst({
      where: { schoolId, yearId: parsed.yearId, termNumber: parsed.termNumber },
      select: { id: true },
    })

    if (existing) {
      return {
        success: false,
        error: `Term ${parsed.termNumber} already exists for this academic year`,
      }
    }

    const row = await db.term.create({
      data: {
        schoolId,
        yearId: parsed.yearId,
        termNumber: parsed.termNumber,
        startDate: parsed.startDate,
        endDate: parsed.endDate,
        isActive: parsed.isActive,
      },
    })

    revalidatePath(ACADEMIC_PATH)
    return { success: true, data: { id: row.id } }
  } catch (error) {
    console.error("[createTerm] Error:", error)

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: `Validation error: ${error.issues.map((e) => e.message).join(", ")}`,
      }
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create term",
    }
  }
}

export async function updateTerm(
  input: TermUpdateInput
): Promise<ActionResponse<void>> {
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return { success: false, error: "Missing school context" }
    }

    const parsed = termUpdateSchema.parse(input)
    const { id, ...rest } = parsed

    // Verify term exists
    const existing = await db.term.findFirst({
      where: { id, schoolId },
      select: { id: true, yearId: true },
    })

    if (!existing) {
      return { success: false, error: "Term not found" }
    }

    // Check for duplicate term number (exclude current)
    if (rest.termNumber) {
      const yearId = rest.yearId || existing.yearId
      const duplicate = await db.term.findFirst({
        where: { schoolId, yearId, termNumber: rest.termNumber, NOT: { id } },
        select: { id: true },
      })

      if (duplicate) {
        return {
          success: false,
          error: `Term ${rest.termNumber} already exists for this academic year`,
        }
      }
    }

    const data: Record<string, unknown> = {}
    if (typeof rest.yearId !== "undefined") data.yearId = rest.yearId
    if (typeof rest.termNumber !== "undefined")
      data.termNumber = rest.termNumber
    if (typeof rest.startDate !== "undefined") data.startDate = rest.startDate
    if (typeof rest.endDate !== "undefined") data.endDate = rest.endDate
    if (typeof rest.isActive !== "undefined") data.isActive = rest.isActive

    await db.term.updateMany({ where: { id, schoolId }, data })

    revalidatePath(ACADEMIC_PATH)
    return { success: true, data: undefined }
  } catch (error) {
    console.error("[updateTerm] Error:", error)

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: `Validation error: ${error.issues.map((e) => e.message).join(", ")}`,
      }
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update term",
    }
  }
}

export async function deleteTerm(input: {
  id: string
}): Promise<ActionResponse<void>> {
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return { success: false, error: "Missing school context" }
    }

    const { id } = z.object({ id: z.string().min(1) }).parse(input)

    // Verify term exists
    const existing = await db.term.findFirst({
      where: { id, schoolId },
      select: { id: true },
    })

    if (!existing) {
      return { success: false, error: "Term not found" }
    }

    await db.term.deleteMany({ where: { id, schoolId } })

    revalidatePath(ACADEMIC_PATH)
    return { success: true, data: undefined }
  } catch (error) {
    console.error("[deleteTerm] Error:", error)

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: `Validation error: ${error.issues.map((e) => e.message).join(", ")}`,
      }
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete term",
    }
  }
}

// Set a term as active (deactivate all others)
export async function setActiveTerm(input: {
  id: string
}): Promise<ActionResponse<void>> {
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return { success: false, error: "Missing school context" }
    }

    const { id } = z.object({ id: z.string().min(1) }).parse(input)

    // Verify term exists
    const existing = await db.term.findFirst({
      where: { id, schoolId },
      select: { id: true },
    })

    if (!existing) {
      return { success: false, error: "Term not found" }
    }

    // Deactivate all terms in this school
    await db.term.updateMany({
      where: { schoolId },
      data: { isActive: false },
    })

    // Activate the selected term
    await db.term.updateMany({
      where: { id, schoolId },
      data: { isActive: true },
    })

    revalidatePath(ACADEMIC_PATH)
    return { success: true, data: undefined }
  } catch (error) {
    console.error("[setActiveTerm] Error:", error)

    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to set active term",
    }
  }
}

// ============================================================================
// Queries
// ============================================================================

export async function getTerm(input: {
  id: string
}): Promise<ActionResponse<TermDetail | null>> {
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return { success: false, error: "Missing school context" }
    }

    const { id } = z.object({ id: z.string().min(1) }).parse(input)

    const term = await db.term.findFirst({
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

    return { success: true, data: term as TermDetail | null }
  } catch (error) {
    console.error("[getTerm] Error:", error)

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: `Validation error: ${error.issues.map((e) => e.message).join(", ")}`,
      }
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch term",
    }
  }
}

export async function getTerms(
  input?: Partial<z.infer<typeof getTermsSchema>>
): Promise<ActionResponse<{ rows: TermRow[]; total: number }>> {
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return { success: false, error: "Missing school context" }
    }

    const sp = getTermsSchema.parse(input ?? {})

    const where: Record<string, unknown> = {
      schoolId,
      ...(sp.yearId ? { yearId: sp.yearId } : {}),
    }

    const skip = (sp.page - 1) * sp.perPage
    const take = sp.perPage
    const orderBy =
      sp.sort && Array.isArray(sp.sort) && sp.sort.length
        ? sp.sort.map((s) => ({
            [s.id]: s.desc ? ("desc" as const) : ("asc" as const),
          }))
        : [
            { schoolYear: { startDate: "desc" as const } },
            { termNumber: "asc" as const },
          ]

    const [rows, count] = await Promise.all([
      db.term.findMany({
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
      db.term.count({ where }),
    ])

    const mapped: TermRow[] = rows.map((t) => ({
      id: t.id,
      yearId: t.yearId,
      yearName: t.schoolYear.yearName,
      termNumber: t.termNumber,
      termName: `Term ${t.termNumber}`,
      startDate: t.startDate.toISOString(),
      endDate: t.endDate.toISOString(),
      isActive: t.isActive,
      createdAt: t.createdAt.toISOString(),
    }))

    return { success: true, data: { rows: mapped, total: count } }
  } catch (error) {
    console.error("[getTerms] Error:", error)

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: `Validation error: ${error.issues.map((e) => e.message).join(", ")}`,
      }
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch terms",
    }
  }
}

// Get all terms for dropdown select (simplified)
export async function getTermOptions(): Promise<
  ActionResponse<Array<{ id: string; termNumber: number; yearName: string }>>
> {
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return { success: false, error: "Missing school context" }
    }

    const terms = await db.term.findMany({
      where: { schoolId },
      orderBy: [{ schoolYear: { startDate: "desc" } }, { termNumber: "asc" }],
      select: {
        id: true,
        termNumber: true,
        schoolYear: {
          select: {
            yearName: true,
          },
        },
      },
    })

    return {
      success: true,
      data: terms.map((t) => ({
        id: t.id,
        termNumber: t.termNumber,
        yearName: t.schoolYear.yearName,
      })),
    }
  } catch (error) {
    console.error("[getTermOptions] Error:", error)

    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to fetch term options",
    }
  }
}
