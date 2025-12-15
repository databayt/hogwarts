"use server"

import { revalidatePath, revalidateTag } from "next/cache"
import { auth } from "@/auth"
import { z } from "zod"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"
import {
  assertResultPermission,
  canCreateResult,
  getAuthContext,
} from "@/components/platform/grades/authorization"
import {
  calculateGrade,
  formatResultRow,
  getResultDetail,
  getResultsList,
} from "@/components/platform/grades/queries"
import {
  getResultsSchema,
  resultCreateSchema,
  resultUpdateSchema,
} from "@/components/platform/grades/validation"

// ============================================================================
// Types
// ============================================================================

export type ActionResponse<T = void> =
  | { success: true; data: T }
  | { success: false; error: string }

type ResultSelectResult = {
  id: string
  schoolId: string
  studentId: string
  assignmentId: string | null
  classId: string
  score: number
  maxScore: number
  percentage: number
  grade: string
  feedback: string | null
  submittedAt: Date | null
  gradedAt: Date | null
  createdAt: Date
  updatedAt: Date
}

type ResultListResult = {
  id: string
  studentName: string
  assignmentTitle: string
  className: string
  score: number
  maxScore: number
  percentage: number
  grade: string
  createdAt: string
}

// ============================================================================
// Constants
// ============================================================================

const GRADES_PATH = "/grades"

// ============================================================================
// Mutations
// ============================================================================

/**
 * Create a new result/grade
 * @param input - Result data
 * @returns Action response with result ID
 */
export async function createResult(
  input: z.infer<typeof resultCreateSchema>
): Promise<ActionResponse<{ id: string }>> {
  try {
    // Get authentication context
    const session = await auth()
    const authContext = getAuthContext(session)
    if (!authContext) {
      return { success: false, error: "Not authenticated" }
    }

    // Get tenant context
    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return { success: false, error: "Missing school context" }
    }

    // Parse and validate input
    const parsed = resultCreateSchema.parse(input)

    // Check create permission
    if (!canCreateResult(authContext.role)) {
      return {
        success: false,
        error: "Unauthorized to create results",
      }
    }

    // Calculate percentage
    const percentage = (parsed.score / parsed.maxScore) * 100

    // Create result with audit trail
    const row = await db.result.create({
      data: {
        schoolId,
        studentId: parsed.studentId,
        assignmentId: parsed.assignmentId || null,
        classId: parsed.classId,
        score: parsed.score,
        maxScore: parsed.maxScore,
        percentage,
        grade: parsed.grade,
        feedback: parsed.feedback || null,
        gradedAt: new Date(),
        gradedBy: authContext.userId,
      },
    })

    // Revalidate cache
    revalidatePath(GRADES_PATH)
    revalidateTag(`grades-${schoolId}`, "max")

    return { success: true, data: { id: row.id } }
  } catch (error) {
    console.error("[createResult] Error:", error, {
      input,
      timestamp: new Date().toISOString(),
    })

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: `Validation error: ${error.issues.map((e) => e.message).join(", ")}`,
      }
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create result",
    }
  }
}

/**
 * Update an existing result
 * @param input - Result update data
 * @returns Action response
 */
export async function updateResult(
  input: z.infer<typeof resultUpdateSchema>
): Promise<ActionResponse<void>> {
  try {
    // Get authentication context
    const session = await auth()
    const authContext = getAuthContext(session)
    if (!authContext) {
      return { success: false, error: "Not authenticated" }
    }

    // Get tenant context
    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return { success: false, error: "Missing school context" }
    }

    // Parse and validate input
    const parsed = resultUpdateSchema.parse(input)
    const { id, ...rest } = parsed

    // Fetch existing result to check ownership
    const existing = await db.result.findFirst({
      where: { id, schoolId },
      select: { id: true, gradedBy: true, schoolId: true },
    })

    if (!existing) {
      return { success: false, error: "Result not found" }
    }

    // Check update permission
    try {
      assertResultPermission(authContext, "update", {
        id: existing.id,
        gradedBy: existing.gradedBy,
        schoolId: existing.schoolId,
      })
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unauthorized to update this result",
      }
    }

    // Build update data object using raw data for updateMany
    const data: Record<string, unknown> = {}

    if (typeof rest.studentId !== "undefined") data.studentId = rest.studentId
    if (typeof rest.assignmentId !== "undefined")
      data.assignmentId = rest.assignmentId || null
    if (typeof rest.classId !== "undefined") data.classId = rest.classId
    if (typeof rest.score !== "undefined") data.score = rest.score
    if (typeof rest.maxScore !== "undefined") data.maxScore = rest.maxScore
    if (typeof rest.grade !== "undefined") data.grade = rest.grade
    if (typeof rest.feedback !== "undefined")
      data.feedback = rest.feedback || null

    // Recalculate percentage if score or maxScore changed
    if (
      typeof rest.score !== "undefined" ||
      typeof rest.maxScore !== "undefined"
    ) {
      const currentData = await db.result.findFirst({
        where: { id, schoolId },
        select: { score: true, maxScore: true },
      })
      if (currentData) {
        const newScore =
          typeof rest.score !== "undefined"
            ? rest.score
            : Number(currentData.score)
        const newMaxScore =
          typeof rest.maxScore !== "undefined"
            ? rest.maxScore
            : Number(currentData.maxScore)
        data.percentage = (newScore / newMaxScore) * 100
      }
    }

    data.gradedAt = new Date()

    // Update result (using updateMany for tenant safety)
    await db.result.updateMany({
      where: { id, schoolId },
      data,
    })

    // Revalidate cache
    revalidatePath(GRADES_PATH)
    revalidateTag(`grades-${schoolId}`, "max")

    return { success: true, data: undefined }
  } catch (error) {
    console.error("[updateResult] Error:", error, {
      input,
      timestamp: new Date().toISOString(),
    })

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: `Validation error: ${error.issues.map((e) => e.message).join(", ")}`,
      }
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update result",
    }
  }
}

/**
 * Delete a result
 * @param input - Result ID
 * @returns Action response
 */
export async function deleteResult(input: {
  id: string
}): Promise<ActionResponse<void>> {
  try {
    // Get authentication context
    const session = await auth()
    const authContext = getAuthContext(session)
    if (!authContext) {
      return { success: false, error: "Not authenticated" }
    }

    // Get tenant context
    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return { success: false, error: "Missing school context" }
    }

    // Parse and validate input
    const { id } = z.object({ id: z.string().min(1) }).parse(input)

    // Fetch existing result to check ownership
    const existing = await db.result.findFirst({
      where: { id, schoolId },
      select: { id: true, gradedBy: true, schoolId: true },
    })

    if (!existing) {
      return { success: false, error: "Result not found" }
    }

    // Check delete permission
    try {
      assertResultPermission(authContext, "delete", {
        id: existing.id,
        gradedBy: existing.gradedBy,
        schoolId: existing.schoolId,
      })
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unauthorized to delete this result",
      }
    }

    // Delete result (using deleteMany for tenant safety)
    await db.result.deleteMany({ where: { id, schoolId } })

    // Revalidate cache
    revalidatePath(GRADES_PATH)
    revalidateTag(`grades-${schoolId}`, "max")

    return { success: true, data: undefined }
  } catch (error) {
    console.error("[deleteResult] Error:", error, {
      input,
      timestamp: new Date().toISOString(),
    })

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: `Validation error: ${error.issues.map((e) => e.message).join(", ")}`,
      }
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete result",
    }
  }
}

// ============================================================================
// Queries
// ============================================================================

/**
 * Get a single result by ID
 * @param input - Result ID
 * @returns Action response with result data
 */
export async function getResult(input: {
  id: string
}): Promise<ActionResponse<ResultSelectResult | null>> {
  try {
    // Get authentication context
    const session = await auth()
    const authContext = getAuthContext(session)
    if (!authContext) {
      return { success: false, error: "Not authenticated" }
    }

    // Get tenant context
    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return { success: false, error: "Missing school context" }
    }

    // Parse and validate input
    const { id } = z.object({ id: z.string().min(1) }).parse(input)

    // Fetch result with proper select
    const result = await getResultDetail(schoolId, id)

    if (!result) {
      return { success: true, data: null }
    }

    // Check read permission
    try {
      assertResultPermission(authContext, "read", {
        id: result.id,
        schoolId: result.schoolId,
      })
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unauthorized to read this result",
      }
    }

    // Map to response type
    const mapped: ResultSelectResult = {
      id: result.id,
      schoolId: result.schoolId,
      studentId: result.studentId,
      assignmentId: result.assignmentId,
      classId: result.classId,
      score: Number(result.score),
      maxScore: Number(result.maxScore),
      percentage: result.percentage,
      grade: result.grade,
      feedback: result.feedback,
      submittedAt: result.submittedAt,
      gradedAt: result.gradedAt,
      createdAt: result.createdAt,
      updatedAt: result.updatedAt,
    }

    return { success: true, data: mapped }
  } catch (error) {
    console.error("[getResult] Error:", error, {
      input,
      timestamp: new Date().toISOString(),
    })

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: `Validation error: ${error.issues.map((e) => e.message).join(", ")}`,
      }
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch result",
    }
  }
}

/**
 * Get results list with filtering and pagination
 * @param input - Query parameters
 * @returns Action response with results and total count
 */
export async function getResults(
  input: Partial<z.infer<typeof getResultsSchema>>
): Promise<ActionResponse<{ rows: ResultListResult[]; total: number }>> {
  try {
    // Get authentication context
    const session = await auth()
    const authContext = getAuthContext(session)
    if (!authContext) {
      return { success: false, error: "Not authenticated" }
    }

    // Get tenant context
    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return { success: false, error: "Missing school context" }
    }

    // Parse and validate input
    const sp = getResultsSchema.parse(input ?? {})

    // Use centralized query builder
    const { rows, count } = await getResultsList(schoolId, {
      page: sp.page,
      perPage: sp.perPage,
      studentId: sp.studentId || undefined,
      assignmentId: sp.assignmentId || undefined,
      classId: sp.classId || undefined,
      grade: sp.grade || undefined,
      sort: sp.sort,
    })

    // Map results using helper function
    const mapped: ResultListResult[] = rows.map((r) => formatResultRow(r))

    return { success: true, data: { rows: mapped, total: count } }
  } catch (error) {
    console.error("[getResults] Error:", error, {
      input,
      timestamp: new Date().toISOString(),
    })

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: `Validation error: ${error.issues.map((e) => e.message).join(", ")}`,
      }
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch results",
    }
  }
}

/**
 * Export results to CSV format
 * @param input - Query parameters for filtering
 * @returns CSV string
 */
export async function getResultsCSV(
  input?: Partial<z.infer<typeof getResultsSchema>>
): Promise<ActionResponse<string>> {
  try {
    // Get authentication context
    const session = await auth()
    const authContext = getAuthContext(session)
    if (!authContext) {
      return { success: false, error: "Not authenticated" }
    }

    // Get tenant context
    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return { success: false, error: "Missing school context" }
    }

    // Check export permission
    try {
      assertResultPermission(authContext, "export", { schoolId })
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unauthorized to export results",
      }
    }

    const sp = getResultsSchema.parse(input ?? {})

    // Fetch all results (no pagination for export)
    const { rows } = await getResultsList(schoolId, {
      page: 1,
      perPage: 10000, // Large number to get all results
      studentId: sp.studentId || undefined,
      assignmentId: sp.assignmentId || undefined,
      classId: sp.classId || undefined,
      grade: sp.grade || undefined,
    })

    // Build CSV
    const headers = [
      "ID",
      "Student",
      "Assignment",
      "Class",
      "Score",
      "Max Score",
      "Percentage",
      "Grade",
      "Created",
    ]
    const csvRows = rows.map((r) =>
      [
        r.id,
        `"${r.student ? `${r.student.givenName} ${r.student.surname}` : "Unknown"}"`,
        `"${(r.assignment?.title || r.exam?.title || "").replace(/"/g, '""')}"`,
        `"${(r.class?.name || "").replace(/"/g, '""')}"`,
        Number(r.score),
        Number(r.maxScore),
        r.percentage?.toFixed(1) || "0",
        r.grade,
        new Date(r.createdAt).toISOString().split("T")[0],
      ].join(",")
    )

    const csv = [headers.join(","), ...csvRows].join("\n")

    return { success: true, data: csv }
  } catch (error) {
    console.error("[getResultsCSV] Error:", error, {
      input,
      timestamp: new Date().toISOString(),
    })

    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to export results",
    }
  }
}

// ============================================================================
// Bulk Actions
// ============================================================================

/**
 * Delete multiple results
 * @param input - Array of result IDs
 * @returns Action response with count of deleted results
 */
export async function bulkDeleteResults(input: {
  ids: string[]
}): Promise<ActionResponse<{ count: number }>> {
  try {
    // Get authentication context
    const session = await auth()
    const authContext = getAuthContext(session)
    if (!authContext) {
      return { success: false, error: "Not authenticated" }
    }

    // Get tenant context
    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return { success: false, error: "Missing school context" }
    }

    // Check bulk action permission
    try {
      assertResultPermission(authContext, "bulk_action", { schoolId })
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Unauthorized to perform bulk actions",
      }
    }

    // Parse and validate input
    const { ids } = z.object({ ids: z.array(z.string().min(1)) }).parse(input)

    // Delete results (using deleteMany for tenant safety)
    const { count } = await db.result.deleteMany({
      where: {
        id: { in: ids },
        schoolId,
      },
    })

    // Revalidate cache
    revalidatePath(GRADES_PATH)
    revalidateTag(`grades-${schoolId}`, "max")

    return { success: true, data: { count } }
  } catch (error) {
    console.error("[bulkDeleteResults] Error:", error, {
      input,
      timestamp: new Date().toISOString(),
    })

    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to delete results",
    }
  }
}
