"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { after } from "next/server"
import { auth } from "@/auth"
import { Decimal } from "@prisma/client/runtime/library"

import { ACTION_ERRORS, actionError } from "@/lib/action-errors"
import type { ActionResponse } from "@/lib/action-response"
import { db } from "@/lib/db"
import { refreshPage } from "@/lib/refresh-page"
import { getTenantContext } from "@/lib/tenant-context"

import { assertAssignmentPermission, getAuthContext } from "../authorization"
import { notifyAssignmentPublished } from "../notify"
import { wizardEditor } from "./guard"
import type { AssignmentWizardData } from "./use-assignment-wizard"

/** Fetch full assignment data for the wizard */
export async function getAssignmentForWizard(
  assignmentId: string
): Promise<
  | { success: true; data: AssignmentWizardData }
  | { success: false; error: string }
> {
  try {
    const editor = await wizardEditor("update")
    if (!editor) return actionError(ACTION_ERRORS.UNAUTHORIZED)
    const { schoolId } = editor

    const assignment = await db.schoolAssignment.findFirst({
      where: { id: assignmentId, schoolId },
      select: {
        id: true,
        schoolId: true,
        gradeId: true,
        sectionId: true,
        subjectId: true,
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

    // A fresh draft has no scope yet.
    const row = assignment
    return {
      success: true,
      data: {
        ...row,
        gradeId: row.gradeId ?? "",
        subjectId: row.subjectId ?? "",
        totalPoints: Number(row.totalPoints),
        weight: Number(row.weight),
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
    const editor = await wizardEditor("create")
    if (!editor) return actionError(ACTION_ERRORS.UNAUTHORIZED)
    const { schoolId } = editor

    // Default due date: 7 days from now
    const dueDate = new Date()
    dueDate.setDate(dueDate.getDate() + 7)

    // No class needed: the information step sets the grade, section and
    // subject. Until then the draft reaches nobody.
    const assignment = await db.schoolAssignment.create({
      data: {
        schoolId,
        createdById: editor.userId ?? null,
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
    const authContext = getAuthContext(session)
    if (!authContext) {
      return actionError(ACTION_ERRORS.NOT_AUTHENTICATED)
    }

    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return actionError(ACTION_ERRORS.MISSING_SCHOOL)
    }
    // Finishing publishes — the same role gate as editing an assignment.
    // This action checked sign-in only.
    assertAssignmentPermission(authContext, "update", { schoolId })

    // Validate required fields are present
    const assignment = await db.schoolAssignment.findFirst({
      where: { id: assignmentId, schoolId },
      select: { title: true, gradeId: true, status: true },
    })

    if (!assignment) {
      return actionError(ACTION_ERRORS.NOT_FOUND)
    }

    if (!assignment.title) {
      return actionError(ACTION_ERRORS.VALIDATION_ERROR, "title_required")
    }

    // Without a grade it reaches no student.
    if (!assignment.gradeId) {
      return actionError(ACTION_ERRORS.VALIDATION_ERROR, "scope_required")
    }

    // Finishing the wizard PUBLISHES. It used to clear the step and leave the
    // row DRAFT — and students' lists hide drafts, and nothing else on the
    // web ever set PUBLISHED — so homework built here reached no student.
    const publishing = assignment.status === "DRAFT"
    await db.schoolAssignment.updateMany({
      where: { id: assignmentId, schoolId },
      data: {
        wizardStep: null,
        ...(publishing ? { status: "PUBLISHED", publishDate: new Date() } : {}),
      },
    })
    if (publishing) {
      after(() => notifyAssignmentPublished(schoolId, assignmentId))
    }

    refreshPage("/assignments")
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
    const editor = await wizardEditor("update")
    if (!editor) return
    const { schoolId } = editor

    await db.schoolAssignment.updateMany({
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
    const editor = await wizardEditor("delete")
    if (!editor) return actionError(ACTION_ERRORS.UNAUTHORIZED)
    const { schoolId } = editor

    // Atomic delete — only if it's still a draft
    const { count } = await db.schoolAssignment.deleteMany({
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
