"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { revalidatePath } from "next/cache"
import { auth } from "@/auth"

import type { ActionResponse } from "@/lib/action-response"
import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"

import type { ExamWizardData } from "./use-exam-wizard"

/** Fetch full exam data for the wizard */
export async function getExamForWizard(
  examId: string
): Promise<
  { success: true; data: ExamWizardData } | { success: false; error: string }
> {
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) return { success: false, error: "Missing school context" }

    const exam = await db.exam.findFirst({
      where: { id: examId, schoolId },
      include: {
        class: { select: { id: true, name: true } },
        subject: { select: { id: true, subjectName: true } },
      },
    })

    if (!exam) return { success: false, error: "Exam not found" }

    return {
      success: true,
      data: {
        ...exam,
        retakePenalty: exam.retakePenalty ? Number(exam.retakePenalty) : null,
        class: exam.class
          ? { id: exam.class.id, className: exam.class.name }
          : { id: "", className: "" },
        subject: exam.subject
          ? { id: exam.subject.id, subjectName: exam.subject.subjectName }
          : { id: "", subjectName: "" },
      } as unknown as ExamWizardData,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to load exam",
    }
  }
}

/** Create a draft exam record to start the wizard */
export async function createDraftExam(): Promise<
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
        wizardStep: "information",
      },
    })

    return { success: true, data: { id: exam.id } }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create exam",
    }
  }
}

/** Mark the exam wizard as complete */
export async function completeExamWizard(
  examId: string
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

    const exam = await db.exam.findFirst({
      where: { id: examId, schoolId },
      select: { title: true, classId: true, subjectId: true },
    })

    if (!exam) {
      return { success: false, error: "Exam not found" }
    }

    if (!exam.title?.trim()) {
      return {
        success: false,
        error: "Title is required before completing",
      }
    }

    await db.exam.updateMany({
      where: { id: examId, schoolId },
      data: { wizardStep: null },
    })

    revalidatePath("/exams")
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to complete exam wizard",
    }
  }
}

/** Update the current wizard step for resumability */
export async function updateExamWizardStep(
  examId: string,
  step: string
): Promise<void> {
  try {
    const session = await auth()
    if (!session?.user) return

    const { schoolId } = await getTenantContext()
    if (!schoolId) return

    await db.exam.updateMany({
      where: { id: examId, schoolId },
      data: { wizardStep: step },
    })
  } catch {
    // Non-critical, don't throw
  }
}

/** Delete an abandoned draft exam */
export async function deleteDraftExam(examId: string): Promise<ActionResponse> {
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
    const { count } = await db.exam.deleteMany({
      where: { id: examId, schoolId, wizardStep: { not: null } },
    })

    if (count === 0) {
      return { success: false, error: "Draft exam not found" }
    }

    return { success: true }
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to delete draft exam",
    }
  }
}

/** Fetch classes for the current school (for SelectField options) */
export async function getClassOptions(): Promise<
  ActionResponse<{ id: string; name: string }[]>
> {
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) return { success: false, error: "Missing school context" }

    const classes = await db.class.findMany({
      where: { schoolId },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    })

    return { success: true, data: classes }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to load classes",
    }
  }
}

/** Fetch subjects for the current school (for SelectField options) */
export async function getSubjectOptions(): Promise<
  ActionResponse<{ id: string; subjectName: string }[]>
> {
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) return { success: false, error: "Missing school context" }

    const subjects = await db.subject.findMany({
      where: { schoolId },
      select: { id: true, subjectName: true },
      orderBy: { subjectName: "asc" },
    })

    return { success: true, data: subjects }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to load subjects",
    }
  }
}
