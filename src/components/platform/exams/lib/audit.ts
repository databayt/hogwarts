/**
 * Exam Audit Logging
 *
 * Provides audit trail for critical exam operations including:
 * - Grade changes and overrides
 * - Exam submissions
 * - Results modifications
 * - Answer changes
 */

import { db } from "@/lib/db"

/**
 * Audit event types for exam module
 */
export enum ExamAuditEvent {
  // Marking events
  GRADE_ASSIGNED = "GRADE_ASSIGNED",
  GRADE_OVERRIDDEN = "GRADE_OVERRIDDEN",
  AI_GRADE_ACCEPTED = "AI_GRADE_ACCEPTED",
  AI_GRADE_REJECTED = "AI_GRADE_REJECTED",
  MANUAL_GRADE_ENTERED = "MANUAL_GRADE_ENTERED",

  // Exam taking events
  EXAM_STARTED = "EXAM_STARTED",
  EXAM_SUBMITTED = "EXAM_SUBMITTED",
  EXAM_ABANDONED = "EXAM_ABANDONED",
  ANSWER_SAVED = "ANSWER_SAVED",
  ANSWER_MODIFIED = "ANSWER_MODIFIED",

  // Result events
  RESULT_PUBLISHED = "RESULT_PUBLISHED",
  RESULT_MODIFIED = "RESULT_MODIFIED",
  CERTIFICATE_GENERATED = "CERTIFICATE_GENERATED",

  // Admin events
  EXAM_CREATED = "EXAM_CREATED",
  EXAM_MODIFIED = "EXAM_MODIFIED",
  EXAM_DELETED = "EXAM_DELETED",
  QUESTION_MODIFIED = "QUESTION_MODIFIED",
}

export interface AuditLogEntry {
  event: ExamAuditEvent
  schoolId: string
  userId: string
  examId?: string
  studentId?: string
  questionId?: string
  answerId?: string
  previousValue?: unknown
  newValue?: unknown
  metadata?: Record<string, unknown>
  ipAddress?: string
  userAgent?: string
}

/**
 * Create an audit log entry
 */
export async function createAuditLog(entry: AuditLogEntry): Promise<void> {
  try {
    await db.auditLog.create({
      data: {
        action: entry.event,
        schoolId: entry.schoolId,
        userId: entry.userId,
        entityType: "EXAM",
        entityId: entry.examId || entry.answerId || entry.questionId || "",
        previousValue: entry.previousValue
          ? JSON.stringify(entry.previousValue)
          : null,
        newValue: entry.newValue ? JSON.stringify(entry.newValue) : null,
        ip: entry.ipAddress,
        userAgent: entry.userAgent,
        metadata: {
          ...entry.metadata,
          studentId: entry.studentId,
          questionId: entry.questionId,
          answerId: entry.answerId,
        },
      },
    })
  } catch (error) {
    // Log error but don't fail the main operation - audit should never block business logic
    if (process.env.NODE_ENV === "development") {
      console.error("Failed to create audit log:", error)
    }
  }
}

/**
 * Log a grade change with full context
 */
export async function logGradeChange(params: {
  schoolId: string
  userId: string
  examId: string
  studentId: string
  questionId: string
  answerId: string
  previousGrade: {
    points: number
    grade?: string
    gradedBy?: string
    method?: string
  }
  newGrade: {
    points: number
    grade?: string
    gradedBy: string
    method: string
  }
  reason?: string
  ipAddress?: string
  userAgent?: string
}): Promise<void> {
  await createAuditLog({
    event:
      params.previousGrade.points !== params.newGrade.points
        ? ExamAuditEvent.GRADE_OVERRIDDEN
        : ExamAuditEvent.GRADE_ASSIGNED,
    schoolId: params.schoolId,
    userId: params.userId,
    examId: params.examId,
    studentId: params.studentId,
    questionId: params.questionId,
    answerId: params.answerId,
    previousValue: params.previousGrade,
    newValue: params.newGrade,
    metadata: {
      reason: params.reason,
      pointsDifference: params.newGrade.points - params.previousGrade.points,
    },
    ipAddress: params.ipAddress,
    userAgent: params.userAgent,
  })
}

/**
 * Log an exam submission
 */
export async function logExamSubmission(params: {
  schoolId: string
  userId: string
  examId: string
  studentId: string
  attemptId: string
  answeredQuestions: number
  totalQuestions: number
  timeSpent: number
  ipAddress?: string
  userAgent?: string
}): Promise<void> {
  await createAuditLog({
    event: ExamAuditEvent.EXAM_SUBMITTED,
    schoolId: params.schoolId,
    userId: params.userId,
    examId: params.examId,
    studentId: params.studentId,
    metadata: {
      attemptId: params.attemptId,
      answeredQuestions: params.answeredQuestions,
      totalQuestions: params.totalQuestions,
      timeSpent: params.timeSpent,
      completionRate: (params.answeredQuestions / params.totalQuestions) * 100,
    },
    ipAddress: params.ipAddress,
    userAgent: params.userAgent,
  })
}

/**
 * Log AI grade decision
 */
export async function logAIGradeDecision(params: {
  schoolId: string
  userId: string
  examId: string
  studentId: string
  answerId: string
  aiScore: number
  aiConfidence: number
  accepted: boolean
  finalScore?: number
  ipAddress?: string
}): Promise<void> {
  await createAuditLog({
    event: params.accepted
      ? ExamAuditEvent.AI_GRADE_ACCEPTED
      : ExamAuditEvent.AI_GRADE_REJECTED,
    schoolId: params.schoolId,
    userId: params.userId,
    examId: params.examId,
    studentId: params.studentId,
    answerId: params.answerId,
    newValue: {
      aiScore: params.aiScore,
      aiConfidence: params.aiConfidence,
      accepted: params.accepted,
      finalScore: params.finalScore,
    },
    ipAddress: params.ipAddress,
  })
}

/**
 * Get audit history for an entity
 */
export async function getAuditHistory(params: {
  schoolId: string
  entityId: string
  entityType?: string
  limit?: number
}): Promise<unknown[]> {
  try {
    const logs = await db.auditLog.findMany({
      where: {
        schoolId: params.schoolId,
        entityId: params.entityId,
        ...(params.entityType && { entityType: params.entityType }),
      },
      orderBy: { createdAt: "desc" },
      take: params.limit || 50,
      include: {
        performer: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
      },
    })

    return logs
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("Failed to get audit history:", error)
    }
    return []
  }
}
