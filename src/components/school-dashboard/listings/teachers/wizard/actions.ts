"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import crypto from "crypto"
import { revalidatePath } from "next/cache"
import { auth } from "@/auth"

import type { ActionResponse } from "@/lib/action-response"
import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"

import type { TeacherWizardData } from "./use-teacher-wizard"

/** Fetch full teacher data for the wizard */
export async function getTeacherForWizard(
  teacherId: string
): Promise<
  { success: true; data: TeacherWizardData } | { success: false; error: string }
> {
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) return { success: false, error: "Missing school context" }

    const teacher = await db.teacher.findFirst({
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
            subject: { select: { id: true, subjectName: true } },
          },
        },
      },
    })

    if (!teacher) return { success: false, error: "Teacher not found" }

    return { success: true, data: teacher as TeacherWizardData }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to load teacher",
    }
  }
}

/** Create a draft teacher record to start the wizard */
export async function createDraftTeacher(): Promise<
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

    const draftEmail = `draft-${crypto.randomUUID().slice(0, 8)}@draft.internal`

    const teacher = await db.teacher.create({
      data: {
        schoolId,
        givenName: "",
        surname: "",
        emailAddress: draftEmail,
        wizardStep: "information",
      },
    })

    return { success: true, data: { id: teacher.id } }
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to create teacher",
    }
  }
}

/** Mark the teacher wizard as complete */
export async function completeTeacherWizard(
  teacherId: string
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

    // Validate required fields are present
    const teacher = await db.teacher.findFirst({
      where: { id: teacherId, schoolId },
      select: { givenName: true, surname: true, emailAddress: true },
    })

    if (!teacher) {
      return { success: false, error: "Teacher not found" }
    }

    if (!teacher.givenName || !teacher.surname) {
      return {
        success: false,
        error: "Name is required before completing",
      }
    }

    if (
      !teacher.emailAddress ||
      teacher.emailAddress.endsWith("@draft.internal")
    ) {
      return {
        success: false,
        error: "Valid email is required before completing",
      }
    }

    await db.teacher.updateMany({
      where: { id: teacherId, schoolId },
      data: { wizardStep: null },
    })

    revalidatePath("/teachers")
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to complete teacher wizard",
    }
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

/** Delete an abandoned draft teacher */
export async function deleteDraftTeacher(
  teacherId: string
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
    const { count } = await db.teacher.deleteMany({
      where: { id: teacherId, schoolId, wizardStep: { not: null } },
    })

    if (count === 0) {
      return { success: false, error: "Draft teacher not found" }
    }

    return { success: true }
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to delete draft teacher",
    }
  }
}
