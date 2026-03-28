"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { revalidatePath } from "next/cache"
import { auth } from "@/auth"

import { ACTION_ERRORS, actionError } from "@/lib/action-errors"
import type { ActionResponse } from "@/lib/action-response"
import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"

import type { StudentWizardData } from "./use-student-wizard"

/** Fetch full student data for the wizard */
export async function getStudentForWizard(
  studentId: string
): Promise<
  | { success: true; data: StudentWizardData }
  | { success: false; error: string; details?: string }
> {
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) return actionError(ACTION_ERRORS.MISSING_SCHOOL)

    const [student, school] = await Promise.all([
      db.student.findFirst({
        where: { id: studentId, schoolId },
        include: {
          application: {
            select: {
              applicationNumber: true,
              campaignId: true,
              status: true,
              submittedAt: true,
              confirmationDate: true,
              campaign: { select: { name: true, academicYear: true } },
            },
          },
          studentGuardians: {
            include: {
              guardian: true,
              guardianType: true,
            },
          },
        },
      }),
      db.school.findUnique({
        where: { id: schoolId },
        select: { nameFormat: true },
      }),
    ])

    if (!student) return actionError(ACTION_ERRORS.STUDENT_NOT_FOUND)

    return {
      success: true,
      data: {
        ...(student as unknown as StudentWizardData),
        nameFormat: school?.nameFormat ?? "full",
        guardians: (student.studentGuardians || []).map((sg) => ({
          guardianId: sg.guardianId,
          firstName: sg.guardian.firstName,
          lastName: sg.guardian.lastName,
          typeName: sg.guardianType.name,
          isPrimary: sg.isPrimary,
          phone: null,
          email: sg.guardian.emailAddress,
          occupation: sg.occupation,
        })),
      },
    }
  } catch (error) {
    return actionError(
      ACTION_ERRORS.LOAD_FAILED,
      error instanceof Error ? error.message : undefined
    )
  }
}

/** Create a draft student record to start the wizard */
export async function createDraftStudent(): Promise<
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

    const student = await db.student.create({
      data: {
        schoolId,
        firstName: "",
        lastName: "",
        dateOfBirth: new Date(),
        gender: "male",
        wizardStep: "attachments",
      },
    })

    return { success: true, data: { id: student.id } }
  } catch (error) {
    return actionError(
      ACTION_ERRORS.STUDENT_CREATE_FAILED,
      error instanceof Error ? error.message : undefined
    )
  }
}

/** Mark the student wizard as complete */
export async function completeStudentWizard(
  studentId: string
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
    const student = await db.student.findFirst({
      where: { id: studentId, schoolId },
      select: { firstName: true, lastName: true },
    })

    if (!student) {
      return actionError(ACTION_ERRORS.STUDENT_NOT_FOUND)
    }

    if (!student.firstName || !student.lastName) {
      return actionError(ACTION_ERRORS.VALIDATION_ERROR)
    }

    await db.student.updateMany({
      where: { id: studentId, schoolId },
      data: { wizardStep: null },
    })

    revalidatePath("/students")
    return { success: true }
  } catch (error) {
    return actionError(
      ACTION_ERRORS.STUDENT_UPDATE_FAILED,
      error instanceof Error ? error.message : undefined
    )
  }
}

/** Update the current wizard step for resumability */
export async function updateStudentWizardStep(
  studentId: string,
  step: string
): Promise<void> {
  try {
    const session = await auth()
    if (!session?.user) return

    const { schoolId } = await getTenantContext()
    if (!schoolId) return

    // Only update wizardStep for draft students (wizardStep is non-null).
    // Enrolled/complete students (wizardStep: null) should not be reverted to draft.
    await db.student.updateMany({
      where: { id: studentId, schoolId, wizardStep: { not: null } },
      data: { wizardStep: step },
    })
  } catch {
    // Non-critical, don't throw
  }
}

/** Delete an abandoned draft student */
export async function deleteDraftStudent(
  studentId: string
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
    const { count } = await db.student.deleteMany({
      where: { id: studentId, schoolId, wizardStep: { not: null } },
    })

    if (count === 0) {
      return actionError(ACTION_ERRORS.STUDENT_NOT_FOUND)
    }

    return { success: true }
  } catch (error) {
    return actionError(
      ACTION_ERRORS.STUDENT_DELETE_FAILED,
      error instanceof Error ? error.message : undefined
    )
  }
}
