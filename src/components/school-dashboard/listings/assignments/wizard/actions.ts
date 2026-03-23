"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { revalidatePath } from "next/cache"
import { auth } from "@/auth"
import { Decimal } from "@prisma/client/runtime/library"

import { ACTION_ERRORS, actionError } from "@/lib/action-errors"
import type { ActionResponse } from "@/lib/action-response"
import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"

import type { AssignmentWizardData } from "./use-assignment-wizard"

/** Fetch full assignment data for the wizard */
export async function getAssignmentForWizard(
  assignmentId: string
): Promise<
  | { success: true; data: AssignmentWizardData }
  | { success: false; error: string }
> {
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) return actionError(ACTION_ERRORS.MISSING_SCHOOL)

    const assignment = await db.assignment.findFirst({
      where: { id: assignmentId, schoolId },
      select: {
        id: true,
        schoolId: true,
        classId: true,
        title: true,
        description: true,
        type: true,
        status: true,
        totalPoints: true,
        weight: true,
        dueDate: true,
        instructions: true,
        wizardStep: true,
      },
    })

    if (!assignment) return actionError(ACTION_ERRORS.NOT_FOUND)

    return {
      success: true,
      data: {
        ...assignment,
        totalPoints: Number(assignment.totalPoints),
        weight: Number(assignment.weight),
      },
    }
  } catch (error) {
    return actionError(
      ACTION_ERRORS.UNKNOWN,
      error instanceof Error ? error.message : undefined
    )
  }
}

/** Create a draft assignment record to start the wizard */
export async function createDraftAssignment(): Promise<
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

    // Find the first available class for this school
    const firstClass = await db.class.findFirst({
      where: { schoolId },
      select: { id: true },
    })

    if (!firstClass) {
      return actionError(ACTION_ERRORS.NOT_FOUND, "no_classes")
    }

    // Default due date: 7 days from now
    const dueDate = new Date()
    dueDate.setDate(dueDate.getDate() + 7)

    const assignment = await db.assignment.create({
      data: {
        schoolId,
        classId: firstClass.id,
        title: "",
        type: "HOMEWORK",
        totalPoints: new Decimal(100),
        weight: new Decimal(10),
        dueDate,
        status: "DRAFT",
        wizardStep: "information",
      },
    })

    return { success: true, data: { id: assignment.id } }
  } catch (error) {
    return actionError(
      ACTION_ERRORS.UNKNOWN,
      error instanceof Error ? error.message : undefined
    )
  }
}

/** Mark the assignment wizard as complete */
export async function completeAssignmentWizard(
  assignmentId: string
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

    // Validate required fields are present
    const assignment = await db.assignment.findFirst({
      where: { id: assignmentId, schoolId },
      select: { title: true },
    })

    if (!assignment) {
      return actionError(ACTION_ERRORS.NOT_FOUND)
    }

    if (!assignment.title) {
      return actionError(ACTION_ERRORS.VALIDATION_ERROR, "title_required")
    }

    await db.assignment.updateMany({
      where: { id: assignmentId, schoolId },
      data: { wizardStep: null },
    })

    revalidatePath("/assignments")
    return { success: true }
  } catch (error) {
    return actionError(
      ACTION_ERRORS.UNKNOWN,
      error instanceof Error ? error.message : undefined
    )
  }
}

/** Update the current wizard step for resumability */
export async function updateAssignmentWizardStep(
  assignmentId: string,
  step: string
): Promise<void> {
  try {
    const session = await auth()
    if (!session?.user) return

    const { schoolId } = await getTenantContext()
    if (!schoolId) return

    await db.assignment.updateMany({
      where: { id: assignmentId, schoolId },
      data: { wizardStep: step },
    })
  } catch {
    // Non-critical, don't throw
  }
}

/** Delete an abandoned draft assignment */
export async function deleteDraftAssignment(
  assignmentId: string
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

    // Atomic delete — only if it's still a draft
    const { count } = await db.assignment.deleteMany({
      where: { id: assignmentId, schoolId, wizardStep: { not: null } },
    })

    if (count === 0) {
      return actionError(ACTION_ERRORS.NOT_FOUND)
    }

    return { success: true }
  } catch (error) {
    return actionError(
      ACTION_ERRORS.UNKNOWN,
      error instanceof Error ? error.message : undefined
    )
  }
}
