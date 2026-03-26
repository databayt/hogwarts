"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { revalidatePath } from "next/cache"
import { auth } from "@/auth"
import { z } from "zod"

import { ACTION_ERRORS, actionError } from "@/lib/action-errors"
import type { ActionResponse } from "@/lib/action-response"
import { db } from "@/lib/db"
import {
  dispatchNotification,
  dispatchNotificationsToAudience,
} from "@/lib/dispatch-notification"
import { getModelOrThrow } from "@/lib/prisma-guards"
import { getTenantContext } from "@/lib/tenant-context"
import { arrayToCSV } from "@/components/file"
import {
  assignmentCreateSchema,
  assignmentUpdateSchema,
  getAssignmentsSchema,
} from "@/components/school-dashboard/listings/assignments/validation"

import { assertAssignmentPermission, getAuthContext } from "./authorization"

type AssignmentSelectResult = {
  id: string
  schoolId: string
  title: string
  description: string | null
  classId: string
  type: string
  totalPoints: number
  weight: number
  dueDate: Date
  instructions: string | null
  status: string
  createdAt: Date
  updatedAt: Date
}

type AssignmentListResult = {
  id: string
  title: string
  type: string
  totalPoints: number
  dueDate: string
  createdAt: string
}

const ASSIGNMENTS_PATH = "/assignments"

// ============================================================================
// Mutations
// ============================================================================

export async function createAssignment(
  input: z.infer<typeof assignmentCreateSchema>
): Promise<ActionResponse<{ id: string }>> {
  try {
    const session = await auth()
    const authContext = getAuthContext(session)
    if (!authContext) return actionError(ACTION_ERRORS.NOT_AUTHENTICATED)

    const { schoolId } = await getTenantContext()
    if (!schoolId) return actionError(ACTION_ERRORS.MISSING_SCHOOL)

    assertAssignmentPermission(authContext, "create", { schoolId })

    const parsed = assignmentCreateSchema.parse(input)

    const assignmentModel = getModelOrThrow("assignment")
    const row = await assignmentModel.create({
      data: {
        schoolId,
        title: parsed.title,
        description: parsed.description || null,
        classId: parsed.classId,
        type: parsed.type,
        totalPoints: parsed.totalPoints,
        weight: parsed.weight,
        dueDate: parsed.dueDate,
        instructions: parsed.instructions || null,
        status: "DRAFT",
      },
    })

    // Notify students in the class about the new assignment (non-blocking)
    const schoolPref = await db.school.findFirst({
      where: { id: schoolId },
      select: { preferredLanguage: true },
    })
    dispatchNotificationsToAudience({
      schoolId,
      type: "assignment_created",
      title: `واجب جديد: ${parsed.title}`,
      body: `تم إضافة واجب جديد "${parsed.title}" مع موعد تسليم ${new Date(parsed.dueDate).toLocaleDateString("ar-SA")}`,
      lang: schoolPref?.preferredLanguage ?? "ar",
      priority: "normal",
      channels: ["in_app", "email"],
      metadata: {
        assignmentId: row.id,
        classId: parsed.classId,
        dueDate: parsed.dueDate.toISOString(),
        url: `/assignments/${row.id}`,
      },
      targetScope: "class",
      targetClassId: parsed.classId,
    }).catch((err) =>
      console.error("[createAssignment] Notification error:", err)
    )

    revalidatePath(ASSIGNMENTS_PATH)
    return { success: true, data: { id: row.id as string } }
  } catch (error) {
    console.error("[createAssignment] Error:", error)

    if (error instanceof z.ZodError) {
      return actionError(
        ACTION_ERRORS.VALIDATION_ERROR,
        error.issues.map((e) => e.message).join(", ")
      )
    }

    return actionError(
      ACTION_ERRORS.UNKNOWN,
      error instanceof Error ? error.message : undefined
    )
  }
}

export async function updateAssignment(
  input: z.infer<typeof assignmentUpdateSchema>
): Promise<ActionResponse<void>> {
  try {
    const session = await auth()
    const authContext = getAuthContext(session)
    if (!authContext) return actionError(ACTION_ERRORS.NOT_AUTHENTICATED)

    const { schoolId } = await getTenantContext()
    if (!schoolId) return actionError(ACTION_ERRORS.MISSING_SCHOOL)

    assertAssignmentPermission(authContext, "update", { schoolId })

    const parsed = assignmentUpdateSchema.parse(input)
    const { id, ...rest } = parsed

    // Verify assignment exists
    const assignmentModel = getModelOrThrow("assignment")
    const existing = await assignmentModel.findFirst({
      where: { id, schoolId },
      select: { id: true },
    })

    if (!existing) {
      return actionError(ACTION_ERRORS.NOT_FOUND)
    }

    const data: Record<string, unknown> = {}
    if (typeof rest.title !== "undefined") data.title = rest.title
    if (typeof rest.description !== "undefined")
      data.description = rest.description || null
    if (typeof rest.classId !== "undefined") data.classId = rest.classId
    if (typeof rest.type !== "undefined") data.type = rest.type
    if (typeof rest.totalPoints !== "undefined")
      data.totalPoints = rest.totalPoints
    if (typeof rest.weight !== "undefined") data.weight = rest.weight
    if (typeof rest.dueDate !== "undefined") data.dueDate = rest.dueDate
    if (typeof rest.instructions !== "undefined")
      data.instructions = rest.instructions || null

    await assignmentModel.updateMany({ where: { id, schoolId }, data })

    revalidatePath(ASSIGNMENTS_PATH)
    return { success: true, data: undefined }
  } catch (error) {
    console.error("[updateAssignment] Error:", error)

    if (error instanceof z.ZodError) {
      return actionError(
        ACTION_ERRORS.VALIDATION_ERROR,
        error.issues.map((e) => e.message).join(", ")
      )
    }

    return actionError(
      ACTION_ERRORS.UNKNOWN,
      error instanceof Error ? error.message : undefined
    )
  }
}

export async function deleteAssignment(input: {
  id: string
}): Promise<ActionResponse<void>> {
  try {
    const session = await auth()
    const authContext = getAuthContext(session)
    if (!authContext) return actionError(ACTION_ERRORS.NOT_AUTHENTICATED)

    const { schoolId } = await getTenantContext()
    if (!schoolId) return actionError(ACTION_ERRORS.MISSING_SCHOOL)

    assertAssignmentPermission(authContext, "delete", { schoolId })

    const { id } = z.object({ id: z.string().min(1) }).parse(input)

    // Verify assignment exists
    const assignmentModel = getModelOrThrow("assignment")
    const existing = await assignmentModel.findFirst({
      where: { id, schoolId },
      select: { id: true },
    })

    if (!existing) {
      return actionError(ACTION_ERRORS.NOT_FOUND)
    }

    await assignmentModel.deleteMany({ where: { id, schoolId } })

    revalidatePath(ASSIGNMENTS_PATH)
    return { success: true, data: undefined }
  } catch (error) {
    console.error("[deleteAssignment] Error:", error)

    if (error instanceof z.ZodError) {
      return actionError(
        ACTION_ERRORS.VALIDATION_ERROR,
        error.issues.map((e) => e.message).join(", ")
      )
    }

    return actionError(
      ACTION_ERRORS.UNKNOWN,
      error instanceof Error ? error.message : undefined
    )
  }
}

export async function gradeSubmission(input: {
  submissionId: string
  score: number
  feedback?: string
}): Promise<ActionResponse<void>> {
  try {
    const session = await auth()
    const authContext = getAuthContext(session)
    if (!authContext) return actionError(ACTION_ERRORS.NOT_AUTHENTICATED)

    const { schoolId } = await getTenantContext()
    if (!schoolId) return actionError(ACTION_ERRORS.MISSING_SCHOOL)

    assertAssignmentPermission(authContext, "grade", { schoolId })

    const parsed = z
      .object({
        submissionId: z.string().min(1),
        score: z.number().min(0),
        feedback: z.string().optional(),
      })
      .parse(input)

    // Verify submission exists and belongs to this school
    const submission = await db.assignmentSubmission.findFirst({
      where: { id: parsed.submissionId, schoolId },
      select: {
        id: true,
        studentId: true,
        assignment: {
          select: { id: true, title: true, totalPoints: true },
        },
        student: {
          select: { userId: true },
        },
      },
    })

    if (!submission) {
      return actionError(ACTION_ERRORS.NOT_FOUND)
    }

    await db.assignmentSubmission.updateMany({
      where: { id: parsed.submissionId, schoolId },
      data: {
        score: parsed.score,
        feedback: parsed.feedback || null,
        status: "GRADED",
        gradedAt: new Date(),
      },
    })

    // Notify the student that their assignment was graded (non-blocking)
    if (submission.student.userId) {
      dispatchNotification({
        schoolId,
        userId: submission.student.userId,
        type: "assignment_graded",
        title: `تم تصحيح الواجب: ${submission.assignment.title}`,
        body: `حصلت على ${parsed.score}/${submission.assignment.totalPoints} في "${submission.assignment.title}"`,
        priority: "normal",
        channels: ["in_app"],
        metadata: {
          assignmentId: submission.assignment.id,
          submissionId: parsed.submissionId,
          score: parsed.score,
          totalPoints: submission.assignment.totalPoints,
          url: `/assignments/${submission.assignment.id}`,
        },
      }).catch((err) =>
        console.error("[gradeSubmission] Notification error:", err)
      )
    }

    revalidatePath(ASSIGNMENTS_PATH)
    return { success: true, data: undefined }
  } catch (error) {
    console.error("[gradeSubmission] Error:", error)

    if (error instanceof z.ZodError) {
      return actionError(
        ACTION_ERRORS.VALIDATION_ERROR,
        error.issues.map((e) => e.message).join(", ")
      )
    }

    return actionError(
      ACTION_ERRORS.UNKNOWN,
      error instanceof Error ? error.message : undefined
    )
  }
}

// ============================================================================
// Queries
// ============================================================================

export async function getAssignment(input: {
  id: string
}): Promise<ActionResponse<AssignmentSelectResult | null>> {
  try {
    const session = await auth()
    const authContext = getAuthContext(session)
    if (!authContext) return actionError(ACTION_ERRORS.NOT_AUTHENTICATED)

    const { schoolId } = await getTenantContext()
    if (!schoolId) return actionError(ACTION_ERRORS.MISSING_SCHOOL)

    assertAssignmentPermission(authContext, "read", { schoolId })

    const { id } = z.object({ id: z.string().min(1) }).parse(input)

    const assignmentModel = getModelOrThrow("assignment")
    const assignment = await assignmentModel.findFirst({
      where: { id, schoolId },
      select: {
        id: true,
        schoolId: true,
        title: true,
        description: true,
        classId: true,
        type: true,
        totalPoints: true,
        weight: true,
        dueDate: true,
        instructions: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    return { success: true, data: assignment as AssignmentSelectResult | null }
  } catch (error) {
    console.error("[getAssignment] Error:", error)

    if (error instanceof z.ZodError) {
      return actionError(
        ACTION_ERRORS.VALIDATION_ERROR,
        error.issues.map((e) => e.message).join(", ")
      )
    }

    return actionError(
      ACTION_ERRORS.UNKNOWN,
      error instanceof Error ? error.message : undefined
    )
  }
}

export async function getAssignments(
  input: Partial<z.infer<typeof getAssignmentsSchema>>
): Promise<ActionResponse<{ rows: AssignmentListResult[]; total: number }>> {
  try {
    const session = await auth()
    const authContext = getAuthContext(session)
    if (!authContext) return actionError(ACTION_ERRORS.NOT_AUTHENTICATED)

    const { schoolId } = await getTenantContext()
    if (!schoolId) return actionError(ACTION_ERRORS.MISSING_SCHOOL)

    assertAssignmentPermission(authContext, "read", { schoolId })

    const sp = getAssignmentsSchema.parse(input ?? {})

    const assignmentModel = getModelOrThrow("assignment")
    const where: any = {
      schoolId,
      ...(sp.title
        ? { title: { contains: sp.title, mode: "insensitive" } }
        : {}),
      ...(sp.type ? { type: sp.type } : {}),
      ...(sp.classId ? { classId: sp.classId } : {}),
    }

    const skip = (sp.page - 1) * sp.perPage
    const take = sp.perPage
    const orderBy =
      sp.sort && Array.isArray(sp.sort) && sp.sort.length
        ? sp.sort.map((s) => ({ [s.id]: s.desc ? "desc" : "asc" }))
        : [{ createdAt: "desc" }]

    const [rows, count] = await Promise.all([
      assignmentModel.findMany({
        where,
        orderBy,
        skip,
        take,
        include: {
          class: {
            select: {
              name: true,
            },
          },
        },
      }),
      assignmentModel.count({ where }),
    ])

    const mapped: AssignmentListResult[] = (rows as Array<any>).map((a) => ({
      id: a.id as string,
      title: a.title as string,
      type: a.type as string,
      totalPoints: a.totalPoints as number,
      dueDate: (a.dueDate as Date).toISOString(),
      createdAt: (a.createdAt as Date).toISOString(),
    }))

    return { success: true, data: { rows: mapped, total: count as number } }
  } catch (error) {
    console.error("[getAssignments] Error:", error)

    if (error instanceof z.ZodError) {
      return actionError(
        ACTION_ERRORS.VALIDATION_ERROR,
        error.issues.map((e) => e.message).join(", ")
      )
    }

    return actionError(
      ACTION_ERRORS.UNKNOWN,
      error instanceof Error ? error.message : undefined
    )
  }
}

/**
 * Export assignments to CSV format
 */
export async function getAssignmentsCSV(
  input?: Partial<z.infer<typeof getAssignmentsSchema>>
): Promise<ActionResponse<string>> {
  try {
    const session = await auth()
    const authContext = getAuthContext(session)
    if (!authContext) return actionError(ACTION_ERRORS.NOT_AUTHENTICATED)

    const { schoolId } = await getTenantContext()
    if (!schoolId) return actionError(ACTION_ERRORS.MISSING_SCHOOL)

    assertAssignmentPermission(authContext, "export", { schoolId })

    const sp = getAssignmentsSchema.parse(input ?? {})

    const assignmentModel = getModelOrThrow("assignment")
    // Build where clause with filters
    const where: any = {
      schoolId,
      ...(sp.title
        ? { title: { contains: sp.title, mode: "insensitive" } }
        : {}),
      ...(sp.type ? { type: sp.type } : {}),
      ...(sp.classId ? { classId: sp.classId } : {}),
    }

    // Fetch ALL assignments matching filters (no pagination for export)
    const assignments = await assignmentModel.findMany({
      where,
      take: 10000,
      include: {
        class: {
          select: {
            name: true,
            subject: {
              select: {
                name: true,
              },
            },
          },
        },
        _count: {
          select: {
            assignmentSubmissions: true,
          },
        },
      },
      orderBy: [{ dueDate: "asc" }],
    })

    // Transform data for CSV export
    const exportData = assignments.map((assignment: any) => ({
      assignmentId: assignment.id,
      title: assignment.title || "",
      description: assignment.description || "",
      class: assignment.class?.name || "",
      subject: assignment.class?.subject?.name || "",
      type: assignment.type || "",
      totalPoints: assignment.totalPoints || 0,
      weight: assignment.weight || 0,
      dueDate: assignment.dueDate
        ? new Date(assignment.dueDate).toISOString().split("T")[0]
        : "",
      status: assignment.status || "",
      submissions: assignment._count.assignmentSubmissions,
      createdAt: new Date(assignment.createdAt).toISOString().split("T")[0],
    }))

    // Define CSV columns
    const columns = [
      { key: "assignmentId" as const, label: "Assignment ID" },
      { key: "title" as const, label: "Title" },
      { key: "description" as const, label: "Description" },
      { key: "class" as const, label: "Class" },
      { key: "subject" as const, label: "Subject" },
      { key: "type" as const, label: "Type" },
      { key: "totalPoints" as const, label: "Total Points" },
      { key: "weight" as const, label: "Weight (%)" },
      { key: "dueDate" as const, label: "Due Date" },
      { key: "status" as const, label: "Status" },
      { key: "submissions" as const, label: "Submissions Count" },
      { key: "createdAt" as const, label: "Created Date" },
    ]

    const csv = arrayToCSV(exportData, { columns })
    return { success: true, data: csv }
  } catch (error) {
    console.error("[getAssignmentsCSV] Error:", error)

    return actionError(
      ACTION_ERRORS.UNKNOWN,
      error instanceof Error ? error.message : undefined
    )
  }
}

/**
 * Get assignments data for unified File Block export
 * Returns typed array for multi-format export (CSV, Excel, PDF)
 */
export async function getAssignmentsExportData(
  input?: Partial<z.infer<typeof getAssignmentsSchema>>
): Promise<
  ActionResponse<
    Array<{
      id: string
      title: string
      description: string | null
      className: string | null
      name: string | null
      teacherName: string | null
      dueDate: Date | null
      totalPoints: number | null
      status: string
      submissionCount: number
      gradedCount: number
      createdAt: Date
    }>
  >
> {
  try {
    const session = await auth()
    const authContext = getAuthContext(session)
    if (!authContext) return actionError(ACTION_ERRORS.NOT_AUTHENTICATED)

    const { schoolId } = await getTenantContext()
    if (!schoolId) return actionError(ACTION_ERRORS.MISSING_SCHOOL)

    assertAssignmentPermission(authContext, "export", { schoolId })

    const sp = getAssignmentsSchema.parse(input ?? {})

    const assignmentModel = getModelOrThrow("assignment")
    // Build where clause with filters
    const where: any = {
      schoolId,
      ...(sp.title
        ? { title: { contains: sp.title, mode: "insensitive" } }
        : {}),
      ...(sp.type ? { type: sp.type } : {}),
      ...(sp.classId ? { classId: sp.classId } : {}),
    }

    // Fetch ALL assignments matching filters (no pagination for export)
    const assignments = await assignmentModel.findMany({
      where,
      take: 10000,
      include: {
        class: {
          select: {
            name: true,
            subject: {
              select: {
                name: true,
              },
            },
            teacher: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        _count: {
          select: {
            assignmentSubmissions: true,
          },
        },
        assignmentSubmissions: {
          select: {
            gradedAt: true,
          },
        },
      },
      orderBy: [{ dueDate: "asc" }],
    })

    // Transform data for export
    const exportData = assignments.map((assignment: any) => ({
      id: assignment.id as string,
      title: assignment.title as string,
      description: assignment.description as string | null,
      className: (assignment.class?.name as string) || null,
      name: (assignment.class?.subject?.name as string) || null,
      teacherName: assignment.class?.teacher
        ? `${assignment.class.teacher.firstName} ${assignment.class.teacher.lastName}`.trim()
        : null,
      dueDate: assignment.dueDate as Date | null,
      totalPoints: assignment.totalPoints as number | null,
      status: assignment.status as string,
      submissionCount: assignment._count.assignmentSubmissions as number,
      gradedCount:
        assignment.assignmentSubmissions?.filter(
          (s: any) => s.gradedAt !== null
        ).length || 0,
      createdAt: assignment.createdAt as Date,
    }))

    return { success: true, data: exportData }
  } catch (error) {
    console.error("[getAssignmentsExportData] Error:", error)

    return actionError(
      ACTION_ERRORS.UNKNOWN,
      error instanceof Error ? error.message : undefined
    )
  }
}
