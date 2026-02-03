"use server"

/**
 * Server actions for psychometric item analysis
 *
 * Functions:
 * - Trigger analysis for individual questions
 * - Batch analysis after exam completion
 * - Get analytics dashboard data
 * - Export analysis reports
 */
import { revalidatePath } from "next/cache"
import { auth } from "@/auth"
import { Prisma } from "@prisma/client"

import { db } from "@/lib/db"

import {
  analyzeDistractors,
  assessItemQuality,
  calcDifficultyIndex,
  calcDiscriminationIndex,
  calcPointBiserial,
  type ResponseData,
} from "./psychometrics"

/**
 * Analyze a single question's psychometric properties
 */
export async function analyzeQuestion(questionId: string) {
  const session = await auth()
  const schoolId = session?.user?.schoolId

  if (!schoolId) {
    return { success: false, error: "Unauthorized" }
  }

  try {
    // Get question with options
    const question = await db.questionBank.findFirst({
      where: { id: questionId, schoolId },
      select: {
        id: true,
        questionType: true,
        options: true,
      },
    })

    if (!question) {
      return { success: false, error: "Question not found" }
    }

    // Get all responses for this question
    const responses = await db.questionResponse.findMany({
      where: { questionId, schoolId },
    })

    if (responses.length < 10) {
      return {
        success: false,
        error: "Insufficient data (need at least 10 responses)",
      }
    }

    // Convert to ResponseData format
    const responseData: ResponseData[] = responses.map((r) => ({
      studentId: r.studentId,
      isCorrect: r.isCorrect,
      pointsAwarded: Number(r.pointsAwarded),
      maxPoints: Number(r.maxPoints),
      selectedOptions: r.selectedOptions,
      studentTotal: r.studentTotal ? Number(r.studentTotal) : null,
      studentRank: r.studentRank,
    }))

    // Calculate metrics
    const correctCount = responseData.filter((r) => r.isCorrect).length
    const difficultyIndex = calcDifficultyIndex(
      correctCount,
      responseData.length
    )

    // Calculate discrimination index
    const sortedByRank = [...responseData]
      .filter((r) => r.studentRank !== null)
      .sort((a, b) => (a.studentRank || 0) - (b.studentRank || 0))
    const groupSize = Math.ceil(sortedByRank.length * 0.27)
    const highGroup = sortedByRank.slice(0, groupSize)
    const lowGroup = sortedByRank.slice(-groupSize)

    const highGroupCorrect = highGroup.filter((r) => r.isCorrect).length
    const lowGroupCorrect = lowGroup.filter((r) => r.isCorrect).length
    const discriminationIndex = calcDiscriminationIndex(
      highGroupCorrect,
      highGroup.length,
      lowGroupCorrect,
      lowGroup.length
    )

    // Calculate point-biserial
    const pointBiserial = calcPointBiserial(responseData)

    // Distractor analysis for MCQ
    let distractorAnalysis = null
    if (
      question.questionType === "MULTIPLE_CHOICE" ||
      question.questionType === "TRUE_FALSE"
    ) {
      const options = question.options as Array<{
        text: string
        isCorrect?: boolean
      }> | null
      if (options && Array.isArray(options)) {
        const correctIndices = options
          .map((o, i) => (o.isCorrect ? i : -1))
          .filter((i) => i >= 0)
        distractorAnalysis = analyzeDistractors(
          responseData,
          options.length,
          correctIndices
        )
      }
    }

    // Assess quality
    const quality = assessItemQuality(
      difficultyIndex,
      discriminationIndex,
      pointBiserial,
      responseData.length,
      distractorAnalysis || undefined
    )

    // Update or create analytics record
    await db.questionAnalytics.upsert({
      where: { questionId },
      create: {
        schoolId,
        questionId,
        timesUsed: responseData.length,
        avgScore: new Prisma.Decimal(
          responseData.reduce((s, r) => s + r.pointsAwarded, 0) /
            responseData.length
        ),
        successRate: difficultyIndex * 100,
        difficultyIndex: new Prisma.Decimal(difficultyIndex.toFixed(4)),
        discriminationIndex: new Prisma.Decimal(discriminationIndex.toFixed(4)),
        pointBiserial: new Prisma.Decimal(pointBiserial.toFixed(4)),
        distractorAnalysis: distractorAnalysis
          ? (distractorAnalysis as unknown as Prisma.InputJsonValue)
          : Prisma.JsonNull,
        qualityScore: quality.score,
        qualityFlags: quality.flags,
        recommendedAction: quality.recommendedAction,
        sampleSize: responseData.length,
        lastAnalyzedAt: new Date(),
      },
      update: {
        timesUsed: responseData.length,
        avgScore: new Prisma.Decimal(
          responseData.reduce((s, r) => s + r.pointsAwarded, 0) /
            responseData.length
        ),
        successRate: difficultyIndex * 100,
        difficultyIndex: new Prisma.Decimal(difficultyIndex.toFixed(4)),
        discriminationIndex: new Prisma.Decimal(discriminationIndex.toFixed(4)),
        pointBiserial: new Prisma.Decimal(pointBiserial.toFixed(4)),
        distractorAnalysis: distractorAnalysis
          ? (distractorAnalysis as unknown as Prisma.InputJsonValue)
          : Prisma.JsonNull,
        qualityScore: quality.score,
        qualityFlags: quality.flags,
        recommendedAction: quality.recommendedAction,
        sampleSize: responseData.length,
        lastAnalyzedAt: new Date(),
      },
    })

    revalidatePath("/exams/qbank")
    revalidatePath(`/exams/qbank/${questionId}`)

    return {
      success: true,
      analytics: {
        difficultyIndex,
        discriminationIndex,
        pointBiserial,
        distractorAnalysis,
        ...quality,
        sampleSize: responseData.length,
      },
    }
  } catch (error) {
    console.error("Analyze question error:", error)
    return { success: false, error: "Failed to analyze question" }
  }
}

/**
 * Analyze all questions from a completed exam
 */
export async function analyzeExamQuestions(examId: string) {
  const session = await auth()
  const schoolId = session?.user?.schoolId

  if (!schoolId) {
    return { success: false, error: "Unauthorized" }
  }

  try {
    // Get exam with questions
    const exam = await db.exam.findFirst({
      where: { id: examId, schoolId },
      include: {
        generatedExam: {
          include: {
            questions: {
              select: { questionId: true },
            },
          },
        },
      },
    })

    if (!exam) {
      return { success: false, error: "Exam not found" }
    }

    if (!exam.generatedExam?.questions) {
      return { success: false, error: "No questions found in exam" }
    }

    // Get all student answers for this exam
    const studentAnswers = await db.studentAnswer.findMany({
      where: { examId, schoolId },
      include: {
        markingResult: true,
      },
    })

    if (studentAnswers.length === 0) {
      return { success: false, error: "No student responses found" }
    }

    // Get exam results for student total scores
    const examResults = await db.examResult.findMany({
      where: { examId, schoolId },
      orderBy: { percentage: "desc" },
    })

    // Create student rank map
    const studentRanks = new Map<string, number>()
    examResults.forEach((r, idx) => {
      studentRanks.set(r.studentId, idx + 1)
    })

    // Store responses for each question
    const questionIds = exam.generatedExam.questions.map((q) => q.questionId)

    for (const questionId of questionIds) {
      const questionAnswers = studentAnswers.filter(
        (a) => a.questionId === questionId
      )

      if (questionAnswers.length < 10) continue

      // Create question responses
      for (const answer of questionAnswers) {
        const marking = answer.markingResult
        if (!marking) continue

        const examResult = examResults.find(
          (r) => r.studentId === answer.studentId
        )

        await db.questionResponse.upsert({
          where: {
            examId_questionId_studentId: {
              examId,
              questionId,
              studentId: answer.studentId,
            },
          },
          create: {
            schoolId,
            questionId,
            studentId: answer.studentId,
            examId,
            isCorrect:
              Number(marking.pointsAwarded) === Number(marking.maxPoints),
            pointsAwarded: marking.pointsAwarded,
            maxPoints: marking.maxPoints,
            selectedOptions: answer.selectedOptionIds || [],
            studentTotal: examResult
              ? new Prisma.Decimal(examResult.percentage)
              : null,
            studentRank: studentRanks.get(answer.studentId) || null,
          },
          update: {
            isCorrect:
              Number(marking.pointsAwarded) === Number(marking.maxPoints),
            pointsAwarded: marking.pointsAwarded,
            maxPoints: marking.maxPoints,
            selectedOptions: answer.selectedOptionIds || [],
            studentTotal: examResult
              ? new Prisma.Decimal(examResult.percentage)
              : null,
            studentRank: studentRanks.get(answer.studentId) || null,
          },
        })
      }

      // Analyze the question
      await analyzeQuestion(questionId)
    }

    revalidatePath("/exams/qbank")
    revalidatePath(`/exams/${examId}`)

    return {
      success: true,
      analyzedCount: questionIds.length,
    }
  } catch (error) {
    console.error("Analyze exam questions error:", error)
    return { success: false, error: "Failed to analyze exam questions" }
  }
}

/**
 * Get analytics dashboard data
 */
export async function getAnalyticsDashboard() {
  const session = await auth()
  const schoolId = session?.user?.schoolId

  if (!schoolId) {
    return { success: false, error: "Unauthorized" }
  }

  try {
    // Get all analytics with quality scores
    const analytics = await db.questionAnalytics.findMany({
      where: { schoolId, sampleSize: { gte: 10 } },
      orderBy: { lastAnalyzedAt: "desc" },
      include: {
        question: {
          select: {
            id: true,
            questionText: true,
            questionType: true,
            difficulty: true,
            subjectId: true,
            subject: {
              select: { subjectName: true },
            },
          },
        },
      },
    })

    // Calculate summary statistics
    const summary = {
      totalQuestions: analytics.length,
      needsRetire: analytics.filter((a) => a.recommendedAction === "retire")
        .length,
      needsRevise: analytics.filter((a) => a.recommendedAction === "revise")
        .length,
      goodQuestions: analytics.filter((a) => a.recommendedAction === "keep")
        .length,
      avgQualityScore:
        analytics.length > 0
          ? analytics.reduce((s, a) => s + (a.qualityScore || 0), 0) /
            analytics.length
          : 0,
      avgDifficulty:
        analytics.length > 0
          ? analytics.reduce((s, a) => s + Number(a.difficultyIndex || 0), 0) /
            analytics.length
          : 0,
      avgDiscrimination:
        analytics.length > 0
          ? analytics.reduce(
              (s, a) => s + Number(a.discriminationIndex || 0),
              0
            ) / analytics.length
          : 0,
    }

    // Difficulty distribution
    const difficultyDistribution = {
      veryEasy: analytics.filter((a) => Number(a.difficultyIndex || 0) >= 0.9)
        .length,
      easy: analytics.filter(
        (a) =>
          Number(a.difficultyIndex || 0) >= 0.7 &&
          Number(a.difficultyIndex || 0) < 0.9
      ).length,
      moderate: analytics.filter(
        (a) =>
          Number(a.difficultyIndex || 0) >= 0.5 &&
          Number(a.difficultyIndex || 0) < 0.7
      ).length,
      difficult: analytics.filter(
        (a) =>
          Number(a.difficultyIndex || 0) >= 0.3 &&
          Number(a.difficultyIndex || 0) < 0.5
      ).length,
      veryDifficult: analytics.filter(
        (a) => Number(a.difficultyIndex || 0) < 0.3
      ).length,
    }

    // Quality distribution
    const qualityDistribution = {
      excellent: analytics.filter((a) => (a.qualityScore || 0) >= 80).length,
      good: analytics.filter(
        (a) => (a.qualityScore || 0) >= 60 && (a.qualityScore || 0) < 80
      ).length,
      fair: analytics.filter(
        (a) => (a.qualityScore || 0) >= 40 && (a.qualityScore || 0) < 60
      ).length,
      poor: analytics.filter((a) => (a.qualityScore || 0) < 40).length,
    }

    // Flagged questions
    const flaggedQuestions = analytics
      .filter(
        (a) =>
          a.qualityFlags.length > 0 ||
          a.recommendedAction === "retire" ||
          a.recommendedAction === "revise"
      )
      .slice(0, 20)
      .map((a) => ({
        id: a.questionId,
        questionText: a.question.questionText.slice(0, 100),
        questionType: a.question.questionType,
        subject: a.question.subject?.subjectName ?? "Unknown",
        qualityScore: a.qualityScore,
        qualityFlags: a.qualityFlags,
        recommendedAction: a.recommendedAction,
        difficultyIndex: Number(a.difficultyIndex),
        discriminationIndex: Number(a.discriminationIndex),
      }))

    return {
      success: true,
      data: {
        summary,
        difficultyDistribution,
        qualityDistribution,
        flaggedQuestions,
        analytics: analytics.map((a) => ({
          questionId: a.questionId,
          questionText: a.question.questionText.slice(0, 100),
          questionType: a.question.questionType,
          subject: a.question.subject?.subjectName ?? "Unknown",
          difficultyIndex: Number(a.difficultyIndex),
          discriminationIndex: Number(a.discriminationIndex),
          qualityScore: a.qualityScore,
          sampleSize: a.sampleSize,
          recommendedAction: a.recommendedAction,
        })),
      },
    }
  } catch (error) {
    console.error("Get analytics dashboard error:", error)
    return { success: false, error: "Failed to load analytics" }
  }
}

/**
 * Get detailed analytics for a single question
 */
export async function getQuestionAnalytics(questionId: string) {
  const session = await auth()
  const schoolId = session?.user?.schoolId

  if (!schoolId) {
    return { success: false, error: "Unauthorized" }
  }

  try {
    const analytics = await db.questionAnalytics.findFirst({
      where: { questionId, schoolId },
      include: {
        question: {
          select: {
            id: true,
            questionText: true,
            questionType: true,
            options: true,
            difficulty: true,
            bloomLevel: true,
            subject: {
              select: { subjectName: true },
            },
          },
        },
      },
    })

    if (!analytics) {
      return {
        success: false,
        error: "No analytics available for this question",
      }
    }

    return {
      success: true,
      analytics: {
        ...analytics,
        difficultyIndex: Number(analytics.difficultyIndex),
        discriminationIndex: Number(analytics.discriminationIndex),
        pointBiserial: Number(analytics.pointBiserial),
        avgScore: Number(analytics.avgScore),
      },
    }
  } catch (error) {
    console.error("Get question analytics error:", error)
    return { success: false, error: "Failed to load analytics" }
  }
}
