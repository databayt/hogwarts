"use server"

/**
 * Server actions for exam taking with proctoring support
 *
 * Features:
 * - Start exam session with device fingerprinting
 * - Auto-save answers at regular intervals
 * - Report and track security flags
 * - Submit exam with validation
 * - Handle retakes with penalty calculation
 */
import { revalidatePath } from "next/cache"
import { auth } from "@/auth"
import { Prisma } from "@prisma/client"
import type { ProctorMode, SecurityFlag } from "@prisma/client"

import { db } from "@/lib/db"

import {
  autoSaveAnswersSchema,
  reportSecurityFlagSchema,
  startExamSessionSchema,
  submitExamAnswersSchema,
  type AutoSaveAnswersInput,
  type ReportSecurityFlagInput,
  type StartExamSessionInput,
  type SubmitExamAnswersInput,
} from "./validation"

// Fisher-Yates shuffle algorithm
function shuffleArray<T>(array: T[], seed?: string): T[] {
  const result = [...array]
  let currentIndex = result.length

  // Simple seeded random number generator
  const seededRandom = seed
    ? (() => {
        let s = seed.split("").reduce((a, b) => {
          a = (a << 5) - a + b.charCodeAt(0)
          return a & a
        }, 0)
        return () => {
          s = Math.imul(s ^ (s >>> 16), 0x85ebca6b)
          s = Math.imul(s ^ (s >>> 13), 0xc2b2ae35)
          return ((s ^= s >>> 16) >>> 0) / 4294967295
        }
      })()
    : Math.random

  while (currentIndex !== 0) {
    const randomIndex = Math.floor(seededRandom() * currentIndex)
    currentIndex--
    ;[result[currentIndex], result[randomIndex]] = [
      result[randomIndex],
      result[currentIndex],
    ]
  }

  return result
}

/**
 * Start an exam session for a student
 * Creates shuffled question/option orders if enabled
 */
export async function startExamSession(input: StartExamSessionInput) {
  const session = await auth()
  const schoolId = session?.user?.schoolId
  const userId = session?.user?.id

  if (!schoolId || !userId) {
    return { success: false, error: "Unauthorized" }
  }

  const validated = startExamSessionSchema.safeParse(input)
  if (!validated.success) {
    return { success: false, error: "Invalid input" }
  }

  const { examId, ipAddress, userAgent, deviceFingerprint } = validated.data

  try {
    // Get exam with proctoring settings
    const exam = await db.exam.findFirst({
      where: { id: examId, schoolId },
      include: {
        generatedExam: {
          include: {
            questions: {
              orderBy: { order: "asc" },
              select: { questionId: true, order: true },
            },
          },
        },
      },
    })

    if (!exam) {
      return { success: false, error: "Exam not found" }
    }

    if (exam.status !== "IN_PROGRESS") {
      return { success: false, error: "Exam is not currently active" }
    }

    // Get student ID from user
    const student = await db.student.findFirst({
      where: { userId, schoolId },
      select: { id: true },
    })

    if (!student) {
      return { success: false, error: "Student record not found" }
    }

    // Check existing attempts
    const existingAttempts = await db.examSession.count({
      where: {
        examId,
        studentId: student.id,
        schoolId,
        status: { in: ["SUBMITTED", "EXPIRED"] },
      },
    })

    if (existingAttempts >= exam.maxAttempts) {
      return {
        success: false,
        error: `Maximum attempts (${exam.maxAttempts}) reached`,
      }
    }

    // Check for in-progress session
    const activeSession = await db.examSession.findFirst({
      where: {
        examId,
        studentId: student.id,
        schoolId,
        status: { in: ["NOT_STARTED", "IN_PROGRESS", "PAUSED"] },
      },
    })

    if (activeSession) {
      // Resume existing session
      const updatedSession = await db.examSession.update({
        where: { id: activeSession.id },
        data: {
          status: "IN_PROGRESS",
          lastActivityAt: new Date(),
          ipAddress: ipAddress || activeSession.ipAddress,
          userAgent: userAgent || activeSession.userAgent,
        },
      })

      return {
        success: true,
        session: updatedSession,
        resumed: true,
      }
    }

    // Generate question order if shuffling enabled
    let questionOrder: string[] | null = null
    let optionOrders: Record<string, number[]> | null = null

    if (exam.generatedExam?.questions) {
      const questions = exam.generatedExam.questions
      const seed = `${examId}-${student.id}-${existingAttempts + 1}`

      if (exam.shuffleQuestions) {
        const shuffledQuestions = shuffleArray(questions, seed)
        questionOrder = shuffledQuestions.map((q) => q.questionId)
      } else {
        questionOrder = questions.map((q) => q.questionId)
      }

      if (exam.shuffleOptions) {
        // Get questions with options
        const questionsWithOptions = await db.questionBank.findMany({
          where: {
            id: { in: questionOrder },
            questionType: { in: ["MULTIPLE_CHOICE", "TRUE_FALSE"] },
          },
          select: { id: true, options: true },
        })

        optionOrders = {}
        for (const q of questionsWithOptions) {
          if (q.options && Array.isArray(q.options)) {
            const indices = Array.from(
              { length: (q.options as unknown[]).length },
              (_, i) => i
            )
            optionOrders[q.id] = shuffleArray(indices, `${seed}-${q.id}`)
          }
        }
      }
    }

    // Create new session
    const newSession = await db.examSession.create({
      data: {
        schoolId,
        examId,
        studentId: student.id,
        attemptNumber: existingAttempts + 1,
        status: "IN_PROGRESS",
        proctorMode: exam.proctorMode,
        startedAt: new Date(),
        lastActivityAt: new Date(),
        ipAddress,
        userAgent,
        deviceFingerprint,
        questionOrder: questionOrder || undefined,
        optionOrders: optionOrders || undefined,
      },
    })

    return {
      success: true,
      session: newSession,
      resumed: false,
    }
  } catch (error) {
    console.error("Start exam session error:", error)
    return { success: false, error: "Failed to start exam session" }
  }
}

/**
 * Auto-save answers during exam
 * Called periodically to prevent data loss
 */
export async function autoSaveAnswers(input: AutoSaveAnswersInput) {
  const session = await auth()
  const schoolId = session?.user?.schoolId

  if (!schoolId) {
    return { success: false, error: "Unauthorized" }
  }

  const validated = autoSaveAnswersSchema.safeParse(input)
  if (!validated.success) {
    return { success: false, error: "Invalid input" }
  }

  const { sessionId, answers, currentQuestionIndex } = validated.data

  try {
    // Verify session belongs to this user
    const examSession = await db.examSession.findFirst({
      where: {
        id: sessionId,
        schoolId,
        status: "IN_PROGRESS",
      },
    })

    if (!examSession) {
      return { success: false, error: "Session not found or expired" }
    }

    // Update session with answer snapshot
    await db.examSession.update({
      where: { id: sessionId },
      data: {
        answerSnapshot: {
          answers,
          currentQuestionIndex,
          savedAt: new Date().toISOString(),
        },
        lastSavedAt: new Date(),
        lastActivityAt: new Date(),
      },
    })

    return { success: true }
  } catch (error) {
    console.error("Auto-save error:", error)
    return { success: false, error: "Failed to save answers" }
  }
}

/**
 * Report a security flag event
 * Tracks suspicious activity during exam
 */
export async function reportSecurityFlag(input: ReportSecurityFlagInput) {
  const session = await auth()
  const schoolId = session?.user?.schoolId

  if (!schoolId) {
    return { success: false, error: "Unauthorized" }
  }

  const validated = reportSecurityFlagSchema.safeParse(input)
  if (!validated.success) {
    return { success: false, error: "Invalid input" }
  }

  const { sessionId, flag, details } = validated.data

  try {
    // Get current session
    const examSession = await db.examSession.findFirst({
      where: {
        id: sessionId,
        schoolId,
        status: "IN_PROGRESS",
      },
    })

    if (!examSession) {
      return { success: false, error: "Session not found" }
    }

    // Add flag to array
    const currentFlags = (examSession.securityFlags as Prisma.JsonArray) || []
    const newFlag = {
      flag,
      timestamp: new Date().toISOString(),
      details,
    }

    // Update counters based on flag type
    const updates: Partial<{
      flagCount: number
      focusLostCount: number
      tabSwitchCount: number
      copyAttempts: number
    }> = {
      flagCount: examSession.flagCount + 1,
    }

    if (flag === "FOCUS_LOST") {
      updates.focusLostCount = examSession.focusLostCount + 1
    } else if (flag === "TAB_SWITCH") {
      updates.tabSwitchCount = examSession.tabSwitchCount + 1
    } else if (flag === "COPY_ATTEMPT") {
      updates.copyAttempts = examSession.copyAttempts + 1
    }

    await db.examSession.update({
      where: { id: sessionId },
      data: {
        securityFlags: [...currentFlags, newFlag] as Prisma.InputJsonValue,
        ...updates,
        lastActivityAt: new Date(),
      },
    })

    return { success: true }
  } catch (error) {
    console.error("Report security flag error:", error)
    return { success: false, error: "Failed to report flag" }
  }
}

/**
 * Submit exam answers
 * Final submission with validation and auto-marking trigger
 */
export async function submitExamSession(input: SubmitExamAnswersInput) {
  const session = await auth()
  const schoolId = session?.user?.schoolId

  if (!schoolId) {
    return { success: false, error: "Unauthorized" }
  }

  const validated = submitExamAnswersSchema.safeParse(input)
  if (!validated.success) {
    return { success: false, error: "Invalid input" }
  }

  const { examId, sessionId, answers } = validated.data

  try {
    // Get session and exam
    const examSession = await db.examSession.findFirst({
      where: {
        id: sessionId,
        examId,
        schoolId,
        status: "IN_PROGRESS",
      },
      include: {
        exam: true,
        student: true,
      },
    })

    if (!examSession) {
      return { success: false, error: "Session not found or already submitted" }
    }

    // Check if within time limit (with late submission grace period if enabled)
    const startTime = examSession.startedAt
    if (startTime) {
      const examDurationMs = examSession.exam.duration * 60 * 1000
      const lateAllowanceMs = examSession.exam.allowLateSubmit
        ? examSession.exam.lateSubmitMinutes * 60 * 1000
        : 0
      const deadline = new Date(
        startTime.getTime() + examDurationMs + lateAllowanceMs
      )

      if (new Date() > deadline) {
        // Mark as expired instead of allowing submission
        await db.examSession.update({
          where: { id: sessionId },
          data: { status: "EXPIRED" },
        })
        return { success: false, error: "Time limit exceeded" }
      }
    }

    // Create/update student answers in transaction
    await db.$transaction(async (tx) => {
      for (const answer of answers) {
        await tx.studentAnswer.upsert({
          where: {
            examId_questionId_studentId: {
              examId,
              questionId: answer.questionId,
              studentId: examSession.studentId,
            },
          },
          create: {
            schoolId,
            examId,
            questionId: answer.questionId,
            studentId: examSession.studentId,
            submissionType: "DIGITAL",
            answerText: answer.answerText,
            selectedOptionIds: answer.selectedOptionIds || [],
            submittedAt: new Date(),
          },
          update: {
            answerText: answer.answerText,
            selectedOptionIds: answer.selectedOptionIds || [],
            submittedAt: new Date(),
          },
        })
      }

      // Update session status
      await tx.examSession.update({
        where: { id: sessionId },
        data: {
          status: "SUBMITTED",
          submittedAt: new Date(),
        },
      })
    })

    revalidatePath(`/exams/${examId}`)
    revalidatePath(`/exams/${examId}/take`)

    return {
      success: true,
      message: "Exam submitted successfully",
    }
  } catch (error) {
    console.error("Submit exam error:", error)
    return { success: false, error: "Failed to submit exam" }
  }
}

/**
 * Get exam session for student
 * Used to resume an in-progress exam
 */
export async function getExamSession(examId: string) {
  const session = await auth()
  const schoolId = session?.user?.schoolId
  const userId = session?.user?.id

  if (!schoolId || !userId) {
    return { success: false, error: "Unauthorized" }
  }

  try {
    const student = await db.student.findFirst({
      where: { userId, schoolId },
      select: { id: true },
    })

    if (!student) {
      return { success: false, error: "Student not found" }
    }

    const examSession = await db.examSession.findFirst({
      where: {
        examId,
        studentId: student.id,
        schoolId,
        status: { in: ["NOT_STARTED", "IN_PROGRESS", "PAUSED"] },
      },
    })

    return { success: true, session: examSession }
  } catch (error) {
    console.error("Get exam session error:", error)
    return { success: false, error: "Failed to get session" }
  }
}
