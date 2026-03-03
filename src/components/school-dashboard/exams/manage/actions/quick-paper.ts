"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Quick Paper Generation Action
 *
 * Creates a GeneratedExam record from an existing Exam by pulling
 * all questions from the QuestionBank that match the exam's subject.
 * Used by the QuickPaperButton to enable one-click paper generation.
 */
import { revalidatePath } from "next/cache"
import { auth } from "@/auth"

import { db } from "@/lib/db"

import type { ActionResponse } from "./types"

/**
 * Creates a GeneratedExam for an existing exam by selecting all
 * questions from the QuestionBank that match the exam's subject.
 *
 * If a GeneratedExam already exists for this exam, returns its ID
 * instead of creating a duplicate (enforced by @@unique([examId])).
 */
export async function createGeneratedExamForPaper(
  examId: string
): Promise<ActionResponse<{ generatedExamId: string }>> {
  try {
    const session = await auth()
    const schoolId = session?.user?.schoolId
    const userId = session?.user?.id

    if (!schoolId || !userId) {
      return {
        success: false,
        error: "Unauthorized",
        code: "UNAUTHORIZED",
      }
    }

    // Check if a GeneratedExam already exists for this exam
    const existing = await db.generatedExam.findFirst({
      where: { examId, schoolId },
      select: { id: true },
    })

    if (existing) {
      return { success: true, data: { generatedExamId: existing.id } }
    }

    // Fetch the exam and verify school ownership
    const exam = await db.exam.findFirst({
      where: { id: examId, schoolId },
      select: { id: true, subjectId: true },
    })

    if (!exam) {
      return {
        success: false,
        error: "Exam not found",
        code: "NOT_FOUND",
      }
    }

    // Fetch all questions for this subject from the QuestionBank
    const questions = await db.questionBank.findMany({
      where: {
        schoolId,
        subjectId: exam.subjectId,
      },
      orderBy: [
        { difficulty: "asc" },
        { questionType: "asc" },
        { createdAt: "asc" },
      ],
      select: {
        id: true,
        points: true,
      },
    })

    if (questions.length === 0) {
      return {
        success: false,
        error:
          "No questions found in the question bank for this exam's subject. Add questions first.",
        code: "NO_QUESTIONS",
      }
    }

    // Create the GeneratedExam and its questions in a transaction
    const generatedExam = await db.$transaction(async (tx) => {
      const ge = await tx.generatedExam.create({
        data: {
          schoolId,
          examId,
          isRandomized: false,
          totalQuestions: questions.length,
          generationNotes:
            "Auto-generated from question bank via quick paper action",
          generatedBy: userId,
        },
      })

      await tx.generatedExamQuestion.createMany({
        data: questions.map((q, index) => ({
          schoolId,
          generatedExamId: ge.id,
          questionId: q.id,
          order: index + 1,
          points: q.points,
        })),
      })

      return ge
    })

    revalidatePath("/exams")
    revalidatePath(`/exams/${examId}`)
    revalidatePath(`/exams/paper/${generatedExam.id}`)

    return { success: true, data: { generatedExamId: generatedExam.id } }
  } catch (error) {
    console.error("Error creating generated exam for paper:", error)
    return {
      success: false,
      error: "Failed to generate exam paper",
      code: "GENERATION_FAILED",
    }
  }
}
