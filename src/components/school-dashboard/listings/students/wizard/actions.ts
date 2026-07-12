"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { revalidatePath } from "next/cache"
import { auth } from "@/auth"

import { ACTION_ERRORS, actionError } from "@/lib/action-errors"
import type { ActionResponse } from "@/lib/action-response"
import { db } from "@/lib/db"
import { provisionStudent } from "@/lib/student-provisioning"
import { getTenantContext } from "@/lib/tenant-context"

import type { StudentWizardData } from "./use-student-wizard"
import {
  getPersonalCompleteness,
  isPersonalComplete,
  listMissingRequirements,
} from "./validation-helpers"

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

    // Validate required fields are present. The student wizard now mirrors
    // the application wizard's structure: personal step is the only required
    // step, and a parent (father OR mother) is part of "personal complete".
    const [student, parentCount] = await Promise.all([
      db.student.findFirst({
        where: { id: studentId, schoolId },
        select: {
          firstName: true,
          middleName: true,
          lastName: true,
          studentId: true,
          academicGradeId: true,
          sectionId: true,
          dateOfBirth: true,
          gender: true,
          nationality: true,
          mobileNumber: true,
          alternatePhone: true,
          currentAddress: true,
          city: true,
          state: true,
          postalCode: true,
          country: true,
          profilePhotoUrl: true,
          previousSchoolName: true,
          previousGrade: true,
          lang: true,
          userId: true,
        },
      }),
      db.studentGuardian.count({
        where: {
          studentId,
          schoolId,
          guardianType: { name: { in: ["father", "mother"] } },
        },
      }),
    ])

    if (!student) {
      return actionError(ACTION_ERRORS.STUDENT_NOT_FOUND)
    }

    const completeness = getPersonalCompleteness({
      firstName: student.firstName,
      lastName: student.lastName,
      hasFatherOrMother: parentCount > 0,
    })
    if (!isPersonalComplete(completeness)) {
      return actionError(
        ACTION_ERRORS.VALIDATION_ERROR,
        `Missing: ${listMissingRequirements(completeness).join(", ")}`
      )
    }

    // Provision the full student graph via the shared core: creates the User +
    // login (the draft had none), mints a direct-admit Application (channel
    // ADMIN_DIRECT), assigns the student code, links year-level, and generates
    // fee assignments AND invoices (previously skipped because there was no
    // userId). Guardians + documents were already created in earlier wizard
    // steps, so they're not re-passed. `email` is absent for wizard students —
    // the core synthesizes a placeholder so the login can exist.
    const result = await db.$transaction(
      (tx) =>
        provisionStudent(
          {
            existingStudentId: studentId,
            schoolId,
            firstName: student.firstName,
            middleName: student.middleName,
            lastName: student.lastName,
            dateOfBirth: student.dateOfBirth,
            gender: student.gender,
            nationality: student.nationality,
            phone: student.mobileNumber,
            alternatePhone: student.alternatePhone,
            address: student.currentAddress,
            city: student.city,
            state: student.state,
            postalCode: student.postalCode,
            country: student.country,
            academicGradeId: student.academicGradeId,
            sectionId: student.sectionId,
            previousSchool: student.previousSchoolName,
            previousGrade: student.previousGrade,
            photoUrl: student.profilePhotoUrl,
            lang: student.lang,
            userId: student.userId,
          },
          {
            notify: true,
            credentialDelivery: "temp-password",
            origin: "ADMIN_DIRECT",
          },
          tx
        ),
      { timeout: 30000 }
    )

    revalidatePath("/students")
    return {
      success: true,
      data: { studentId, credentials: result.credentials ?? null },
    }
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
