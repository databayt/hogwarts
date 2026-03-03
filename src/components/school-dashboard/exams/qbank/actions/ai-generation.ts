"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * AI Question Generation Server Actions
 * Generate questions using OpenAI and bulk-save to QuestionBank
 */
import { revalidatePath } from "next/cache"
import { auth } from "@/auth"
import type { QuestionType } from "@prisma/client"

import { generateQuestionsWithAI, isAIServiceAvailable } from "@/lib/ai/openai"
import { db } from "@/lib/db"

import type { AIGeneratedQuestion } from "../types"
import { aiGenerationSchema } from "../validation"
import type { ActionResponse } from "./types"

/**
 * Generate questions using AI
 */
export async function generateQuestionsAI(
  input: unknown
): Promise<ActionResponse<AIGeneratedQuestion[]>> {
  try {
    const session = await auth()
    if (!session?.user?.id || !session.user.schoolId) {
      return { success: false, error: "Unauthorized", code: "UNAUTHORIZED" }
    }

    if (!isAIServiceAvailable()) {
      return {
        success: false,
        error: "AI service not configured. Please contact administrator.",
        code: "AI_UNAVAILABLE",
      }
    }

    const parsed = aiGenerationSchema.parse(input)

    // Resolve subject name
    const subject = await db.subject.findFirst({
      where: { id: parsed.subjectId, schoolId: session.user.schoolId },
      select: { subjectName: true },
    })

    if (!subject) {
      return { success: false, error: "Subject not found", code: "NOT_FOUND" }
    }

    const result = await generateQuestionsWithAI({
      subject: subject.subjectName,
      topic: parsed.topic,
      difficulty: parsed.difficulty,
      bloomLevel: parsed.bloomLevel,
      questionType: parsed.questionType as
        | "MULTIPLE_CHOICE"
        | "SHORT_ANSWER"
        | "ESSAY",
      count: parsed.numberOfQuestions,
    })

    if (!result.success || !result.questions.length) {
      return {
        success: false,
        error: result.error || "No questions generated",
        code: "GENERATION_FAILED",
      }
    }

    // Map raw AI output to typed AIGeneratedQuestion
    const questions: AIGeneratedQuestion[] = result.questions.map(
      (q: Record<string, unknown>) => ({
        questionText: (q.questionText as string) || "",
        questionType: parsed.questionType,
        difficulty: parsed.difficulty,
        bloomLevel: parsed.bloomLevel,
        points: (q.points as number) || 1,
        options: q.options as AIGeneratedQuestion["options"],
        acceptedAnswers: q.acceptedAnswers as string[] | undefined,
        caseSensitive: (q.caseSensitive as boolean) ?? false,
        sampleAnswer: q.sampleAnswer as string | undefined,
        gradingRubric:
          typeof q.gradingRubric === "string"
            ? q.gradingRubric
            : typeof q.rubric === "object"
              ? JSON.stringify(q.rubric)
              : undefined,
        explanation: q.explanation as string | undefined,
      })
    )

    return { success: true, data: questions }
  } catch (error) {
    console.error("AI generation error:", error)
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to generate questions",
      code: "GENERATION_FAILED",
    }
  }
}

/**
 * Bulk-save AI-generated questions to the question bank
 */
export async function saveAIGeneratedQuestions(input: {
  subjectId: string
  questions: AIGeneratedQuestion[]
  tags?: string[]
}): Promise<ActionResponse<{ savedCount: number }>> {
  try {
    const session = await auth()
    if (!session?.user?.id || !session.user.schoolId) {
      return { success: false, error: "Unauthorized", code: "UNAUTHORIZED" }
    }

    const schoolId = session.user.schoolId
    const userId = session.user.id

    // Resolve catalog subject
    const subject = await db.subject.findFirst({
      where: { id: input.subjectId, schoolId },
      select: { catalogSubjectId: true },
    })

    let savedCount = 0

    for (const q of input.questions) {
      await db.$transaction(async (tx) => {
        // Create in catalog
        const catalogQuestion = await tx.catalogQuestion.create({
          data: {
            catalogSubjectId: subject?.catalogSubjectId ?? null,
            questionText: q.questionText,
            questionType: q.questionType,
            difficulty: q.difficulty,
            bloomLevel: q.bloomLevel,
            points: q.points,
            options: q.options as Parameters<
              typeof tx.catalogQuestion.create
            >[0]["data"]["options"],
            sampleAnswer: q.sampleAnswer ?? null,
            explanation: q.explanation ?? null,
            tags: input.tags ?? [],
            contributedBy: userId,
            contributedSchoolId: schoolId,
            approvalStatus: "APPROVED",
            visibility: "PRIVATE",
            status: "PUBLISHED",
          },
        })

        // Build options JSON (includes acceptedAnswers for fill-blank)
        const optionsData =
          q.questionType === "FILL_BLANK"
            ? {
                acceptedAnswers: q.acceptedAnswers ?? [],
                caseSensitive: q.caseSensitive ?? false,
              }
            : (q.options ?? undefined)

        // Create school mirror
        const newQuestion = await tx.questionBank.create({
          data: {
            schoolId,
            subjectId: input.subjectId,
            questionText: q.questionText,
            questionType: q.questionType as QuestionType,
            difficulty: q.difficulty,
            bloomLevel: q.bloomLevel,
            points: q.points,
            options: optionsData as Parameters<
              typeof tx.questionBank.create
            >[0]["data"]["options"],
            sampleAnswer: q.sampleAnswer ?? null,
            gradingRubric: q.gradingRubric ?? null,
            explanation: q.explanation ?? null,
            tags: input.tags ?? [],
            source: "AI",
            aiModel: "gpt-4o",
            generatedAt: new Date(),
            createdBy: userId,
            catalogQuestionId: catalogQuestion.id,
            catalogSubjectId: subject?.catalogSubjectId ?? null,
          },
        })

        // Create analytics record
        await tx.questionAnalytics.create({
          data: { questionId: newQuestion.id, schoolId },
        })
      })
      savedCount++
    }

    revalidatePath("/exams/qbank")
    revalidatePath("/exams/generate")

    return { success: true, data: { savedCount } }
  } catch (error) {
    console.error("Save AI questions error:", error)
    return {
      success: false,
      error: "Failed to save questions",
      code: "SAVE_FAILED",
    }
  }
}
