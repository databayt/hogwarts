"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { revalidatePath } from "next/cache"
import { auth } from "@/auth"

import type { ActionResponse } from "@/lib/action-response"
import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"

import type { GradeWizardData } from "./use-grade-wizard"

/** Fetch full result data for the wizard */
export async function getGradeForWizard(
  resultId: string
): Promise<
  { success: true; data: GradeWizardData } | { success: false; error: string }
> {
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) return { success: false, error: "Missing school context" }

    const result = await db.result.findFirst({
      where: { id: resultId, schoolId },
      include: {
        student: {
          select: { id: true, givenName: true, surname: true },
        },
        class: {
          select: { id: true, name: true },
        },
        assignment: {
          select: { id: true, title: true },
        },
        exam: {
          select: { id: true, title: true },
        },
        subject: {
          select: { id: true, subjectName: true },
        },
      },
    })

    if (!result) return { success: false, error: "Result not found" }

    return {
      success: true,
      data: {
        ...result,
        score: Number(result.score),
        maxScore: Number(result.maxScore),
        class: result.class
          ? { id: result.class.id, className: result.class.name }
          : null,
      } as GradeWizardData,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to load result",
    }
  }
}

/** Create a draft result record to start the wizard */
export async function createDraftResult(): Promise<
  ActionResponse<{ id: string }>
> {
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return { success: false, error: "Missing school context" }
    }

    const session = await auth()

    const firstStudent = await db.student.findFirst({
      where: { schoolId },
      select: { id: true },
    })
    const firstClass = await db.class.findFirst({
      where: { schoolId },
      select: { id: true },
    })

    if (!firstStudent || !firstClass) {
      return {
        success: false,
        error: "Students and classes are required before adding grades",
      }
    }

    const result = await db.result.create({
      data: {
        schoolId,
        studentId: firstStudent.id,
        classId: firstClass.id,
        score: 0,
        maxScore: 100,
        percentage: 0,
        grade: "F",
        gradedAt: new Date(),
        gradedBy: session?.user?.id ?? null,
        wizardStep: "selection",
      },
    })

    return { success: true, data: { id: result.id } }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create result",
    }
  }
}

/** Mark the grade wizard as complete */
export async function completeGradeWizard(
  resultId: string
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

    const result = await db.result.findFirst({
      where: { id: resultId, schoolId },
      select: { score: true, maxScore: true, grade: true },
    })

    if (!result) {
      return { success: false, error: "Result not found" }
    }

    if (Number(result.score) > Number(result.maxScore)) {
      return {
        success: false,
        error: "Score cannot exceed max score",
      }
    }

    if (!result.grade) {
      return {
        success: false,
        error: "Grade is required before completing",
      }
    }

    await db.result.updateMany({
      where: { id: resultId, schoolId },
      data: { wizardStep: null },
    })

    revalidatePath("/grades")
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to complete grade wizard",
    }
  }
}

/** Update the current wizard step for resumability */
export async function updateGradeWizardStep(
  resultId: string,
  step: string
): Promise<void> {
  try {
    const session = await auth()
    if (!session?.user) return

    const { schoolId } = await getTenantContext()
    if (!schoolId) return

    await db.result.updateMany({
      where: { id: resultId, schoolId },
      data: { wizardStep: step },
    })
  } catch {
    // Non-critical, don't throw
  }
}

/** Delete an abandoned draft result */
export async function deleteDraftResult(
  resultId: string
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
    const { count } = await db.result.deleteMany({
      where: { id: resultId, schoolId, wizardStep: { not: null } },
    })

    if (count === 0) {
      return { success: false, error: "Draft result not found" }
    }

    return { success: true }
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to delete draft result",
    }
  }
}
