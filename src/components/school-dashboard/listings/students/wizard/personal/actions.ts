"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { cookies } from "next/headers"
import { auth } from "@/auth"

import { ACTION_ERRORS, actionError } from "@/lib/action-errors"
import type { ActionResponse } from "@/lib/action-response"
import { db } from "@/lib/db"
import { createOrLinkGuardian, splitGuardianName } from "@/lib/guardian-utils"
import type { NameFormat } from "@/lib/name-utils"
import { getTenantContext } from "@/lib/tenant-context"
import {
  checkStudentPermission,
  getAuthContext,
  type AuthContext,
  type StudentAction,
} from "@/components/school-dashboard/listings/students/authorization"

import {
  personalGuardianSchema,
  personalStudentSchema,
  type PersonalGuardianFormData,
  type PersonalStudentFormData,
} from "./validation"

/**
 * Shared guard for the wizard sub-actions. `getTenantContext()` resolves
 * schoolId from the x-subdomain header BEFORE the session, so gating on
 * schoolId alone leaves these actions callable by an unauthenticated request
 * to a valid school subdomain (they read/write student PII, addresses,
 * documents, and guardian phone/WhatsApp). Every action must additionally
 * assert an authenticated session with a role that permits the operation —
 * mirrors the inline auth+permission pattern in the block's main actions.ts.
 */
async function authorizeWizardAction(
  action: StudentAction
): Promise<
  | { ok: true; schoolId: string; authContext: AuthContext }
  | { ok: false; response: ActionResponse }
> {
  const session = await auth()
  const authContext = getAuthContext(session)
  if (!authContext) {
    return { ok: false, response: actionError(ACTION_ERRORS.NOT_AUTHENTICATED) }
  }
  const { schoolId } = await getTenantContext()
  if (!schoolId) {
    return { ok: false, response: actionError(ACTION_ERRORS.MISSING_SCHOOL) }
  }
  if (!checkStudentPermission(authContext, action, { schoolId })) {
    return { ok: false, response: actionError(ACTION_ERRORS.UNAUTHORIZED) }
  }
  return { ok: true, schoolId, authContext }
}

// -----------------------------------------------------------------------------
// Student sub-tab — only the fields the simplified wizard collects.
// Extras (DOB, gender, nationality, email, emergency contact, …) stay on the
// DB row untouched and are edited later via the student profile page.
// -----------------------------------------------------------------------------

export async function getStudentPersonal(
  studentId: string
): Promise<
  ActionResponse<PersonalStudentFormData & { nameFormat: NameFormat }>
> {
  try {
    const authz = await authorizeWizardAction("read")
    if (!authz.ok) return authz.response
    const { schoolId } = authz

    const [student, school] = await Promise.all([
      db.student.findFirst({
        where: { id: studentId, schoolId },
        select: {
          firstName: true,
          middleName: true,
          lastName: true,
          mobileNumber: true,
          alternatePhone: true,
          dateOfBirth: true,
          gender: true,
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
        firstName: student.firstName,
        middleName: student.middleName ?? undefined,
        lastName: student.lastName,
        mobileNumber: student.mobileNumber ?? undefined,
        alternatePhone: student.alternatePhone ?? undefined,
        dateOfBirth: student.dateOfBirth
          ? student.dateOfBirth.toISOString().slice(0, 10)
          : undefined,
        gender: student.gender ?? undefined,
        nameFormat: (school?.nameFormat as NameFormat) ?? "full",
      },
    }
  } catch (error) {
    return actionError(
      ACTION_ERRORS.LOAD_FAILED,
      error instanceof Error ? error.message : undefined
    )
  }
}

export async function updateStudentPersonal(
  studentId: string,
  input: PersonalStudentFormData
): Promise<ActionResponse> {
  try {
    const authz = await authorizeWizardAction("update")
    if (!authz.ok) return authz.response
    const { schoolId } = authz

    const parsed = personalStudentSchema.parse(input)

    // Language the names were typed in (from current locale cookie).
    const cookieStore = await cookies()
    const lang = cookieStore.get("NEXT_LOCALE")?.value === "en" ? "en" : "ar"

    // DOB/gender: only overwrite when the admin actually entered a value.
    // Blank leaves the draft-row stub untouched (the column is NOT NULL).
    const dob =
      parsed.dateOfBirth && parsed.dateOfBirth.trim()
        ? new Date(parsed.dateOfBirth)
        : undefined

    await db.student.updateMany({
      where: { id: studentId, schoolId },
      data: {
        firstName: parsed.firstName,
        middleName: parsed.middleName ?? null,
        lastName: parsed.lastName,
        mobileNumber: parsed.mobileNumber || null,
        alternatePhone: parsed.alternatePhone || null,
        ...(dob && !Number.isNaN(dob.getTime()) ? { dateOfBirth: dob } : {}),
        ...(parsed.gender?.trim() ? { gender: parsed.gender.trim() } : {}),
        lang,
      },
    })

    return { success: true }
  } catch (error) {
    return actionError(
      ACTION_ERRORS.SAVE_FAILED,
      error instanceof Error ? error.message : undefined
    )
  }
}

// -----------------------------------------------------------------------------
// Guardian sub-tabs — Father + Mother in Guardian / StudentGuardian /
// GuardianPhoneNumber. Single name field per parent. WhatsApp stored as a
// second phone row with phoneType="whatsapp".
// -----------------------------------------------------------------------------

export async function getStudentPersonalGuardians(
  studentId: string
): Promise<ActionResponse<PersonalGuardianFormData>> {
  try {
    const authz = await authorizeWizardAction("read")
    if (!authz.ok) return authz.response
    const { schoolId } = authz

    const studentGuardians = await db.studentGuardian.findMany({
      where: { studentId, schoolId },
      include: { guardian: true, guardianType: true },
    })

    const result: PersonalGuardianFormData = {
      fatherName: "",
      fatherPhone: "",
      fatherWhatsapp: "",
      motherName: "",
      motherPhone: "",
      motherWhatsapp: "",
    }

    for (const sg of studentGuardians) {
      const typeName = sg.guardianType.name.toLowerCase()
      const phones = await db.guardianPhoneNumber.findMany({
        where: { guardianId: sg.guardianId, schoolId },
        orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }],
      })
      const primary = phones.find((p) => p.phoneType !== "whatsapp")
      const whatsapp = phones.find((p) => p.phoneType === "whatsapp")
      const displayName = [sg.guardian.firstName, sg.guardian.lastName]
        .filter(Boolean)
        .join(" ")
        .trim()

      if (typeName === "father") {
        result.fatherName = displayName
        result.fatherPhone = primary?.phoneNumber || ""
        result.fatherWhatsapp = whatsapp?.phoneNumber || ""
      } else if (typeName === "mother") {
        result.motherName = displayName
        result.motherPhone = primary?.phoneNumber || ""
        result.motherWhatsapp = whatsapp?.phoneNumber || ""
      }
    }

    return { success: true, data: result }
  } catch (error) {
    return actionError(
      ACTION_ERRORS.LOAD_FAILED,
      error instanceof Error ? error.message : undefined
    )
  }
}

export async function saveStudentPersonalGuardians(
  studentId: string,
  input: PersonalGuardianFormData
): Promise<ActionResponse> {
  try {
    const authz = await authorizeWizardAction("link_guardian")
    if (!authz.ok) return authz.response
    const { schoolId } = authz

    const parsed = personalGuardianSchema.parse(input)

    await db.$transaction(async (tx) => {
      if (parsed.fatherName?.trim()) {
        const { firstName, lastName } = splitGuardianName(parsed.fatherName)
        const { guardianId } = await createOrLinkGuardian(tx, {
          schoolId,
          studentId,
          typeName: "father",
          firstName,
          lastName,
          email: null,
          phone: parsed.fatherPhone?.trim() || null,
          occupation: null,
          isPrimary: true,
        })
        if (parsed.fatherWhatsapp?.trim()) {
          await tx.guardianPhoneNumber.upsert({
            where: {
              schoolId_guardianId_phoneNumber: {
                schoolId,
                guardianId,
                phoneNumber: parsed.fatherWhatsapp.trim(),
              },
            },
            create: {
              schoolId,
              guardianId,
              phoneNumber: parsed.fatherWhatsapp.trim(),
              phoneType: "whatsapp",
              isPrimary: false,
            },
            update: { phoneType: "whatsapp" },
          })
        }
      }

      if (parsed.motherName?.trim()) {
        const { firstName, lastName } = splitGuardianName(parsed.motherName)
        const { guardianId } = await createOrLinkGuardian(tx, {
          schoolId,
          studentId,
          typeName: "mother",
          firstName,
          lastName,
          email: null,
          phone: parsed.motherPhone?.trim() || null,
          occupation: null,
          // Mother is primary only if father wasn't provided.
          isPrimary: !parsed.fatherName?.trim(),
        })
        if (parsed.motherWhatsapp?.trim()) {
          await tx.guardianPhoneNumber.upsert({
            where: {
              schoolId_guardianId_phoneNumber: {
                schoolId,
                guardianId,
                phoneNumber: parsed.motherWhatsapp.trim(),
              },
            },
            create: {
              schoolId,
              guardianId,
              phoneNumber: parsed.motherWhatsapp.trim(),
              phoneType: "whatsapp",
              isPrimary: false,
            },
            update: { phoneType: "whatsapp" },
          })
        }
      }
    })

    return { success: true }
  } catch (error) {
    return actionError(
      ACTION_ERRORS.SAVE_FAILED,
      error instanceof Error ? error.message : undefined
    )
  }
}
