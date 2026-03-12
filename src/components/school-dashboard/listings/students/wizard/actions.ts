"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { revalidatePath } from "next/cache"
import { auth } from "@/auth"

import type { ActionResponse } from "@/lib/action-response"
import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"

import type { StudentWizardData } from "./use-student-wizard"

/** Fetch full student data for the wizard */
export async function getStudentForWizard(
  studentId: string
): Promise<
  { success: true; data: StudentWizardData } | { success: false; error: string }
> {
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) return { success: false, error: "Missing school context" }

    const student = await db.student.findFirst({
      where: { id: studentId, schoolId },
    })

    if (!student) return { success: false, error: "Student not found" }

    return { success: true, data: student as StudentWizardData }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to load student",
    }
  }
}

/** Create a draft student record to start the wizard */
export async function createDraftStudent(): Promise<
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

    const student = await db.student.create({
      data: {
        schoolId,
        givenName: "",
        surname: "",
        dateOfBirth: new Date(),
        gender: "male",
        wizardStep: "personal",
      },
    })

    return { success: true, data: { id: student.id } }
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to create student",
    }
  }
}

/** Mark the student wizard as complete */
export async function completeStudentWizard(
  studentId: string
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
    const student = await db.student.findFirst({
      where: { id: studentId, schoolId },
      select: { givenName: true, surname: true },
    })

    if (!student) {
      return { success: false, error: "Student not found" }
    }

    if (!student.givenName || !student.surname) {
      return {
        success: false,
        error: "Name is required before completing",
      }
    }

    await db.student.updateMany({
      where: { id: studentId, schoolId },
      data: { wizardStep: null },
    })

    revalidatePath("/students")
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to complete student wizard",
    }
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

    await db.student.updateMany({
      where: { id: studentId, schoolId },
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
      return { success: false, error: "Not authenticated" }
    }

    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return { success: false, error: "Missing school context" }
    }

    // Atomic delete — only if it's still a draft
    const { count } = await db.student.deleteMany({
      where: { id: studentId, schoolId, wizardStep: { not: null } },
    })

    if (count === 0) {
      return { success: false, error: "Draft student not found" }
    }

    return { success: true }
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to delete draft student",
    }
  }
}
