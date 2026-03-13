"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { revalidatePath } from "next/cache"
import { auth } from "@/auth"

import type { ActionResponse } from "@/lib/action-response"
import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"

import type { ExamGenerateWizardData } from "./use-exam-generate-wizard"

/** Fetch full generated exam data for the wizard */
export async function getGeneratedExamForWizard(
  generatedExamId: string
): Promise<
  | { success: true; data: ExamGenerateWizardData }
  | { success: false; error: string }
> {
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) return { success: false, error: "Missing school context" }

    const genExam = await db.generatedExam.findFirst({
      where: { id: generatedExamId, schoolId },
      include: {
        exam: {
          select: {
            id: true,
            title: true,
            classId: true,
            subjectId: true,
            examDate: true,
            startTime: true,
            duration: true,
            totalMarks: true,
            passingMarks: true,
          },
        },
        template: {
          select: {
            id: true,
            name: true,
            subjectId: true,
          },
        },
        questions: {
          select: { questionId: true },
          orderBy: { order: "asc" },
        },
        paperConfig: {
          select: {
            template: true,
            pageSize: true,
            shuffleQuestions: true,
            shuffleOptions: true,
            versionCount: true,
            showSchoolLogo: true,
            showInstructions: true,
            showPointsPerQuestion: true,
          },
        },
      },
    })

    if (!genExam) return { success: false, error: "Generated exam not found" }

    return {
      success: true,
      data: {
        id: genExam.id,
        schoolId: genExam.schoolId,
        wizardStep: genExam.wizardStep,
        templateId: genExam.templateId,
        examId: genExam.examId,
        isRandomized: genExam.isRandomized,
        totalQuestions: genExam.totalQuestions,
        generationNotes: genExam.generationNotes,
        selectedQuestionIds: genExam.questions.map((q) => q.questionId),
        // Paper config (defaults if not yet created)
        paperTemplate: genExam.paperConfig?.template || "CLASSIC",
        pageSize: genExam.paperConfig?.pageSize || "A4",
        shuffleQuestions: genExam.paperConfig?.shuffleQuestions ?? true,
        shuffleOptions: genExam.paperConfig?.shuffleOptions ?? true,
        versionCount: genExam.paperConfig?.versionCount ?? 1,
        showSchoolLogo: genExam.paperConfig?.showSchoolLogo ?? true,
        showInstructions: genExam.paperConfig?.showInstructions ?? true,
        showPointsPerQuestion:
          genExam.paperConfig?.showPointsPerQuestion ?? true,
        // Exam details
        examTitle: genExam.exam.title,
        examClassId: genExam.exam.classId,
        examSubjectId: genExam.exam.subjectId,
        examDate: genExam.exam.examDate,
        examStartTime: genExam.exam.startTime,
        examDuration: genExam.exam.duration,
        examTotalMarks: genExam.exam.totalMarks,
        examPassingMarks: genExam.exam.passingMarks,
        // Template info
        templateName: genExam.template?.name || null,
        templateSubjectId: genExam.template?.subjectId || null,
      },
    }
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to load generated exam",
    }
  }
}

/** Create a draft GeneratedExam to start the wizard */
export async function createDraftGeneratedExam(): Promise<
  ActionResponse<{ id: string }>
> {
  try {
    const session = await auth()
    if (!session?.user) {
      return { success: false, error: "Not authenticated" }
    }

    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return { success: false, error: "Missing school context" }
    }

    // Find the first available class (which has a subjectId)
    const firstClass = await db.class.findFirst({
      where: { schoolId },
      select: { id: true, subjectId: true },
    })

    if (!firstClass) {
      return {
        success: false,
        error: "No classes found. Create a class first.",
      }
    }

    // Create a placeholder Exam record with wizardStep
    const exam = await db.exam.create({
      data: {
        schoolId,
        title: "",
        classId: firstClass.id,
        subjectId: firstClass.subjectId,
        examDate: new Date(),
        startTime: "09:00",
        endTime: "10:00",
        duration: 60,
        totalMarks: 100,
        passingMarks: 40,
        examType: "TEST",
        wizardStep: "generate-wizard",
      },
    })

    // Create GeneratedExam pointing to the placeholder exam
    const generatedExam = await db.generatedExam.create({
      data: {
        schoolId,
        examId: exam.id,
        generatedBy: session.user.id || "system",
        wizardStep: "template",
      },
    })

    return { success: true, data: { id: generatedExam.id } }
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to create generated exam",
    }
  }
}

/** Mark the exam generate wizard as complete */
export async function completeExamGenerateWizard(
  generatedExamId: string
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

    const genExam = await db.generatedExam.findFirst({
      where: { id: generatedExamId, schoolId },
      select: { examId: true },
    })

    if (!genExam) {
      return { success: false, error: "Generated exam not found" }
    }

    // Complete both the GeneratedExam and the linked Exam
    await db.$transaction([
      db.generatedExam.updateMany({
        where: { id: generatedExamId, schoolId },
        data: { wizardStep: null },
      }),
      db.exam.updateMany({
        where: { id: genExam.examId, schoolId },
        data: { wizardStep: null },
      }),
    ])

    revalidatePath("/exams")
    revalidatePath("/exams/generate")
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to complete exam generate wizard",
    }
  }
}

/** Update the current wizard step for resumability */
export async function updateExamGenerateWizardStep(
  generatedExamId: string,
  step: string
): Promise<void> {
  try {
    const session = await auth()
    if (!session?.user) return

    const { schoolId } = await getTenantContext()
    if (!schoolId) return

    await db.generatedExam.updateMany({
      where: { id: generatedExamId, schoolId },
      data: { wizardStep: step },
    })
  } catch {
    // Non-critical, don't throw
  }
}

/** Delete an abandoned draft generated exam */
export async function deleteDraftGeneratedExam(
  generatedExamId: string
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

    // Find the generated exam to get the linked exam id
    const genExam = await db.generatedExam.findFirst({
      where: { id: generatedExamId, schoolId, wizardStep: { not: null } },
      select: { examId: true },
    })

    if (!genExam) {
      return { success: false, error: "Draft generated exam not found" }
    }

    // Delete generated exam first (FK), then the placeholder exam
    await db.$transaction([
      db.generatedExamQuestion.deleteMany({
        where: { generatedExamId, schoolId },
      }),
      db.generatedExam.deleteMany({
        where: { id: generatedExamId, schoolId, wizardStep: { not: null } },
      }),
      db.exam.deleteMany({
        where: { id: genExam.examId, schoolId },
      }),
    ])

    return { success: true }
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to delete draft generated exam",
    }
  }
}
