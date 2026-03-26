"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { revalidatePath } from "next/cache"
import { auth } from "@/auth"
import { z } from "zod"

import { ACTION_ERRORS, actionError } from "@/lib/action-errors"
import type { ActionResponse } from "@/lib/action-response"
import { db } from "@/lib/db"
import { getSchoolSubjects } from "@/lib/school-subjects"
import { getTenantContext } from "@/lib/tenant-context"
import {
  assertSubjectPermission,
  getAuthContext,
} from "@/components/school-dashboard/listings/subjects/authorization"
import {
  getSubjectsSchema,
  subjectCreateSchema,
  subjectUpdateSchema,
} from "@/components/school-dashboard/listings/subjects/validation"

// ============================================================================
// Mutations
// ============================================================================

/**
 * Select a catalog subject into a school (create SchoolSubjectSelection).
 * Replaces the old createSubject that created a Subject record.
 */
export async function createSubject(
  input: z.infer<typeof subjectCreateSchema>
): Promise<ActionResponse<{ id: string }>> {
  try {
    const session = await auth()
    const authContext = getAuthContext(session)
    if (!authContext) {
      return actionError(ACTION_ERRORS.NOT_AUTHENTICATED)
    }

    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return actionError(ACTION_ERRORS.MISSING_SCHOOL)
    }

    try {
      assertSubjectPermission(authContext, "create", { schoolId })
    } catch {
      return actionError(ACTION_ERRORS.UNAUTHORIZED)
    }

    const parsed = subjectCreateSchema.parse(input)

    // Check if already selected for this grade
    const existing = await db.schoolSubjectSelection.findFirst({
      where: {
        schoolId,
        catalogSubjectId: parsed.catalogSubjectId,
        gradeId: parsed.gradeId,
        streamId: parsed.streamId ?? null,
      },
    })

    if (existing) {
      // Reactivate if inactive
      if (!existing.isActive) {
        await db.schoolSubjectSelection.updateMany({
          where: { id: existing.id, schoolId },
          data: { isActive: true },
        })
        revalidatePath("/subjects")
        return { success: true, data: { id: existing.id } }
      }
      return {
        success: false,
        error: "This subject is already selected for this grade",
      }
    }

    const row = await db.schoolSubjectSelection.create({
      data: {
        schoolId,
        catalogSubjectId: parsed.catalogSubjectId,
        gradeId: parsed.gradeId,
        streamId: parsed.streamId,
        customName: parsed.customName,
        isRequired: parsed.isRequired ?? true,
        weeklyPeriods: parsed.weeklyPeriods,
      },
    })

    revalidatePath("/subjects")
    return { success: true, data: { id: row.id } }
  } catch (error) {
    console.error("[createSubject] Error:", error)

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: `Validation error: ${error.issues.map((e) => e.message).join(", ")}`,
      }
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to add subject",
    }
  }
}

/**
 * Update a SchoolSubjectSelection record (customName, isRequired, weeklyPeriods).
 */
export async function updateSubject(
  input: z.infer<typeof subjectUpdateSchema>
): Promise<ActionResponse<void>> {
  try {
    const session = await auth()
    const authContext = getAuthContext(session)
    if (!authContext) {
      return actionError(ACTION_ERRORS.NOT_AUTHENTICATED)
    }

    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return actionError(ACTION_ERRORS.MISSING_SCHOOL)
    }

    try {
      assertSubjectPermission(authContext, "update", { schoolId })
    } catch {
      return actionError(ACTION_ERRORS.UNAUTHORIZED)
    }

    const parsed = subjectUpdateSchema.parse(input)
    const { id, ...rest } = parsed

    // Verify selection exists and belongs to this school
    const existing = await db.schoolSubjectSelection.findFirst({
      where: { id, schoolId },
      select: { id: true },
    })

    if (!existing) {
      return actionError(ACTION_ERRORS.NOT_FOUND)
    }

    const data: Record<string, unknown> = {}
    if (typeof rest.customName !== "undefined")
      data.customName = rest.customName || null
    if (typeof rest.isRequired !== "undefined")
      data.isRequired = rest.isRequired
    if (typeof rest.weeklyPeriods !== "undefined")
      data.weeklyPeriods = rest.weeklyPeriods
    if (typeof rest.isActive !== "undefined") data.isActive = rest.isActive

    await db.schoolSubjectSelection.updateMany({
      where: { id, schoolId },
      data,
    })

    revalidatePath("/subjects")
    return { success: true, data: undefined }
  } catch (error) {
    console.error("[updateSubject] Error:", error)

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: `Validation error: ${error.issues.map((e) => e.message).join(", ")}`,
      }
    }

    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to update subject",
    }
  }
}

/**
 * Delete (deactivate) a SchoolSubjectSelection record.
 */
export async function deleteSubject(input: {
  id: string
}): Promise<ActionResponse<void>> {
  try {
    const session = await auth()
    const authContext = getAuthContext(session)
    if (!authContext) {
      return actionError(ACTION_ERRORS.NOT_AUTHENTICATED)
    }

    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return actionError(ACTION_ERRORS.MISSING_SCHOOL)
    }

    try {
      assertSubjectPermission(authContext, "delete", { schoolId })
    } catch {
      return actionError(ACTION_ERRORS.UNAUTHORIZED)
    }

    const { id } = z.object({ id: z.string().min(1) }).parse(input)

    // Verify selection exists
    const existing = await db.schoolSubjectSelection.findFirst({
      where: { id, schoolId },
      select: { id: true, subject: { select: { name: true } } },
    })

    if (!existing) {
      return actionError(ACTION_ERRORS.NOT_FOUND)
    }

    // Soft-delete by deactivating
    await db.schoolSubjectSelection.updateMany({
      where: { id, schoolId },
      data: { isActive: false },
    })

    revalidatePath("/subjects")
    return { success: true, data: undefined }
  } catch (error) {
    console.error("[deleteSubject] Error:", error)

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: `Validation error: ${error.issues.map((e) => e.message).join(", ")}`,
      }
    }

    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to remove subject",
    }
  }
}

// ============================================================================
// Queries
// ============================================================================

type SubjectSelectResult = {
  id: string
  name: string
  slug: string
  department: string
  lang: string
  createdAt: Date
  updatedAt: Date
}

export async function getSubject(input: {
  id: string
}): Promise<ActionResponse<SubjectSelectResult | null>> {
  try {
    const session = await auth()
    const authContext = getAuthContext(session)
    if (!authContext) {
      return actionError(ACTION_ERRORS.NOT_AUTHENTICATED)
    }

    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return actionError(ACTION_ERRORS.MISSING_SCHOOL)
    }

    try {
      assertSubjectPermission(authContext, "read", { schoolId })
    } catch {
      return actionError(ACTION_ERRORS.UNAUTHORIZED)
    }

    const { id } = z.object({ id: z.string().min(1) }).parse(input)

    // Look up via catalog subject
    const catalogSubject = await db.catalogSubject.findFirst({
      where: { id },
      select: {
        id: true,
        name: true,
        slug: true,
        department: true,
        lang: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    return { success: true, data: catalogSubject as SubjectSelectResult | null }
  } catch (error) {
    console.error("[getSubject] Error:", error)

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: `Validation error: ${error.issues.map((e) => e.message).join(", ")}`,
      }
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch subject",
    }
  }
}

type SubjectListResult = {
  id: string
  name: string
  department: string
  createdAt: string
}

export async function getSubjects(
  input: Partial<z.infer<typeof getSubjectsSchema>>
): Promise<ActionResponse<{ rows: SubjectListResult[]; total: number }>> {
  try {
    const session = await auth()
    const authContext = getAuthContext(session)
    if (!authContext) {
      return actionError(ACTION_ERRORS.NOT_AUTHENTICATED)
    }

    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return actionError(ACTION_ERRORS.MISSING_SCHOOL)
    }

    try {
      assertSubjectPermission(authContext, "read", { schoolId })
    } catch {
      return actionError(ACTION_ERRORS.UNAUTHORIZED)
    }

    const sp = getSubjectsSchema.parse(input ?? {})

    // Get all school subjects from catalog via bridge table
    let subjects = await getSchoolSubjects(schoolId)

    // Filter by name
    if (sp.name) {
      const searchLower = sp.name.toLowerCase()
      subjects = subjects.filter((s) =>
        s.name.toLowerCase().includes(searchLower)
      )
    }

    // Filter by department
    if (sp.department) {
      subjects = subjects.filter((s) => s.department === sp.department)
    }

    // Sort
    if (sp.sort?.length) {
      subjects.sort((a, b) => {
        for (const s of sp.sort) {
          const key = s.id as keyof typeof a
          const aVal = String(a[key] ?? "")
          const bVal = String(b[key] ?? "")
          const cmp = aVal.localeCompare(bVal)
          if (cmp !== 0) return s.desc ? -cmp : cmp
        }
        return 0
      })
    } else {
      subjects.sort((a, b) => a.name.localeCompare(b.name))
    }

    const total = subjects.length
    const skip = (sp.page - 1) * sp.perPage
    const paged = subjects.slice(skip, skip + sp.perPage)

    const mapped: SubjectListResult[] = paged.map((s) => ({
      id: s.id,
      name: s.name,
      department: s.department || "Unknown",
      createdAt: s.createdAt.toISOString(),
    }))

    return { success: true, data: { rows: mapped, total } }
  } catch (error) {
    console.error("[getSubjects] Error:", error)

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: `Validation error: ${error.issues.map((e) => e.message).join(", ")}`,
      }
    }

    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to fetch subjects",
    }
  }
}

export async function bulkDeleteSubjects(input: {
  ids: string[]
}): Promise<ActionResponse<{ count: number }>> {
  try {
    const session = await auth()
    const authContext = getAuthContext(session)
    if (!authContext) {
      return actionError(ACTION_ERRORS.NOT_AUTHENTICATED)
    }

    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return actionError(ACTION_ERRORS.MISSING_SCHOOL)
    }

    try {
      assertSubjectPermission(authContext, "bulk_action", { schoolId })
    } catch {
      return actionError(ACTION_ERRORS.UNAUTHORIZED)
    }

    const { ids } = z
      .object({ ids: z.array(z.string().min(1)).min(1) })
      .parse(input)

    // Soft-delete by deactivating all matching selections
    const result = await db.schoolSubjectSelection.updateMany({
      where: { id: { in: ids }, schoolId },
      data: { isActive: false },
    })

    revalidatePath("/subjects")
    return { success: true, data: { count: result.count } }
  } catch (error) {
    console.error("[bulkDeleteSubjects] Error:", error)
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to bulk delete subjects",
    }
  }
}

export async function getCatalogSubjectsForPicker(
  search?: string
): Promise<
  ActionResponse<
    Array<{ id: string; name: string; department: string; slug: string }>
  >
> {
  try {
    const session = await auth()
    if (!session?.user) {
      return actionError(ACTION_ERRORS.NOT_AUTHENTICATED)
    }

    const where: Record<string, unknown> = { status: "PUBLISHED" }
    if (search && search.trim()) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { department: { contains: search, mode: "insensitive" } },
      ]
    }

    const subjects = await db.catalogSubject.findMany({
      where,
      select: { id: true, name: true, department: true, slug: true },
      orderBy: { name: "asc" },
      take: 50,
    })

    return { success: true, data: subjects }
  } catch (error) {
    console.error("[getCatalogSubjectsForPicker] Error:", error)
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to fetch catalog subjects",
    }
  }
}

export async function getSubjectsCSV(
  input?: Partial<z.infer<typeof getSubjectsSchema>>
): Promise<ActionResponse<string>> {
  try {
    const session = await auth()
    const authContext = getAuthContext(session)
    if (!authContext) {
      return actionError(ACTION_ERRORS.NOT_AUTHENTICATED)
    }

    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return actionError(ACTION_ERRORS.MISSING_SCHOOL)
    }

    try {
      assertSubjectPermission(authContext, "export", { schoolId })
    } catch {
      return actionError(ACTION_ERRORS.UNAUTHORIZED)
    }

    let subjects = await getSchoolSubjects(schoolId)

    const sp = getSubjectsSchema.parse(input ?? {})
    if (sp.name) {
      const searchLower = sp.name.toLowerCase()
      subjects = subjects.filter((s) =>
        s.name.toLowerCase().includes(searchLower)
      )
    }
    if (sp.department) {
      subjects = subjects.filter((s) => s.department === sp.department)
    }

    subjects.sort((a, b) => a.name.localeCompare(b.name))

    const headers = [
      "ID",
      "Subject Name",
      "Language",
      "Department",
      "Created Date",
    ]
    const csvRows = subjects.map((s) =>
      [
        s.id,
        `"${(s.name || "").replace(/"/g, '""')}"`,
        s.lang || "ar",
        `"${(s.department || "").replace(/"/g, '""')}"`,
        new Date(s.createdAt).toISOString().split("T")[0],
      ].join(",")
    )

    const csv = [headers.join(","), ...csvRows].join("\n")
    return { success: true, data: csv }
  } catch (error) {
    console.error("[getSubjectsCSV] Error:", error)
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to export subjects",
    }
  }
}
