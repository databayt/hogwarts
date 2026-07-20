"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { revalidatePath } from "next/cache"
import { cookies } from "next/headers"
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
import { getLabels } from "@/components/translation/person"
import { search } from "@/components/translation/search"

/**
 * Evaluates the simple Prisma-shaped conditions `search()` returns
 * (`{ contains, mode }` or `{ in }`) against an in-memory value. `getSubjects`
 * filters an already-materialized array (via `getSchoolSubjects`), not a live
 * Prisma query, so `search()`'s OR conditions can't be handed to `findMany`
 * directly — this re-implements the same match semantics locally.
 * Not exported — "use server" modules may only export async functions.
 */
function matchesFieldConditions(
  value: string | null | undefined,
  fieldKey: string,
  conditions: Record<string, any>[]
): boolean {
  if (!value) return false
  return conditions.some((cond) => {
    const clause = cond[fieldKey]
    if (!clause) return false
    if ("contains" in clause) {
      return value.toLowerCase().includes(String(clause.contains).toLowerCase())
    }
    if ("in" in clause) {
      return (clause.in as string[]).includes(value)
    }
    return false
  })
}

// ============================================================================
// Mutations
// ============================================================================

/**
 * Select a catalog subject into a school (create SubjectSelection).
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
    const existing = await db.subjectSelection.findFirst({
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
        await db.subjectSelection.updateMany({
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

    const row = await db.subjectSelection.create({
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
 * Update a SubjectSelection record (customName, isRequired, weeklyPeriods).
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
    const existing = await db.subjectSelection.findFirst({
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

    await db.subjectSelection.updateMany({
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
 * Delete (deactivate) a SubjectSelection record.
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
    const existing = await db.subjectSelection.findFirst({
      where: { id, schoolId },
      select: { id: true, subject: { select: { name: true } } },
    })

    if (!existing) {
      return actionError(ACTION_ERRORS.NOT_FOUND)
    }

    // Soft-delete by deactivating
    await db.subjectSelection.updateMany({
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
    const catalogSubject = await db.subject.findFirst({
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

    // Display language: the ROUTE [lang] (passed by the client table) is the
    // source of truth; the NEXT_LOCALE cookie is only a fallback for
    // non-routed callers.
    let displayLang: "ar" | "en" = "ar"
    if (sp.lang) {
      displayLang = sp.lang
    } else {
      try {
        const cookieStore = await cookies()
        displayLang =
          cookieStore.get("NEXT_LOCALE")?.value === "en" ? "en" : "ar"
      } catch {
        displayLang = "ar"
      }
    }

    // Get all school subjects from catalog via bridge table
    let subjects = await getSchoolSubjects(schoolId)

    // Filter by name — bilingual + cache-only (search()'s reverse translation
    // lookup), so a user typing what they SEE on /en also matches subjects
    // whose catalog name/department is stored in Arabic. getSchoolSubjects()
    // returns an in-memory array (not a live Prisma query), so search()'s
    // Prisma-shaped OR conditions are evaluated locally instead of handed to
    // findMany.
    if (sp.name) {
      const school = await db.school.findUnique({
        where: { id: schoolId },
        select: { preferredLanguage: true },
      })
      const storageLang = (school?.preferredLanguage as "ar" | "en") || "ar"
      const nameConditions = await search(
        sp.name,
        ["name"],
        schoolId,
        storageLang,
        displayLang
      )
      subjects = subjects.filter((s) =>
        matchesFieldConditions(s.name, "name", nameConditions)
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

    // Translate for display — same batched helper + same direction as
    // content.tsx, so a row doesn't flip from translated to raw once a
    // search narrows the result set.
    const labels = await getLabels(
      paged.flatMap((s) => [s.name, s.department]),
      displayLang,
      schoolId
    )
    const mapped: SubjectListResult[] = paged.map((s) => ({
      id: s.id,
      name: labels.get(s.name) ?? s.name,
      department: s.department
        ? (labels.get(s.department) ?? s.department)
        : "",
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
    const result = await db.subjectSelection.updateMany({
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

export async function getSubjectsForPicker(
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

    // Intentionally NOT schoolId-scoped: catalog Subject is a global table
    // (no schoolId column). PUBLISHED-only keeps drafts out of the picker.
    const where: Record<string, unknown> = { status: "PUBLISHED" }
    if (search && search.trim()) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { department: { contains: search, mode: "insensitive" } },
      ]
    }

    const subjects = await db.subject.findMany({
      where,
      select: { id: true, name: true, department: true, slug: true },
      orderBy: { name: "asc" },
      take: 50,
    })

    return { success: true, data: subjects }
  } catch (error) {
    console.error("[getSubjectsForPicker] Error:", error)
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
