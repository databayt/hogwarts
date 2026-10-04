"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { auth } from "@/auth"

import { ACTION_ERRORS, actionError } from "@/lib/action-errors"
import type { ActionResponse } from "@/lib/action-response"
import { db } from "@/lib/db"
import { refreshPage } from "@/lib/refresh-page"
import { getSchoolSubjectOptions } from "@/lib/school-subjects"
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
    if (!schoolId) return actionError(ACTION_ERRORS.MISSING_SCHOOL)

    const exam = await db.schoolExam.findFirst({
      where: { id: examId, schoolId },
      include: {
        class: { select: { gradeId: true } },
        subject: { select: { id: true, name: true } },
      },
    })

    if (!exam) return actionError(ACTION_ERRORS.EXAM_NOT_FOUND)

    // A legacy exam opens on its class's grade (see getExamInformation).
    const gradeId = exam.gradeId ?? exam.class?.gradeId ?? ""
    return {
      success: true,
      data: {
        ...exam,
        gradeId,
        subjectId: gradeId ? exam.subjectId : "",
        retakePenalty: exam.retakePenalty ? Number(exam.retakePenalty) : null,
        subject: exam.subject
          ? { id: exam.subject.id, name: exam.subject.name }
          : { id: "", name: "" },
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
      return actionError(ACTION_ERRORS.NOT_AUTHENTICATED)
    }

    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return actionError(ACTION_ERRORS.MISSING_SCHOOL)
    }

    // The column needs a subject before the information step picks the real
    // scope. The draft has no grade until then, so it reaches nobody.
    const firstSelection = await db.subjectSelection.findFirst({
      where: { schoolId, isActive: true },
      orderBy: { createdAt: "asc" },
      select: { catalogSubjectId: true },
    })

    if (!firstSelection) return actionError(ACTION_ERRORS.NO_SUBJECTS)

    const exam = await db.schoolExam.create({
      data: {
        schoolId,
        title: "",
        subjectId: firstSelection.catalogSubjectId,
        createdById: session.user.id,
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
      return actionError(ACTION_ERRORS.NOT_AUTHENTICATED)
    }

    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return actionError(ACTION_ERRORS.MISSING_SCHOOL)
    }

    const exam = await db.schoolExam.findFirst({
      where: { id: examId, schoolId },
      select: { title: true, classId: true, gradeId: true },
    })

    if (!exam) {
      return actionError(ACTION_ERRORS.EXAM_NOT_FOUND)
    }

    if (!exam.title?.trim()) {
      return {
        success: false,
        error: "Title is required before completing",
      }
    }

    // Without a grade (or a legacy class) the exam reaches no student.
    if (!exam.gradeId && !exam.classId) {
      return actionError(ACTION_ERRORS.VALIDATION_ERROR)
    }

    await db.schoolExam.updateMany({
      where: { id: examId, schoolId },
      data: { wizardStep: null },
    })

    refreshPage("/exams")
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

    await db.schoolExam.updateMany({
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
      return actionError(ACTION_ERRORS.NOT_AUTHENTICATED)
    }

    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return actionError(ACTION_ERRORS.MISSING_SCHOOL)
    }

    // Atomic delete — only if it's still a draft
    const { count } = await db.schoolExam.deleteMany({
      where: { id: examId, schoolId, wizardStep: { not: null } },
    })

    if (count === 0) {
      return actionError(ACTION_ERRORS.EXAM_NOT_FOUND)
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

/** Fetch subjects for the current school (for SelectField options) */
export async function getSubjectOptions(): Promise<
  ActionResponse<{ id: string; name: string }[]>
> {
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) return actionError(ACTION_ERRORS.MISSING_SCHOOL)

    const subjects = await getSchoolSubjectOptions(schoolId)

    return { success: true, data: subjects }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to load subjects",
    }
  }
}
