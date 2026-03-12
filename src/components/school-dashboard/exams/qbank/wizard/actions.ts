"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { revalidatePath } from "next/cache"
import { auth } from "@/auth"

import type { ActionResponse } from "@/lib/action-response"
import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"

import type { QuestionWizardData } from "./use-question-wizard"

/** Fetch full question data for the wizard */
export async function getQuestionForWizard(
  questionId: string
): Promise<
  | { success: true; data: QuestionWizardData }
  | { success: false; error: string }
> {
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) return { success: false, error: "Missing school context" }

    const question = await db.questionBank.findFirst({
      where: { id: questionId, schoolId },
      include: {
        subject: { select: { id: true, subjectName: true } },
      },
    })

    if (!question) return { success: false, error: "Question not found" }

    return {
      success: true,
      data: {
        ...question,
        points: Number(question.points),
      } as QuestionWizardData,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to load question",
    }
  }
}

/** Create a draft question record to start the wizard */
export async function createDraftQuestion(): Promise<
  ActionResponse<{ id: string }>
> {
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return { success: false, error: "Missing school context" }
    }

    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "Not authenticated" }
    }

    const firstSubject = await db.subject.findFirst({
      where: { schoolId },
      select: { id: true },
    })

    if (!firstSubject) {
      return {
        success: false,
        error: "No subjects found. Create a subject first.",
      }
    }

    const question = await db.questionBank.create({
      data: {
        schoolId,
        subjectId: firstSubject.id,
        questionText: "",
        questionType: "MULTIPLE_CHOICE",
        difficulty: "MEDIUM",
        bloomLevel: "REMEMBER",
        points: 1,
        source: "MANUAL",
        createdBy: session.user.id,
        wizardStep: "question",
      },
    })

    return { success: true, data: { id: question.id } }
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to create question",
    }
  }
}

/** Mark the question wizard as complete */
export async function completeQuestionWizard(
  questionId: string
): Promise<ActionResponse> {
  try {
    const session = await auth()
    if (!session?.user) {
      return { success: false, error: "Not authenticated" }
    }

    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return { success: false, error: "Missing school context" }
    }

    const question = await db.questionBank.findFirst({
      where: { id: questionId, schoolId },
      select: { questionText: true },
    })

    if (!question) {
      return { success: false, error: "Question not found" }
    }

    if (!question.questionText || question.questionText.trim().length < 10) {
      return {
        success: false,
        error: "Question text must be at least 10 characters",
      }
    }

    await db.questionBank.updateMany({
      where: { id: questionId, schoolId },
      data: { wizardStep: null },
    })

    revalidatePath("/exams/qbank")
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to complete question wizard",
    }
  }
}

/** Update the current wizard step for resumability */
export async function updateQuestionWizardStep(
  questionId: string,
  step: string
): Promise<void> {
  try {
    const session = await auth()
    if (!session?.user) return

    const { schoolId } = await getTenantContext()
    if (!schoolId) return

    await db.questionBank.updateMany({
      where: { id: questionId, schoolId },
      data: { wizardStep: step },
    })
  } catch {
    // Non-critical, don't throw
  }
}

/** Delete an abandoned draft question */
export async function deleteDraftQuestion(
  questionId: string
): Promise<ActionResponse> {
  try {
    const session = await auth()
    if (!session?.user) {
      return { success: false, error: "Not authenticated" }
    }

    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return { success: false, error: "Missing school context" }
    }

    // Atomic delete — only if it's still a draft
    const { count } = await db.questionBank.deleteMany({
      where: { id: questionId, schoolId, wizardStep: { not: null } },
    })

    if (count === 0) {
      return { success: false, error: "Draft question not found" }
    }

    return { success: true }
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to delete draft question",
    }
  }
}
