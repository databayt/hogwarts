"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { revalidatePath } from "next/cache"
import { after } from "next/server"
import { auth } from "@/auth"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"
import { upsertGradebookResult } from "@/components/school-dashboard/grades/lib/gradebook"
import { prewarm } from "@/components/translation/prewarm"

import {
  quickAssessmentCreateSchema,
  quickAssessmentUpdateSchema,
  submitQuickResponseSchema,
} from "../validation"
import type {
  ActionResponse,
  QuickAssessmentResults,
  QuickAssessmentSummary,
} from "./types"

// Types available from "./types" directly (not re-exported from "use server" module)

// ============================================================================
// HELPERS
// ============================================================================

async function getSchoolId(): Promise<string | null> {
  // Honour impersonation + subdomain header before falling back to the session.
  const { schoolId } = await getTenantContext()
  return schoolId
}

async function getUserId(): Promise<string | null> {
  const session = await auth()
  return session?.user?.id ?? null
}

// ============================================================================
// QUICK ASSESSMENT CRUD
// ============================================================================

export async function createQuickAssessment(
  input: unknown
): Promise<ActionResponse<{ id: string }>> {
  try {
    const schoolId = await getSchoolId()
    const userId = await getUserId()
    if (!schoolId || !userId) {
      return { success: false, error: "Unauthorized", code: "NO_SCHOOL" }
    }

    const parsed = quickAssessmentCreateSchema.parse(input)

    const assessment = await db.quickAssessment.create({
      data: {
        schoolId,
        classId: parsed.classId,
        subjectId: parsed.subjectId,
        title: parsed.title,
        type: parsed.type,
        status: "DRAFT",
        questionIds: parsed.questionIds,
        duration: parsed.duration,
        isAnonymous: parsed.isAnonymous,
        showResults: parsed.showResults,
        createdBy: userId,
      },
    })

    after(() => prewarm("QuickAssessment", assessment, { schoolId }))
    revalidatePath("/exams/quick")
    return { success: true, data: { id: assessment.id } }
  } catch (error) {
    console.error("Error creating quick assessment:", error)
    return {
      success: false,
      error: "Failed to create assessment",
      code: "CREATE_FAILED",
    }
  }
}

export async function launchQuickAssessment(
  id: string
): Promise<ActionResponse> {
  try {
    const schoolId = await getSchoolId()
    if (!schoolId) {
      return { success: false, error: "Unauthorized", code: "NO_SCHOOL" }
    }

    const existing = await db.quickAssessment.findFirst({
      where: { id, schoolId },
    })

    if (!existing) {
      return {
        success: false,
        error: "Assessment not found",
        code: "NOT_FOUND",
      }
    }

    await db.quickAssessment.update({
      where: { id },
      data: { status: "ACTIVE" },
    })

    revalidatePath("/exams/quick")
    return { success: true }
  } catch (error) {
    console.error("Error launching quick assessment:", error)
    return {
      success: false,
      error: "Failed to launch assessment",
      code: "LAUNCH_FAILED",
    }
  }
}

export async function closeQuickAssessment(
  id: string
): Promise<ActionResponse> {
  try {
    const schoolId = await getSchoolId()
    if (!schoolId) {
      return { success: false, error: "Unauthorized", code: "NO_SCHOOL" }
    }

    const existing = await db.quickAssessment.findFirst({
      where: { id, schoolId },
    })

    if (!existing) {
      return {
        success: false,
        error: "Assessment not found",
        code: "NOT_FOUND",
      }
    }

    await db.quickAssessment.update({
      where: { id },
      data: { status: "CLOSED" },
    })

    revalidatePath("/exams/quick")
    return { success: true }
  } catch (error) {
    console.error("Error closing quick assessment:", error)
    return {
      success: false,
      error: "Failed to close assessment",
      code: "CLOSE_FAILED",
    }
  }
}

export async function getQuickAssessments(filters?: {
  classId?: string
}): Promise<QuickAssessmentSummary[]> {
  try {
    const schoolId = await getSchoolId()
    if (!schoolId) return []

    const where: Record<string, unknown> = { schoolId }
    if (filters?.classId) where.classId = filters.classId

    const assessments = await db.quickAssessment.findMany({
      where,
      include: {
        class: true,
        subject: true,
        _count: { select: { responses: true } },
      },
      orderBy: { createdAt: "desc" },
    })

    return assessments.map((a) => ({
      id: a.id,
      title: a.title,
      type: a.type,
      status: a.status,
      classId: a.classId,
      className: a.class.name || "",
      subjectId: a.subjectId,
      name: a.subject.name || "",
      questionCount: a.questionIds.length,
      responseCount: a._count.responses,
      duration: a.duration,
      createdAt: a.createdAt,
    }))
  } catch (error) {
    console.error("Error fetching quick assessments:", error)
    return []
  }
}

export async function getQuickAssessment(id: string) {
  try {
    const schoolId = await getSchoolId()
    if (!schoolId) return null

    return await db.quickAssessment.findFirst({
      where: { id, schoolId },
      include: {
        class: true,
        subject: true,
        _count: { select: { responses: true } },
      },
    })
  } catch (error) {
    console.error("Error fetching quick assessment:", error)
    return null
  }
}

// ============================================================================
// STUDENT RESPONSES
// ============================================================================

export async function submitQuickResponse(
  input: unknown
): Promise<ActionResponse> {
  try {
    const schoolId = await getSchoolId()
    const session = await auth()
    if (!schoolId) {
      return { success: false, error: "Unauthorized", code: "NO_SCHOOL" }
    }

    const parsed = submitQuickResponseSchema.parse(input)

    // Get assessment to check if anonymous
    const assessment = await db.quickAssessment.findFirst({
      where: { id: parsed.assessmentId, schoolId, status: "ACTIVE" },
    })

    if (!assessment) {
      return {
        success: false,
        error: "Assessment not found or not active",
        code: "NOT_FOUND",
      }
    }

    // Get studentId from database based on user if not anonymous
    let studentId: string | null = null
    if (!assessment.isAnonymous && session?.user?.id) {
      const student = await db.student.findFirst({
        where: {
          userId: session.user.id,
          schoolId,
        },
        select: { id: true },
      })
      studentId = student?.id || null
    }

    // Check if student already submitted (if not anonymous)
    if (studentId) {
      const existing = await db.quickAssessmentResponse.findUnique({
        where: {
          assessmentId_studentId: {
            assessmentId: parsed.assessmentId,
            studentId,
          },
        },
      })

      if (existing) {
        return {
          success: false,
          error: "You have already submitted this assessment",
          code: "DUPLICATE",
        }
      }
    }

    await db.quickAssessmentResponse.create({
      data: {
        schoolId,
        assessmentId: parsed.assessmentId,
        studentId,
        responses: parsed.responses as any,
        startedAt: new Date(),
        completedAt: new Date(),
      },
    })

    // Write to unified gradebook for non-anonymous, identified students.
    if (studentId && !assessment.isAnonymous) {
      try {
        const responses = parsed.responses as Array<{
          questionId: string
          answer: unknown
          isCorrect?: boolean
        }>
        // Only grade if at least one response carries an isCorrect flag.
        const hasCorrectFlags = responses.some((r) => r.isCorrect !== undefined)
        const max = responses.length
        if (hasCorrectFlags && max > 0) {
          const correct = responses.filter((r) => r.isCorrect === true).length
          await upsertGradebookResult({
            schoolId,
            studentId,
            classId: assessment.classId,
            subjectId: assessment.subjectId,
            score: correct,
            maxScore: max,
            title: assessment.title,
            gradedBy: session?.user?.id ?? undefined,
          })
        }
      } catch (gbErr) {
        console.error("[submitQuickResponse] gradebook write failed:", gbErr)
        // Gradebook failure must not break the response submission.
      }
    }

    revalidatePath("/exams/quick")
    return { success: true }
  } catch (error) {
    console.error("Error submitting quick response:", error)
    return {
      success: false,
      error: "Failed to submit response",
      code: "SUBMIT_FAILED",
    }
  }
}

// ============================================================================
// RESULTS & ANALYTICS
// ============================================================================

export async function getQuickAssessmentResults(
  id: string
): Promise<ActionResponse<QuickAssessmentResults>> {
  try {
    const schoolId = await getSchoolId()
    if (!schoolId) {
      return { success: false, error: "Unauthorized", code: "NO_SCHOOL" }
    }

    const assessment = await db.quickAssessment.findFirst({
      where: { id, schoolId },
      include: {
        responses: true,
      },
    })

    if (!assessment) {
      return {
        success: false,
        error: "Assessment not found",
        code: "NOT_FOUND",
      }
    }

    // Aggregate results per question
    const questionResults = assessment.questionIds.map((questionId) => {
      const responses = assessment.responses
        .map((r) => {
          const responseData = r.responses as Array<{
            questionId: string
            answer: unknown
            isCorrect?: boolean
          }>
          return responseData.find((resp) => resp.questionId === questionId)
        })
        .filter(Boolean)

      // Count unique answers
      const answerCounts = new Map<
        string,
        { count: number; isCorrect?: boolean }
      >()
      responses.forEach((resp) => {
        if (resp) {
          const answerKey = JSON.stringify(resp.answer)
          const existing = answerCounts.get(answerKey) || { count: 0 }
          answerCounts.set(answerKey, {
            count: existing.count + 1,
            isCorrect: resp.isCorrect,
          })
        }
      })

      return {
        questionId,
        questionText: `Question ${questionId}`, // TODO: Fetch actual question text from QBank
        responses: Array.from(answerCounts.entries()).map(
          ([answerKey, data]) => ({
            answer: JSON.parse(answerKey),
            count: data.count,
            isCorrect: data.isCorrect,
          })
        ),
      }
    })

    return {
      success: true,
      data: {
        assessmentId: assessment.id,
        title: assessment.title,
        totalResponses: assessment.responses.length,
        questionResults,
      },
    }
  } catch (error) {
    console.error("Error fetching quick assessment results:", error)
    return {
      success: false,
      error: "Failed to fetch results",
      code: "RESULTS_FAILED",
    }
  }
}
