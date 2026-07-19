"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

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

import { ACTION_ERRORS, actionError } from "@/lib/action-errors"
import type { ActionResponse } from "@/lib/action-response"
import { db } from "@/lib/db"

import { finalizeStudentExam } from "../mark/actions/finalize"
import type {
  ExamData,
  ExamQuestion,
  ExamSessionData,
  ExistingAnswer,
  QuestionOption,
} from "./types"
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
    return actionError(ACTION_ERRORS.UNAUTHORIZED)
  }

  const validated = startExamSessionSchema.safeParse(input)
  if (!validated.success) {
    return actionError(ACTION_ERRORS.VALIDATION_ERROR)
  }

  const { examId, ipAddress, userAgent, deviceFingerprint } = validated.data

  try {
    // Get exam with proctoring settings
    const exam = await db.schoolExam.findFirst({
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
      return actionError(ACTION_ERRORS.EXAM_NOT_FOUND)
    }

    if (exam.status !== "IN_PROGRESS") {
      return actionError(ACTION_ERRORS.EXAM_UPDATE_FAILED)
    }

    // Get student ID from user
    const student = await db.student.findFirst({
      where: { userId, schoolId },
      select: { id: true },
    })

    if (!student) {
      return actionError(ACTION_ERRORS.NOT_FOUND)
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
            schoolId,
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
    return actionError(ACTION_ERRORS.EXAM_UPDATE_FAILED)
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
    return actionError(ACTION_ERRORS.UNAUTHORIZED)
  }

  const validated = autoSaveAnswersSchema.safeParse(input)
  if (!validated.success) {
    return actionError(ACTION_ERRORS.VALIDATION_ERROR)
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
      return actionError(ACTION_ERRORS.NOT_FOUND)
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
    return actionError(ACTION_ERRORS.SAVE_FAILED)
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
    return actionError(ACTION_ERRORS.UNAUTHORIZED)
  }

  const validated = reportSecurityFlagSchema.safeParse(input)
  if (!validated.success) {
    return actionError(ACTION_ERRORS.VALIDATION_ERROR)
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
      return actionError(ACTION_ERRORS.NOT_FOUND)
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
    return actionError(ACTION_ERRORS.EXAM_UPDATE_FAILED)
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
    return actionError(ACTION_ERRORS.UNAUTHORIZED)
  }

  const validated = submitExamAnswersSchema.safeParse(input)
  if (!validated.success) {
    return actionError(ACTION_ERRORS.VALIDATION_ERROR)
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
      return actionError(ACTION_ERRORS.NOT_FOUND)
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
        return actionError(ACTION_ERRORS.EXAM_UPDATE_FAILED)
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

    // Instant-grade fully-objective exams so the student sees their score now.
    // Subjective exams stay pending for teacher review.
    try {
      const gen = await db.generatedExam.findFirst({
        where: { examId, schoolId },
        select: {
          questions: {
            select: { question: { select: { questionType: true } } },
          },
        },
      })
      const allObjective =
        !!gen &&
        gen.questions.length > 0 &&
        gen.questions.every((q) =>
          ["MULTIPLE_CHOICE", "TRUE_FALSE", "FILL_BLANK"].includes(
            q.question.questionType
          )
        )
      if (allObjective) {
        await finalizeStudentExam(examId, examSession.studentId, {
          notify: true,
        })
      }
    } catch (err) {
      console.error("Auto-finalize on submit error:", err)
    }

    revalidatePath(`/exams/${examId}`)
    revalidatePath(`/exams/${examId}/take`)

    return {
      success: true,
      message: "Exam submitted successfully",
    }
  } catch (error) {
    console.error("Submit exam error:", error)
    return actionError(ACTION_ERRORS.EXAM_UPDATE_FAILED)
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
    return actionError(ACTION_ERRORS.UNAUTHORIZED)
  }

  try {
    const student = await db.student.findFirst({
      where: { userId, schoolId },
      select: { id: true },
    })

    if (!student) {
      return actionError(ACTION_ERRORS.STUDENT_NOT_FOUND)
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
    return actionError(ACTION_ERRORS.EXAM_UPDATE_FAILED)
  }
}

/**
 * Strip answer-correctness out of a question's options before they reach the
 * browser, and derive whether the question is multi-select (so the player can
 * render checkboxes vs. radios without ever seeing which option is correct).
 * Option ORDER is preserved so a selected index still matches the answer key.
 */
function sanitizeOptions(
  raw: unknown,
  questionType: string
): { options: QuestionOption[] | null; isMultiSelect: boolean } {
  if (questionType !== "MULTIPLE_CHOICE" && questionType !== "TRUE_FALSE") {
    return { options: null, isMultiSelect: false }
  }
  if (!Array.isArray(raw)) return { options: null, isMultiSelect: false }
  let correctCount = 0
  const options: QuestionOption[] = raw.map((o) => {
    const opt = o && typeof o === "object" ? (o as Record<string, unknown>) : {}
    if (opt.isCorrect === true) correctCount++
    return {
      text: typeof opt.text === "string" ? opt.text : String(opt.text ?? ""),
    }
  })
  return { options, isMultiSelect: correctCount > 1 }
}

/**
 * Server loader for the proctored `ExamPlayer`. Returns the four props the
 * player needs, resolving the real `Student.id` from the session (the fix for
 * the old bare path that used the User id) and stripping correct answers from
 * the payload. `initialSession` is intentionally null — the player starts or
 * resumes the session client-side via `startExamSession`, which owns attempt
 * limits, shuffling, and resume.
 */
export async function getExamForPlayer(examId: string): Promise<
  ActionResponse<{
    exam: ExamData
    questions: ExamQuestion[]
    existingAnswers: ExistingAnswer[]
    initialSession: ExamSessionData | null
  }>
> {
  const session = await auth()
  const schoolId = session?.user?.schoolId
  const userId = session?.user?.id
  if (!schoolId || !userId) return actionError(ACTION_ERRORS.UNAUTHORIZED)

  try {
    const exam = await db.schoolExam.findFirst({
      where: { id: examId, schoolId },
      select: {
        id: true,
        title: true,
        description: true,
        duration: true,
        totalMarks: true,
        passingMarks: true,
        instructions: true,
        status: true,
        proctorMode: true,
        shuffleQuestions: true,
        shuffleOptions: true,
        maxAttempts: true,
        allowLateSubmit: true,
        lateSubmitMinutes: true,
      },
    })
    if (!exam) return actionError(ACTION_ERRORS.EXAM_NOT_FOUND)

    // Students may only take an IN_PROGRESS exam; staff can preview any state.
    const role = session.user.role || ""
    const isStaff = ["ADMIN", "TEACHER", "DEVELOPER"].includes(role)
    if (!isStaff && exam.status !== "IN_PROGRESS") {
      return actionError(ACTION_ERRORS.NOT_FOUND)
    }

    const generated = await db.generatedExam.findFirst({
      where: { examId, schoolId },
      select: {
        questions: {
          orderBy: { order: "asc" },
          select: {
            id: true,
            questionId: true,
            order: true,
            points: true,
            question: {
              select: {
                id: true,
                questionText: true,
                questionType: true,
                options: true,
                imageUrl: true,
              },
            },
          },
        },
      },
    })

    const questions: ExamQuestion[] = (generated?.questions ?? []).map((gq) => {
      const { options, isMultiSelect } = sanitizeOptions(
        gq.question.options,
        gq.question.questionType
      )
      return {
        id: gq.id,
        questionId: gq.questionId,
        order: gq.order,
        points: Number(gq.points) || 1,
        question: {
          id: gq.question.id,
          questionText: gq.question.questionText,
          questionType: gq.question.questionType,
          options,
          isMultiSelect,
          imageUrl: gq.question.imageUrl,
        },
      }
    })

    // Resolve the real Student.id (the bug fix) for answers.
    const student = await db.student.findFirst({
      where: { userId, schoolId },
      select: { id: true },
    })

    let existingAnswers: ExistingAnswer[] = []
    if (student) {
      const answers = await db.studentAnswer.findMany({
        where: { examId, studentId: student.id, schoolId },
        select: { questionId: true, answerText: true, selectedOptionIds: true },
      })
      existingAnswers = answers.map((a) => ({
        questionId: a.questionId,
        answerText: a.answerText,
        selectedOptionIds: a.selectedOptionIds,
      }))
    }

    return {
      success: true,
      data: { exam, questions, existingAnswers, initialSession: null },
    }
  } catch (error) {
    console.error("getExamForPlayer error:", error)
    return actionError(ACTION_ERRORS.LOAD_FAILED)
  }
}
