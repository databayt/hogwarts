"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { after } from "next/server"
import { auth } from "@/auth"

import { db } from "@/lib/db"
import { refreshPage } from "@/lib/refresh-page"
import { audienceLabel, studentAudienceWhere } from "@/lib/teaching-audience"
import { getStudentScopes } from "@/lib/teaching-scope"
import { getTenantContext } from "@/lib/tenant-context"
import {
  resolveStudentSubjectContext,
  upsertGradebookResult,
} from "@/components/school-dashboard/grades/lib/gradebook"
import { resolveTeachingScope } from "@/components/school-dashboard/teaching-scope/resolve"
import { prewarm } from "@/components/translation/prewarm"

import { gradeQuickResponses, toTakeQuestions } from "../grading"
import {
  quickAssessmentCreateSchema,
  quickAssessmentReviewSchema,
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

/** Who may write, launch and close quick assessments. */
const AUTHOR_ROLES = ["DEVELOPER", "ADMIN", "TEACHER"]

async function getAuthor(): Promise<{
  schoolId: string
  userId: string
  role: string
} | null> {
  const [session, schoolId] = await Promise.all([auth(), getSchoolId()])
  const userId = session?.user?.id
  const role = session?.user?.role
  if (!schoolId || !userId || !role || !AUTHOR_ROLES.includes(role)) {
    return null
  }
  return { schoolId, userId, role }
}

/**
 * The school's bank questions for one subject — the quick-check form's
 * picker. The form used to ask a teacher to TYPE question ids, which nobody
 * can; this lets them tick questions instead. Authors only, tenant-scoped,
 * bounded.
 */
export async function listQuickCheckQuestions(input: {
  subjectId: string
}): Promise<
  | {
      success: true
      data: Array<{
        id: string
        questionText: string
        questionType: string
        difficulty: string
      }>
    }
  | { success: false; error: string }
> {
  const author = await getAuthor()
  if (!author) return { success: false, error: "Unauthorized" }
  if (typeof input?.subjectId !== "string" || !input.subjectId) {
    return { success: false, error: "VALIDATION_ERROR" }
  }
  const rows = await db.questionBank.findMany({
    // wizardStep null = the shared bank; unreviewed AI drafts ("ai-draft") stay out
    where: {
      schoolId: author.schoolId,
      subjectId: input.subjectId,
      wizardStep: null,
    },
    select: {
      id: true,
      questionText: true,
      questionType: true,
      difficulty: true,
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  })
  return {
    success: true,
    data: rows.map((r) => ({
      ...r,
      questionType: String(r.questionType),
      difficulty: String(r.difficulty),
    })),
  }
}

/**
 * The assessments a viewer may see: a student their audience's (section,
 * or whole grade), a guardian their children's; staff the
 * school's.
 */
async function viewerAudienceWhere(
  schoolId: string
): Promise<Record<string, unknown>> {
  const session = await auth()
  const userId = session?.user?.id
  const role = session?.user?.role
  if (!userId) return { id: { in: [] } }
  if (role === "STUDENT" || role === "GUARDIAN") {
    const studentIds =
      role === "STUDENT"
        ? (
            await db.student.findMany({
              where: { schoolId, userId },
              select: { id: true },
            })
          ).map((s) => s.id)
        : (
            await db.studentGuardian.findMany({
              where: { schoolId, guardian: { userId } },
              select: { studentId: true },
            })
          ).map((g) => g.studentId)
    // A student or guardian never sees a DRAFT — nor its questions
    return {
      ...studentAudienceWhere(await getStudentScopes(schoolId, studentIds)),
      status: { in: ["ACTIVE", "CLOSED"] },
    }
  }
  return {}
}

// ============================================================================
// QUICK ASSESSMENT CRUD
// ============================================================================

export async function createQuickAssessment(
  input: unknown
): Promise<ActionResponse<{ id: string }>> {
  try {
    const author = await getAuthor()
    if (!author) {
      return { success: false, error: "Unauthorized", code: "NO_SCHOOL" }
    }
    const { schoolId, userId } = author

    const parsed = quickAssessmentCreateSchema.parse(input)

    // A grade of this school, a section of that grade (or the whole grade),
    // a subject the grade studies — and the active term
    const resolved = await resolveTeachingScope(schoolId, parsed)
    if (!resolved.ok) {
      return { success: false, error: resolved.code, code: resolved.code }
    }
    const { scope } = resolved

    const assessment = await db.quickAssessment.create({
      data: {
        schoolId,
        gradeId: scope.gradeId,
        sectionId: scope.sectionId,
        termId: scope.termId,
        subjectId: scope.subjectId,
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
    refreshPage("/exams/quick")
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
    const author = await getAuthor()
    if (!author) {
      return { success: false, error: "Unauthorized", code: "NO_SCHOOL" }
    }
    const { schoolId } = author

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

    // Publishing a reviewed AI draft brings its questions out of the hidden
    // "ai-draft" state, so the shared question bank lists them from now on
    // (the sentinel is documented in lesson-draft/README.md).
    await db.$transaction([
      db.questionBank.updateMany({
        where: {
          schoolId,
          id: { in: existing.questionIds },
          wizardStep: "ai-draft",
        },
        data: { wizardStep: null },
      }),
      db.quickAssessment.updateMany({
        where: { id, schoolId },
        data: { status: "ACTIVE" },
      }),
    ])

    refreshPage("/exams/quick")
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
    const author = await getAuthor()
    if (!author) {
      return { success: false, error: "Unauthorized", code: "NO_SCHOOL" }
    }
    const { schoolId } = author

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

    refreshPage("/exams/quick")
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
  sectionId?: string
}): Promise<QuickAssessmentSummary[]> {
  try {
    const schoolId = await getSchoolId()
    if (!schoolId) return []

    const where: Record<string, unknown> = {
      schoolId,
      ...(await viewerAudienceWhere(schoolId)),
    }
    if (filters?.sectionId) where.sectionId = filters.sectionId

    const assessments = await db.quickAssessment.findMany({
      where,
      include: {
        section: { select: { name: true } },
        grade: { select: { name: true } },
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
      gradeId: a.gradeId,
      sectionId: a.sectionId,
      // The audience as people say it: section or whole grade
      className: audienceLabel(a),
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

    const assessment = await db.quickAssessment.findFirst({
      where: { id, schoolId, ...(await viewerAudienceWhere(schoolId)) },
      include: {
        section: { select: { name: true } },
        grade: { select: { name: true } },
        subject: true,
        _count: { select: { responses: true } },
      },
    })
    if (!assessment) return null

    // The questions the take screen renders — option texts only, never the key
    const bank = await db.questionBank.findMany({
      where: { schoolId, id: { in: assessment.questionIds } },
      select: {
        id: true,
        questionText: true,
        questionType: true,
        options: true,
      },
    })
    return {
      ...assessment,
      questions: toTakeQuestions(assessment.questionIds, bank),
    }
  } catch (error) {
    console.error("Error fetching quick assessment:", error)
    return null
  }
}

// ============================================================================
// DRAFT REVIEW (a teacher edits a draft before publishing it)
// ============================================================================

/**
 * The draft a review action may touch: the school's, still DRAFT, and the
 * caller's own unless the caller is an admin.
 */
async function reviewableDraft(
  author: { schoolId: string; userId: string; role: string },
  id: string
): Promise<
  | { ok: true; assessment: { id: string; questionIds: string[] } }
  | { ok: false; code: "NOT_FOUND" | "NOT_DRAFT" | "FORBIDDEN" }
> {
  const assessment = await db.quickAssessment.findFirst({
    where: { id, schoolId: author.schoolId },
    select: { id: true, status: true, createdBy: true, questionIds: true },
  })
  if (!assessment) return { ok: false, code: "NOT_FOUND" }
  const isAdmin = author.role === "ADMIN" || author.role === "DEVELOPER"
  if (!isAdmin && assessment.createdBy !== author.userId) {
    return { ok: false, code: "FORBIDDEN" }
  }
  if (assessment.status !== "DRAFT") return { ok: false, code: "NOT_DRAFT" }
  return { ok: true, assessment }
}

export async function updateQuickAssessment(
  id: string,
  input: unknown
): Promise<ActionResponse<{ id: string }>> {
  try {
    const author = await getAuthor()
    if (!author) {
      return { success: false, error: "Unauthorized", code: "NO_SCHOOL" }
    }
    const parsed = quickAssessmentReviewSchema.safeParse(input)
    if (!parsed.success) {
      return {
        success: false,
        error: "Invalid input",
        code: "VALIDATION_ERROR",
      }
    }
    const draft = await reviewableDraft(author, id)
    if (!draft.ok) {
      return { success: false, error: draft.code, code: draft.code }
    }
    const { assessment } = draft
    const patch = parsed.data

    let removed: string[] = []
    if (patch.questionIds) {
      const owned = new Set(assessment.questionIds)
      const unique = new Set(patch.questionIds)
      if (
        unique.size !== patch.questionIds.length ||
        patch.questionIds.some((q) => !owned.has(q))
      ) {
        return {
          success: false,
          error: "Invalid questions",
          code: "VALIDATION_ERROR",
        }
      }
      removed = assessment.questionIds.filter((q) => !unique.has(q))
    }

    await db.$transaction([
      db.quickAssessment.updateMany({
        where: { id, schoolId: author.schoolId, status: "DRAFT" },
        data: {
          ...(patch.title !== undefined ? { title: patch.title } : {}),
          ...(patch.duration !== undefined ? { duration: patch.duration } : {}),
          ...(patch.showResults !== undefined
            ? { showResults: patch.showResults }
            : {}),
          ...(patch.questionIds ? { questionIds: patch.questionIds } : {}),
        },
      }),
      // A question the teacher dropped from an AI draft goes with it — it
      // was never published, so nothing else can reference it
      ...(removed.length
        ? [
            db.questionBank.deleteMany({
              where: {
                schoolId: author.schoolId,
                id: { in: removed },
                wizardStep: "ai-draft",
              },
            }),
          ]
        : []),
    ])

    refreshPage("/exams/quick")
    return { success: true, data: { id } }
  } catch (error) {
    console.error("Error updating quick assessment:", error)
    return {
      success: false,
      error: "Failed to update assessment",
      code: "UPDATE_FAILED",
    }
  }
}

export async function deleteQuickAssessment(
  id: string
): Promise<ActionResponse> {
  try {
    const author = await getAuthor()
    if (!author) {
      return { success: false, error: "Unauthorized", code: "NO_SCHOOL" }
    }
    const draft = await reviewableDraft(author, id)
    if (!draft.ok) {
      return { success: false, error: draft.code, code: draft.code }
    }
    const { schoolId } = author

    await db.$transaction([
      db.conferenceResource.deleteMany({
        where: { schoolId, quickAssessmentId: id },
      }),
      db.quickAssessment.deleteMany({
        where: { id, schoolId, status: "DRAFT" },
      }),
      // Its unlaunched AI questions were never in the shared bank
      db.questionBank.deleteMany({
        where: {
          schoolId,
          id: { in: draft.assessment.questionIds },
          wizardStep: "ai-draft",
        },
      }),
    ])

    refreshPage("/exams/quick")
    return { success: true }
  } catch (error) {
    console.error("Error deleting quick assessment:", error)
    return {
      success: false,
      error: "Failed to delete assessment",
      code: "DELETE_FAILED",
    }
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

    // Only a student of the assessment's audience answers it
    const student = session?.user?.id
      ? await db.student.findFirst({
          where: { userId: session.user.id, schoolId },
          select: { id: true },
        })
      : null
    if (!student) {
      return { success: false, error: "Unauthorized", code: "NOT_A_STUDENT" }
    }
    const scopes = await getStudentScopes(schoolId, [student.id])

    const assessment = await db.quickAssessment.findFirst({
      where: {
        id: parsed.assessmentId,
        schoolId,
        status: "ACTIVE",
        ...studentAudienceWhere(scopes),
      },
    })

    if (!assessment) {
      return {
        success: false,
        error: "Assessment not found or not active",
        code: "NOT_FOUND",
      }
    }

    // An anonymous assessment keeps no student on the response
    const studentId: string | null = assessment.isAnonymous ? null : student.id

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

    // Correctness comes from the bank, never from the browser
    const bank = await db.questionBank.findMany({
      where: { schoolId, id: { in: assessment.questionIds } },
      select: {
        id: true,
        questionText: true,
        questionType: true,
        options: true,
      },
    })
    const { graded, correct, gradable } = gradeQuickResponses(
      assessment.questionIds,
      bank,
      parsed.responses
    )

    await db.quickAssessmentResponse.create({
      data: {
        schoolId,
        assessmentId: parsed.assessmentId,
        studentId,
        responses: graded as any,
        startedAt: new Date(),
        completedAt: new Date(),
      },
    })

    // Write to unified gradebook for non-anonymous, identified students.
    if (studentId && !assessment.isAnonymous) {
      try {
        // Scored out of the assessment's keyed questions; open-only ones
        // leave the gradebook alone
        const max = gradable
        // Filed under the student's section, grade and term for the subject
        const ctx = await resolveStudentSubjectContext(
          schoolId,
          studentId,
          assessment.subjectId
        )
        if (max > 0 && ctx) {
          await upsertGradebookResult({
            schoolId,
            studentId,
            sectionId: ctx.sectionId,
            academicGradeId: ctx.academicGradeId,
            termId: ctx.termId ?? assessment.termId,
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

    refreshPage("/exams/quick")
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
    const author = await getAuthor()
    if (!author) {
      return { success: false, error: "Unauthorized", code: "NO_SCHOOL" }
    }
    const { schoolId } = author

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

    const bank = await db.questionBank.findMany({
      where: { schoolId, id: { in: assessment.questionIds } },
      select: {
        id: true,
        questionText: true,
        questionType: true,
        options: true,
      },
    })
    const takeQuestions = new Map(
      toTakeQuestions(assessment.questionIds, bank).map((q) => [q.id, q])
    )

    // Aggregate results per question
    const questionResults = assessment.questionIds.map((questionId) => {
      const question = takeQuestions.get(questionId)
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
        questionText: question?.questionText ?? questionId,
        responses: Array.from(answerCounts.entries()).map(
          ([answerKey, data]) => {
            const answer = JSON.parse(answerKey)
            // A choice answer is an option index — show the option's text
            const option =
              question?.options?.[Number.parseInt(String(answer), 10)]
            return {
              answer: option ? option.text : answer,
              count: data.count,
              isCorrect: data.isCorrect,
            }
          }
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
