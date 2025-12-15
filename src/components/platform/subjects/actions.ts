"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"
import {
  getSubjectsSchema,
  subjectCreateSchema,
  subjectUpdateSchema,
} from "@/components/platform/subjects/validation"

// ============================================================================
// Types
// ============================================================================

export type ActionResponse<T = void> =
  | { success: true; data: T }
  | { success: false; error: string }

// ============================================================================
// Mutations
// ============================================================================

export async function createSubject(
  input: z.infer<typeof subjectCreateSchema>
): Promise<ActionResponse<{ id: string }>> {
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return { success: false, error: "Missing school context" }
    }

    const parsed = subjectCreateSchema.parse(input)

    const row = await (db as any).subject.create({
      data: {
        schoolId,
        subjectName: parsed.subjectName,
        departmentId: parsed.departmentId,
      },
    })

    revalidatePath("/subjects")
    return { success: true, data: { id: row.id as string } }
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
      error:
        error instanceof Error ? error.message : "Failed to create subject",
    }
  }
}

export async function updateSubject(
  input: z.infer<typeof subjectUpdateSchema>
): Promise<ActionResponse<void>> {
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return { success: false, error: "Missing school context" }
    }

    const parsed = subjectUpdateSchema.parse(input)
    const { id, ...rest } = parsed

    // Verify subject exists
    const existing = await (db as any).subject.findFirst({
      where: { id, schoolId },
      select: { id: true },
    })

    if (!existing) {
      return { success: false, error: "Subject not found" }
    }

    const data: Record<string, unknown> = {}
    if (typeof rest.subjectName !== "undefined")
      data.subjectName = rest.subjectName
    if (typeof rest.departmentId !== "undefined")
      data.departmentId = rest.departmentId

    await (db as any).subject.updateMany({ where: { id, schoolId }, data })

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

export async function deleteSubject(input: {
  id: string
}): Promise<ActionResponse<void>> {
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return { success: false, error: "Missing school context" }
    }

    const { id } = z.object({ id: z.string().min(1) }).parse(input)

    // Verify subject exists
    const existing = await (db as any).subject.findFirst({
      where: { id, schoolId },
      select: { id: true, subjectName: true },
    })

    if (!existing) {
      return { success: false, error: "Subject not found" }
    }

    // ============================================================================
    // CASCADE VALIDATION - Check for dependencies before deletion
    // ============================================================================

    // 1. Check if any teachers have expertise in this subject
    const teacherExpertiseCount = await (
      db as any
    ).teacherSubjectExpertise.count({
      where: { subjectId: id, schoolId },
    })
    if (teacherExpertiseCount > 0) {
      return {
        success: false,
        error: `Cannot delete "${existing.subjectName}": ${teacherExpertiseCount} teacher(s) have expertise in this subject. Remove their expertise first.`,
      }
    }

    // 2. Check if any classes are teaching this subject
    const classCount = await (db as any).class.count({
      where: { subjectId: id, schoolId },
    })
    if (classCount > 0) {
      return {
        success: false,
        error: `Cannot delete "${existing.subjectName}": ${classCount} class(es) are teaching this subject. Delete or reassign those classes first.`,
      }
    }

    // 3. Check if any exams are associated with this subject
    const examCount = await (db as any).exam.count({
      where: { subjectId: id, schoolId },
    })
    if (examCount > 0) {
      return {
        success: false,
        error: `Cannot delete "${existing.subjectName}": ${examCount} exam(s) are associated with this subject. Delete those exams first.`,
      }
    }

    // 4. Check if any question banks are associated with this subject
    const questionBankCount = await (db as any).questionBank.count({
      where: { subjectId: id, schoolId },
    })
    if (questionBankCount > 0) {
      return {
        success: false,
        error: `Cannot delete "${existing.subjectName}": ${questionBankCount} question bank(s) are associated with this subject. Delete those question banks first.`,
      }
    }

    // All checks passed - safe to delete
    await (db as any).subject.deleteMany({ where: { id, schoolId } })

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
        error instanceof Error ? error.message : "Failed to delete subject",
    }
  }
}

// ============================================================================
// Queries
// ============================================================================

type SubjectSelectResult = {
  id: string
  schoolId: string
  subjectName: string
  departmentId: string | null
  createdAt: Date
  updatedAt: Date
}

export async function getSubject(input: {
  id: string
}): Promise<ActionResponse<SubjectSelectResult | null>> {
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return { success: false, error: "Missing school context" }
    }

    const { id } = z.object({ id: z.string().min(1) }).parse(input)

    if (!(db as any).subject) {
      return { success: true, data: null }
    }

    const subject = await (db as any).subject.findFirst({
      where: { id, schoolId },
      select: {
        id: true,
        schoolId: true,
        subjectName: true,
        departmentId: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    return { success: true, data: subject as SubjectSelectResult | null }
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
  subjectName: string
  subjectNameAr: string | null
  departmentName: string
  departmentNameAr: string | null
  createdAt: string
}

export async function getSubjects(
  input: Partial<z.infer<typeof getSubjectsSchema>>
): Promise<ActionResponse<{ rows: SubjectListResult[]; total: number }>> {
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return { success: false, error: "Missing school context" }
    }

    const sp = getSubjectsSchema.parse(input ?? {})

    if (!(db as any).subject) {
      return { success: true, data: { rows: [], total: 0 } }
    }

    const where: any = {
      schoolId,
      ...(sp.subjectName
        ? { subjectName: { contains: sp.subjectName, mode: "insensitive" } }
        : {}),
      ...(sp.departmentId ? { departmentId: sp.departmentId } : {}),
    }

    const skip = (sp.page - 1) * sp.perPage
    const take = sp.perPage
    const orderBy =
      sp.sort && Array.isArray(sp.sort) && sp.sort.length
        ? sp.sort.map((s) => ({ [s.id]: s.desc ? "desc" : "asc" }))
        : [{ createdAt: "desc" }]

    const [rows, count] = await Promise.all([
      (db as any).subject.findMany({
        where,
        orderBy,
        skip,
        take,
        include: {
          department: {
            select: {
              departmentName: true,
              departmentNameAr: true,
            },
          },
        },
      }),
      (db as any).subject.count({ where }),
    ])

    const mapped: SubjectListResult[] = (rows as Array<any>).map((s) => ({
      id: s.id as string,
      subjectName: s.subjectName as string,
      subjectNameAr: (s.subjectNameAr as string | null) || null,
      departmentName: s.department?.departmentName || "Unknown",
      departmentNameAr:
        (s.department?.departmentNameAr as string | null) || null,
      createdAt: (s.createdAt as Date).toISOString(),
    }))

    return { success: true, data: { rows: mapped, total: count as number } }
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
