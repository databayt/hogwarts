"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import crypto from "crypto"
import { revalidatePath } from "next/cache"
import { auth } from "@/auth"

import { ACTION_ERRORS, actionError } from "@/lib/action-errors"
import type { ActionResponse } from "@/lib/action-response"
import { db } from "@/lib/db"
import { isDraftId } from "@/lib/draft-id"
import { refreshPage } from "@/lib/refresh-page"
import { getTenantContext } from "@/lib/tenant-context"

import { EMPTY_TEACHER_DRAFT } from "../../empty-drafts"
import type { TeacherWizardData } from "./use-teacher-wizard"

/** Fetch full teacher data for the wizard */
export async function getTeacherForWizard(
  teacherId: string
): Promise<
  { success: true; data: TeacherWizardData } | { success: false; error: string }
> {
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) return actionError(ACTION_ERRORS.MISSING_SCHOOL)

    const [teacher, school] = await Promise.all([
      db.teacher.findFirst({
        where: { id: teacherId, schoolId },
        include: {
          phoneNumbers: {
            where: { schoolId },
            select: {
              id: true,
              phoneNumber: true,
              phoneType: true,
              isPrimary: true,
            },
          },
          qualifications: {
            where: { schoolId },
            select: {
              id: true,
              qualificationType: true,
              name: true,
              institution: true,
              major: true,
              dateObtained: true,
              expiryDate: true,
              licenseNumber: true,
              documentUrl: true,
            },
          },
          experiences: {
            where: { schoolId },
            select: {
              id: true,
              institution: true,
              position: true,
              startDate: true,
              endDate: true,
              isCurrent: true,
              description: true,
            },
          },
          subjectExpertise: {
            where: { schoolId },
            select: {
              id: true,
              subjectId: true,
              expertiseLevel: true,
              subject: { select: { id: true, name: true } },
            },
          },
        },
      }),
      db.school.findUnique({
        where: { id: schoolId },
        select: { nameFormat: true },
      }),
    ])

    if (!teacher) return actionError(ACTION_ERRORS.TEACHER_NOT_FOUND)

    return {
      success: true,
      data: {
        ...(teacher as unknown as TeacherWizardData),
        nameFormat: school?.nameFormat ?? "full",
      },
    }
  } catch (error) {
    console.error("[teacher-wizard]", error)
    return actionError(ACTION_ERRORS.LOAD_FAILED)
  }
}

/** Create a draft teacher record to start the wizard */
export async function createDraftTeacher(
  /** Minted by the browser so the wizard can open before this INSERT lands */
  id?: string
): Promise<ActionResponse<{ id: string }>> {
  try {
    if (id !== undefined && !isDraftId(id)) {
      return actionError(ACTION_ERRORS.VALIDATION_ERROR)
    }

    const session = await auth()
    if (!session?.user) {
      return actionError(ACTION_ERRORS.NOT_AUTHENTICATED)
    }

    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return actionError(ACTION_ERRORS.MISSING_SCHOOL)
    }

    const draftEmail = `draft-${crypto.randomUUID().slice(0, 8)}@draft.internal`

    const teacher = await db.teacher.create({
      data: {
        ...(id ? { id } : {}),
        schoolId,
        firstName: "",
        lastName: "",
        emailAddress: draftEmail,
        wizardStep: "information",
      },
    })

    return { success: true, data: { id: teacher.id } }
  } catch (error) {
    console.error("[teacher-wizard]", error)
    return actionError(ACTION_ERRORS.TEACHER_CREATE_FAILED)
  }
}

/** Mark the teacher wizard as complete */
export async function completeTeacherWizard(
  teacherId: string
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
    const teacher = await db.teacher.findFirst({
      where: { id: teacherId, schoolId },
      select: { firstName: true, lastName: true, emailAddress: true },
    })

    if (!teacher) {
      return actionError(ACTION_ERRORS.TEACHER_NOT_FOUND)
    }

    // One word is a whole name in full-name schools (see the student wizard).
    if (!teacher.firstName?.trim()) {
      return actionError(ACTION_ERRORS.TEACHER_NAME_REQUIRED)
    }

    if (
      !teacher.emailAddress ||
      teacher.emailAddress.endsWith("@draft.internal")
    ) {
      return actionError(ACTION_ERRORS.TEACHER_EMAIL_REQUIRED)
    }

    await db.teacher.updateMany({
      where: { id: teacherId, schoolId },
      data: { wizardStep: null },
    })

    refreshPage("/teachers")
    return { success: true }
  } catch (error) {
    console.error("[teacher-wizard]", error)
    return actionError(ACTION_ERRORS.SAVE_FAILED)
  }
}

/** Update the current wizard step for resumability */
export async function updateTeacherWizardStep(
  teacherId: string,
  step: string
): Promise<void> {
  try {
    const session = await auth()
    if (!session?.user) return

    const { schoolId } = await getTenantContext()
    if (!schoolId) return

    await db.teacher.updateMany({
      where: { id: teacherId, schoolId },
      data: { wizardStep: step },
    })
  } catch {
    // Non-critical, don't throw
  }
}

/**
 * The wizard's Close button — same contract as discardEmptyStudentDraft:
 * the draft is deleted only while it is still EMPTY (empty-drafts.ts), and
 * that check is the delete's own WHERE.
 */
export async function discardEmptyTeacherDraft(
  teacherId: string
): Promise<ActionResponse<{ discarded: boolean }>> {
  try {
    const session = await auth()
    if (!session?.user) {
      return actionError(ACTION_ERRORS.NOT_AUTHENTICATED)
    }

    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return actionError(ACTION_ERRORS.MISSING_SCHOOL)
    }

    const { count } = await db.teacher.deleteMany({
      where: { id: teacherId, schoolId, ...EMPTY_TEACHER_DRAFT },
    })
    if (count > 0) revalidatePath("/[lang]/s/[subdomain]/teachers", "page")

    return { success: true, data: { discarded: count > 0 } }
  } catch (error) {
    console.error("[teacher-wizard]", error)
    return actionError(ACTION_ERRORS.TEACHER_DELETE_FAILED)
  }
}

/** Delete an abandoned draft teacher */
export async function deleteDraftTeacher(
  teacherId: string
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
    const { count } = await db.teacher.deleteMany({
      where: { id: teacherId, schoolId, wizardStep: { not: null } },
    })

    if (count === 0) {
      return actionError(ACTION_ERRORS.TEACHER_NOT_FOUND)
    }

    return { success: true }
  } catch (error) {
    console.error("[teacher-wizard]", error)
    return actionError(ACTION_ERRORS.SAVE_FAILED)
  }
}
