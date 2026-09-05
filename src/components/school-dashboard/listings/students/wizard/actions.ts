"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { revalidatePath } from "next/cache"
import { after } from "next/server"

import { ACTION_ERRORS, actionError } from "@/lib/action-errors"
import type { ActionResponse } from "@/lib/action-response"
import { db } from "@/lib/db"
import { PARENT_GUARDIAN_TYPE_NAMES } from "@/lib/guardian-utils"
import { provisionStudent } from "@/lib/student-provisioning"
import { notifyProvisionedStudent } from "@/lib/student-provisioning-notify"

import { authorizeWizardAction } from "./authorize"
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
    // Reads the whole student graph (PII, address, guardians). It used to
    // resolve the tenant only — callable unauthenticated on any subdomain.
    const authz = await authorizeWizardAction("read")
    if (!authz.ok) {
      return {
        success: false,
        error: authz.response.error ?? ACTION_ERRORS.UNAUTHORIZED,
      }
    }
    const { schoolId } = authz

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
    const authz = await authorizeWizardAction("create")
    if (!authz.ok) return authz.response
    const { schoolId } = authz

    const student = await db.student.create({
      data: {
        schoolId,
        firstName: "",
        lastName: "",
        // `dateOfBirth` is NOT NULL, so a draft needs a stub. Use a neutral
        // sentinel (matches provisionStudent's own fallback) rather than
        // `new Date()`, which silently stamped every student as "born today".
        // The wizard's personal step now collects the real DOB + gender and
        // overwrites these when the admin fills them in.
        dateOfBirth: new Date("2000-01-01"),
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
export async function completeStudentWizard(studentId: string): Promise<
  ActionResponse<{
    studentId: string
    /** Display name — the credentials dialog titles itself with it. */
    name: string
    /** Phone on file, for the dialog's WhatsApp share channel. */
    phone: string | null
    credentials: { username: string; password: string } | null
    /** Non-fatal provisioning notes — e.g. no fee structure for the grade, or
     *  no grade set so no fees. Codes map to translated copy via
     *  `admission/warning-messages.ts`. */
    warnings: Array<{ code: string; meta?: Record<string, unknown> }>
  }>
> {
  try {
    // Mints a login, fees and invoices — the same permission as creating the
    // student in the first place.
    const authz = await authorizeWizardAction("create")
    if (!authz.ok) return authz.response
    const { schoolId } = authz

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
          email: true,
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
          applicationId: true,
          wizardStep: true,
        },
      }),
      db.studentGuardian.count({
        where: {
          studentId,
          schoolId,
          // Every stored spelling of father/mother — the demo seed writes
          // them in Arabic, so the English literals matched 5 of 978 rows.
          guardianType: { name: { in: [...PARENT_GUARDIAN_TYPE_NAMES] } },
        },
      }),
    ])

    if (!student) {
      return actionError(ACTION_ERRORS.STUDENT_NOT_FOUND)
    }

    // The wizard doubles as the EDIT surface for an enrolled student (the
    // final button reads "Save"). Every step has already persisted its fields
    // — the academic step re-runs fee assignment and class enrollment itself —
    // so there is nothing left to provision. Running the core again here used
    // to mint a second shadow Application per save (re-pointing the student
    // at it and orphaning a PORTAL application), regenerate the student code
    // and re-send the "your account was created" notice.
    //
    // A row with no wizard step is past the wizard, whether the core built it
    // or it predates the core (most legacy rows carry no applicationId, and
    // many no userId, until the backfill runs). Requiring either here would
    // push every legacy student back through the core on Update: a re-stamped
    // status and dates, a fresh shadow application, a second welcome notice.
    const alreadyProvisioned = student.wizardStep === null
    const displayName = `${student.firstName} ${student.lastName}`.trim()
    if (alreadyProvisioned) {
      revalidatePath("/[lang]/s/[subdomain]/students", "page")
      return {
        success: true,
        data: {
          studentId,
          name: displayName,
          phone: student.mobileNumber ?? null,
          credentials: null,
          warnings: [],
        },
      }
    }

    // The completeness gate guards PROVISIONING only — the core needs a name
    // and a parent to mint the login and notify a family. An enrolled student
    // saving edits has already left the wizard; gating their Save on a parent
    // link (which legacy rows may carry under another type name) locked them
    // on the last step with no way out but Close.
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
            applicationId: student.applicationId,
          },
          {
            // `notify` is informational — provisionStudent never dispatches;
            // the caller does, post-commit, via notifyProvisionedStudent.
            notify: false,
            credentialDelivery: "temp-password",
            origin: "ADMIN_DIRECT",
          },
          tx
        ),
      { timeout: 30000 }
    )

    // Post-commit, shared with every other intake channel. The student
    // themselves usually has no real address (the core synthesizes an
    // `@student.local` placeholder), so their notice stays in-app and the
    // email channel is dropped from the row — but the GUARDIANS collected in
    // the personal step do have addresses, and before this they were never
    // told their child had been enrolled. Credentials travel through `result`
    // to the shared credentials dialog (wizard/finish.ts), not through mail.
    after(() =>
      notifyProvisionedStudent({
        schoolId,
        studentId,
        userId: result.userId,
        origin: "ADMIN_DIRECT",
        studentName: `${student.firstName} ${student.lastName}`,
        email: student.email,
        isNewUser: result.isNewUser,
        lang: student.lang,
        delivery: "immediate",
      }).catch((err) =>
        console.error("[completeStudentWizard] Notification error:", err)
      )
    )

    // Route PATTERNS with "page" — the previous bare `revalidatePath("/students")`
    // matched no cache tag on a `[lang]/s/[subdomain]` route and was a no-op.
    // The Applications tab is invalidated too: this student now has an
    // ADMIN_DIRECT Application that the tab lists alongside portal ones.
    revalidatePath("/[lang]/s/[subdomain]/students", "page")
    revalidatePath("/[lang]/s/[subdomain]/admission/applications", "page")
    return {
      success: true,
      data: {
        studentId,
        name: displayName,
        phone: student.mobileNumber ?? null,
        credentials: result.credentials ?? null,
        warnings: result.warnings,
      },
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
    const authz = await authorizeWizardAction("update")
    if (!authz.ok) return
    const { schoolId } = authz

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
    const authz = await authorizeWizardAction("delete")
    if (!authz.ok) return authz.response
    const { schoolId } = authz

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
