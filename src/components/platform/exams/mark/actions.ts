"use server"

// Auto-Marking System Server Actions

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { auth } from "@/auth"
import { db } from "@/lib/db"
import {
  createQuestionSchema,
  createRubricSchema,
  submitAnswerSchema,
  gradeOverrideSchema,
  bulkGradeSchema,
} from "./validation"
import {
  gradeEssayWithAI,
  gradeShortAnswerWithAI,
  processOCRWithAI,
} from "@/lib/ai/openai"
import {
  gradeMCQ,
  gradeTrueFalse,
  gradeFillBlank,
  parseQuestionOptions,
  parseAcceptedAnswers,
  isAutoGradable,
} from "./utils"
import type { QuestionType, GradingMethod, MarkingStatus } from "@prisma/client"

// ========== Question Bank Actions ==========

export async function createQuestion(data: FormData) {
  const session = await auth()
  const schoolId = session?.user?.schoolId

  if (!schoolId) {
    return { success: false, error: "Unauthorized" }
  }

  try {
    const formData = Object.fromEntries(data)

    // Parse JSON fields
    if (formData.options && typeof formData.options === "string") {
      formData.options = JSON.parse(formData.options)
    }
    if (formData.tags && typeof formData.tags === "string") {
      formData.tags = JSON.parse(formData.tags)
    }
    if (formData.acceptedAnswers && typeof formData.acceptedAnswers === "string") {
      formData.acceptedAnswers = JSON.parse(formData.acceptedAnswers)
    }

    const validated = createQuestionSchema.parse(formData)

    await db.questionBank.create({
      data: {
        schoolId,
        subjectId: validated.subjectId,
        questionText: validated.questionText,
        questionType: validated.questionType,
        difficulty: validated.difficulty,
        bloomLevel: validated.bloomLevel,
        points: validated.points,
        timeEstimate: validated.timeEstimate,
        options: validated.options,
        acceptedAnswers: validated.acceptedAnswers,
        sampleAnswer: validated.sampleAnswer,
        tags: validated.tags || [],
        explanation: validated.explanation,
        imageUrl: validated.imageUrl,
        source: "MANUAL",
        createdBy: session.user.id!,
      },
    })

    revalidatePath("/mark/questions")
    return { success: true }
  } catch (error) {
    console.error("Create question error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create question",
    }
  }
}

export async function updateQuestion(id: string, data: FormData) {
  const session = await auth()
  const schoolId = session?.user?.schoolId

  if (!schoolId) {
    return { success: false, error: "Unauthorized" }
  }

  try {
    const formData = Object.fromEntries(data)

    // Parse JSON fields
    if (formData.options && typeof formData.options === "string") {
      formData.options = JSON.parse(formData.options)
    }
    if (formData.tags && typeof formData.tags === "string") {
      formData.tags = JSON.parse(formData.tags)
    }

    await db.questionBank.updateMany({
      where: { id, schoolId },
      data: formData,
    })

    revalidatePath("/mark/questions")
    return { success: true }
  } catch (error) {
    console.error("Update question error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update question",
    }
  }
}

export async function deleteQuestion(id: string) {
  const session = await auth()
  const schoolId = session?.user?.schoolId

  if (!schoolId) {
    return { success: false, error: "Unauthorized" }
  }

  try {
    await db.questionBank.deleteMany({
      where: { id, schoolId },
    })

    revalidatePath("/mark/questions")
    return { success: true }
  } catch (error) {
    console.error("Delete question error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete question",
    }
  }
}

// ========== Rubric Actions ==========

export async function createRubric(data: FormData) {
  const session = await auth()
  const schoolId = session?.user?.schoolId

  if (!schoolId) {
    return { success: false, error: "Unauthorized" }
  }

  try {
    const formData = Object.fromEntries(data)

    if (formData.criteria && typeof formData.criteria === "string") {
      formData.criteria = JSON.parse(formData.criteria)
    }

    const validated = createRubricSchema.parse(formData)

    // Calculate total points from criteria
    const totalPoints = validated.criteria.reduce(
      (sum, c) => sum + c.maxPoints,
      0
    )

    await db.rubric.create({
      data: {
        schoolId,
        questionId: validated.questionId,
        title: validated.title,
        description: validated.description,
        totalPoints,
        criteria: {
          create: validated.criteria.map((criterion) => ({
            schoolId,
            criterion: criterion.criterion,
            description: criterion.description,
            maxPoints: criterion.maxPoints,
            order: criterion.order,
          })),
        },
      },
    })

    revalidatePath("/mark/questions")
    return { success: true }
  } catch (error) {
    console.error("Create rubric error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create rubric",
    }
  }
}

// ========== Student Answer Submission ==========

export async function submitAnswer(data: FormData) {
  const session = await auth()
  const schoolId = session?.user?.schoolId
  const studentId = session?.user?.id

  if (!schoolId || !studentId) {
    return { success: false, error: "Unauthorized" }
  }

  try {
    const formData = Object.fromEntries(data)

    if (formData.selectedOptionIds && typeof formData.selectedOptionIds === "string") {
      formData.selectedOptionIds = JSON.parse(formData.selectedOptionIds)
    }

    const validated = submitAnswerSchema.parse(formData)

    // Check if answer already exists
    const existing = await db.studentAnswer.findUnique({
      where: {
        examId_questionId_studentId: {
          examId: validated.examId,
          questionId: validated.questionId,
          studentId,
        },
      },
    })

    if (existing) {
      // Update existing answer
      await db.studentAnswer.update({
        where: { id: existing.id },
        data: {
          submissionType: validated.submissionType,
          answerText: validated.answerText,
          selectedOptionIds: validated.selectedOptionIds || [],
          uploadUrl: validated.uploadUrl,
          submittedAt: new Date(),
        },
      })
    } else {
      // Create new answer
      await db.studentAnswer.create({
        data: {
          schoolId,
          examId: validated.examId,
          questionId: validated.questionId,
          studentId,
          submissionType: validated.submissionType,
          answerText: validated.answerText,
          selectedOptionIds: validated.selectedOptionIds || [],
          uploadUrl: validated.uploadUrl,
          submittedAt: new Date(),
        },
      })
    }

    revalidatePath(`/exams/${validated.examId}`)
    return { success: true }
  } catch (error) {
    console.error("Submit answer error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to submit answer",
    }
  }
}

// ========== OCR Processing ==========

export async function processAnswerOCR(studentAnswerId: string) {
  const session = await auth()
  const schoolId = session?.user?.schoolId

  if (!schoolId) {
    return { success: false, error: "Unauthorized" }
  }

  try {
    const studentAnswer = await db.studentAnswer.findFirst({
      where: { id: studentAnswerId, schoolId },
      include: { question: true },
    })

    if (!studentAnswer || !studentAnswer.uploadUrl) {
      return { success: false, error: "Answer or upload not found" }
    }

    // Process OCR
    const ocrResult = await processOCRWithAI({
      imageUrl: studentAnswer.uploadUrl,
      questionText: studentAnswer.question.questionText,
    })

    if (!ocrResult.success) {
      return { success: false, error: ocrResult.error }
    }

    // Update student answer with OCR text
    await db.studentAnswer.update({
      where: { id: studentAnswerId },
      data: {
        ocrText: ocrResult.extractedText,
        ocrConfidence: ocrResult.confidence,
        submissionType: "OCR",
      },
    })

    revalidatePath(`/mark`)
    return {
      success: true,
      extractedText: ocrResult.extractedText,
      confidence: ocrResult.confidence,
    }
  } catch (error) {
    console.error("OCR processing error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "OCR processing failed",
    }
  }
}

// ========== Auto-Grading Actions ==========

export async function autoGradeAnswer(studentAnswerId: string) {
  const session = await auth()
  const schoolId = session?.user?.schoolId

  if (!schoolId) {
    return { success: false, error: "Unauthorized" }
  }

  try {
    const studentAnswer = await db.studentAnswer.findFirst({
      where: { id: studentAnswerId, schoolId },
      include: { question: true },
    })

    if (!studentAnswer) {
      return { success: false, error: "Answer not found" }
    }

    const question = studentAnswer.question
    let result: { pointsAwarded: number; maxPoints: number; isCorrect: boolean }

    // Auto-grade based on question type
    switch (question.questionType) {
      case "MULTIPLE_CHOICE": {
        const options = parseQuestionOptions(question.options)
        const correctIds = options
          .map((opt, idx) => (opt.isCorrect ? idx.toString() : null))
          .filter((id): id is string => id !== null)

        result = gradeMCQ(studentAnswer.selectedOptionIds, correctIds, true)
        break
      }

      case "TRUE_FALSE": {
        const options = parseQuestionOptions(question.options)
        const correctAnswer = options.find((opt) => opt.isCorrect)?.text === "True"
        const studentSelection = studentAnswer.selectedOptionIds[0] === "0"

        result = gradeTrueFalse(studentSelection, correctAnswer)
        break
      }

      case "FILL_IN_BLANK": {
        const acceptedAnswers = parseAcceptedAnswers(question.acceptedAnswers)
        result = gradeFillBlank(studentAnswer.answerText || "", acceptedAnswers)
        break
      }

      default:
        return { success: false, error: "Question type not auto-gradable" }
    }

    // Create or update marking result
    const existingResult = await db.markingResult.findUnique({
      where: { studentAnswerId },
    })

    const markingData = {
      schoolId,
      examId: studentAnswer.examId,
      questionId: studentAnswer.questionId,
      studentId: studentAnswer.studentId,
      gradingMethod: "AUTO" as GradingMethod,
      status: "AUTO_GRADED" as MarkingStatus,
      pointsAwarded: result.pointsAwarded * Number(question.points),
      maxPoints: Number(question.points),
      gradedAt: new Date(),
    }

    if (existingResult) {
      await db.markingResult.update({
        where: { id: existingResult.id },
        data: markingData,
      })
    } else {
      await db.markingResult.create({
        data: {
          ...markingData,
          studentAnswerId,
        },
      })
    }

    revalidatePath("/mark")
    return { success: true, ...result }
  } catch (error) {
    console.error("Auto-grade error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Auto-grading failed",
    }
  }
}

// ========== AI-Assisted Grading ==========

export async function aiGradeAnswer(studentAnswerId: string) {
  const session = await auth()
  const schoolId = session?.user?.schoolId

  if (!schoolId) {
    return { success: false, error: "Unauthorized" }
  }

  try {
    const studentAnswer = await db.studentAnswer.findFirst({
      where: { id: studentAnswerId, schoolId },
      include: {
        question: {
          include: {
            rubrics: {
              include: { criteria: true },
            },
          },
        },
      },
    })

    if (!studentAnswer) {
      return { success: false, error: "Answer not found" }
    }

    const question = studentAnswer.question
    const answerText = studentAnswer.ocrText || studentAnswer.answerText || ""

    let aiResult

    // Use appropriate AI grading method
    if (question.questionType === "ESSAY" && question.rubrics.length > 0) {
      const rubric = question.rubrics[0]
      aiResult = await gradeEssayWithAI({
        questionText: question.questionText,
        studentAnswer: answerText,
        rubric,
        maxPoints: Number(question.points),
        sampleAnswer: question.sampleAnswer || undefined,
      })
    } else if (question.questionType === "SHORT_ANSWER") {
      const acceptedAnswers = parseAcceptedAnswers(question.acceptedAnswers)
      aiResult = await gradeShortAnswerWithAI({
        questionText: question.questionText,
        studentAnswer: answerText,
        acceptedAnswers,
        sampleAnswer: question.sampleAnswer || undefined,
        maxPoints: Number(question.points),
      })
    } else {
      return { success: false, error: "Question type not AI-gradable" }
    }

    if (!aiResult.success) {
      return { success: false, error: aiResult.error }
    }

    // Create or update marking result
    const existingResult = await db.markingResult.findUnique({
      where: { studentAnswerId },
    })

    const markingData = {
      schoolId,
      examId: studentAnswer.examId,
      questionId: studentAnswer.questionId,
      studentId: studentAnswer.studentId,
      gradingMethod: "AI_ASSISTED" as GradingMethod,
      status: "AI_GRADED" as MarkingStatus,
      pointsAwarded: aiResult.aiScore,
      maxPoints: Number(question.points),
      aiScore: aiResult.aiScore,
      aiConfidence: aiResult.aiConfidence,
      aiReasoning: aiResult.aiReasoning,
      feedback: aiResult.suggestedFeedback,
      needsReview: aiResult.needsReview,
      gradedAt: new Date(),
    }

    if (existingResult) {
      await db.markingResult.update({
        where: { id: existingResult.id },
        data: markingData,
      })
    } else {
      await db.markingResult.create({
        data: {
          ...markingData,
          studentAnswerId,
        },
      })
    }

    revalidatePath("/mark")
    return { success: true, ...aiResult }
  } catch (error) {
    console.error("AI grade error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "AI grading failed",
    }
  }
}

// ========== Manual Grading & Overrides ==========

export async function manualGrade(
  studentAnswerId: string,
  pointsAwarded: number,
  feedback?: string
) {
  const session = await auth()
  const schoolId = session?.user?.schoolId

  if (!schoolId) {
    return { success: false, error: "Unauthorized" }
  }

  try {
    const studentAnswer = await db.studentAnswer.findFirst({
      where: { id: studentAnswerId, schoolId },
      include: { question: true },
    })

    if (!studentAnswer) {
      return { success: false, error: "Answer not found" }
    }

    const existingResult = await db.markingResult.findUnique({
      where: { studentAnswerId },
    })

    const markingData = {
      schoolId,
      examId: studentAnswer.examId,
      questionId: studentAnswer.questionId,
      studentId: studentAnswer.studentId,
      gradingMethod: "MANUAL" as GradingMethod,
      status: "COMPLETED" as MarkingStatus,
      pointsAwarded,
      maxPoints: Number(studentAnswer.question.points),
      feedback,
      gradedBy: session.user.id!,
      gradedAt: new Date(),
    }

    if (existingResult) {
      await db.markingResult.update({
        where: { id: existingResult.id },
        data: markingData,
      })
    } else {
      await db.markingResult.create({
        data: {
          ...markingData,
          studentAnswerId,
        },
      })
    }

    revalidatePath("/mark")
    return { success: true }
  } catch (error) {
    console.error("Manual grade error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Manual grading failed",
    }
  }
}

export async function overrideGrade(data: FormData) {
  const session = await auth()
  const schoolId = session?.user?.schoolId

  if (!schoolId) {
    return { success: false, error: "Unauthorized" }
  }

  try {
    const validated = gradeOverrideSchema.parse(Object.fromEntries(data))

    const markingResult = await db.markingResult.findFirst({
      where: { id: validated.markingResultId, schoolId },
    })

    if (!markingResult) {
      return { success: false, error: "Marking result not found" }
    }

    // Create override record
    await db.gradeOverride.create({
      data: {
        schoolId,
        markingResultId: validated.markingResultId,
        previousScore: markingResult.pointsAwarded,
        newScore: validated.newScore,
        reason: validated.reason,
        overriddenBy: session.user.id!,
      },
    })

    // Update marking result
    await db.markingResult.update({
      where: { id: validated.markingResultId },
      data: {
        pointsAwarded: validated.newScore,
        wasOverridden: true,
        status: "COMPLETED",
        gradedBy: session.user.id!,
        gradedAt: new Date(),
      },
    })

    revalidatePath("/mark")
    return { success: true }
  } catch (error) {
    console.error("Override grade error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Grade override failed",
    }
  }
}

// ========== Bulk Grading ==========

export async function bulkGradeExam(data: FormData) {
  const session = await auth()
  const schoolId = session?.user?.schoolId

  if (!schoolId) {
    return { success: false, error: "Unauthorized" }
  }

  try {
    const validated = bulkGradeSchema.parse(Object.fromEntries(data))

    const answers = await db.studentAnswer.findMany({
      where: {
        schoolId,
        examId: validated.examId,
        ...(validated.studentIds ? { studentId: { in: validated.studentIds } } : {}),
        ...(validated.questionIds ? { questionId: { in: validated.questionIds } } : {}),
      },
      include: { question: true },
    })

    let graded = 0
    let failed = 0

    for (const answer of answers) {
      // Skip if already graded
      const existing = await db.markingResult.findUnique({
        where: { studentAnswerId: answer.id },
      })

      if (existing && existing.status === "COMPLETED") {
        continue
      }

      // Only auto-grade if question is auto-gradable
      if (validated.autoGradeOnly && !isAutoGradable(answer.question.questionType)) {
        continue
      }

      // Auto-grade
      const result = await autoGradeAnswer(answer.id)
      if (result.success) {
        graded++
      } else {
        failed++
      }
    }

    revalidatePath("/mark")
    return { success: true, graded, failed, total: answers.length }
  } catch (error) {
    console.error("Bulk grade error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Bulk grading failed",
    }
  }
}
