"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { cookies } from "next/headers"

import { ACTION_ERRORS, actionError } from "@/lib/action-errors"
import type { ActionResponse } from "@/lib/action-response"
import { db } from "@/lib/db"
import { createOrLinkGuardian } from "@/lib/guardian-utils"
import type { NameFormat } from "@/lib/name-utils"
import { getTenantContext } from "@/lib/tenant-context"

import {
  personalGuardianSchema,
  personalStudentSchema,
  type PersonalGuardianFormData,
  type PersonalStudentFormData,
} from "./validation"

// -----------------------------------------------------------------------------
// Student sub-tab — identity + contact + emergency fields on the Student row
// -----------------------------------------------------------------------------

export async function getStudentPersonal(
  studentId: string
): Promise<
  ActionResponse<PersonalStudentFormData & { nameFormat: NameFormat }>
> {
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) return actionError(ACTION_ERRORS.MISSING_SCHOOL)

    const [student, school] = await Promise.all([
      db.student.findFirst({
        where: { id: studentId, schoolId },
        select: {
          firstName: true,
          middleName: true,
          lastName: true,
          dateOfBirth: true,
          gender: true,
          nationality: true,
          profilePhotoUrl: true,
          email: true,
          mobileNumber: true,
          alternatePhone: true,
          emergencyContactName: true,
          emergencyContactPhone: true,
          emergencyContactRelation: true,
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
        dateOfBirth: student.dateOfBirth,
        gender: student.gender as "male" | "female",
        nationality: student.nationality ?? undefined,
        profilePhotoUrl: student.profilePhotoUrl ?? undefined,
        email: student.email ?? undefined,
        mobileNumber: student.mobileNumber ?? undefined,
        alternatePhone: student.alternatePhone ?? undefined,
        emergencyContactName: student.emergencyContactName ?? undefined,
        emergencyContactPhone: student.emergencyContactPhone ?? undefined,
        emergencyContactRelation: student.emergencyContactRelation ?? undefined,
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
    const { schoolId } = await getTenantContext()
    if (!schoolId) return actionError(ACTION_ERRORS.MISSING_SCHOOL)

    const parsed = personalStudentSchema.parse(input)

    // Detect the language names were entered in (from current locale cookie)
    // so dynamic-content translation knows the source language.
    const cookieStore = await cookies()
    const lang = cookieStore.get("NEXT_LOCALE")?.value === "en" ? "en" : "ar"

    await db.student.updateMany({
      where: { id: studentId, schoolId },
      data: {
        firstName: parsed.firstName,
        middleName: parsed.middleName ?? null,
        lastName: parsed.lastName,
        dateOfBirth: parsed.dateOfBirth,
        gender: parsed.gender,
        nationality: parsed.nationality ?? null,
        profilePhotoUrl: parsed.profilePhotoUrl ?? null,
        email: parsed.email || null,
        mobileNumber: parsed.mobileNumber || null,
        alternatePhone: parsed.alternatePhone || null,
        emergencyContactName: parsed.emergencyContactName || null,
        emergencyContactPhone: parsed.emergencyContactPhone || null,
        emergencyContactRelation: parsed.emergencyContactRelation || null,
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
// GuardianPhoneNumber. Wrapped in a single transaction so a partial save can't
// leave orphaned guardian rows.
// -----------------------------------------------------------------------------

export async function getStudentPersonalGuardians(
  studentId: string
): Promise<ActionResponse<PersonalGuardianFormData>> {
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) return actionError(ACTION_ERRORS.MISSING_SCHOOL)

    const studentGuardians = await db.studentGuardian.findMany({
      where: { studentId, schoolId },
      include: { guardian: true, guardianType: true },
    })

    const result: PersonalGuardianFormData = {
      fatherFirstName: "",
      fatherLastName: "",
      fatherOccupation: "",
      fatherPhone: "",
      fatherEmail: "",
      motherFirstName: "",
      motherLastName: "",
      motherOccupation: "",
      motherPhone: "",
      motherEmail: "",
    }

    for (const sg of studentGuardians) {
      const typeName = sg.guardianType.name.toLowerCase()
      if (typeName === "father") {
        result.fatherFirstName = sg.guardian.firstName
        result.fatherLastName = sg.guardian.lastName
        result.fatherOccupation = sg.occupation || ""
        result.fatherEmail = sg.guardian.emailAddress || ""
        const phone = await db.guardianPhoneNumber.findFirst({
          where: { guardianId: sg.guardianId, schoolId },
          orderBy: { isPrimary: "desc" },
        })
        result.fatherPhone = phone?.phoneNumber || ""
      } else if (typeName === "mother") {
        result.motherFirstName = sg.guardian.firstName
        result.motherLastName = sg.guardian.lastName
        result.motherOccupation = sg.occupation || ""
        result.motherEmail = sg.guardian.emailAddress || ""
        const phone = await db.guardianPhoneNumber.findFirst({
          where: { guardianId: sg.guardianId, schoolId },
          orderBy: { isPrimary: "desc" },
        })
        result.motherPhone = phone?.phoneNumber || ""
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
    const { schoolId } = await getTenantContext()
    if (!schoolId) return actionError(ACTION_ERRORS.MISSING_SCHOOL)

    const parsed = personalGuardianSchema.parse(input)

    await db.$transaction(async (tx) => {
      if (parsed.fatherFirstName?.trim()) {
        await createOrLinkGuardian(tx, {
          schoolId,
          studentId,
          typeName: "father",
          firstName: parsed.fatherFirstName.trim(),
          lastName: parsed.fatherLastName?.trim() || "",
          email: parsed.fatherEmail?.trim() || null,
          phone: parsed.fatherPhone?.trim() || null,
          occupation: parsed.fatherOccupation?.trim() || null,
          isPrimary: true,
        })
      }

      if (parsed.motherFirstName?.trim()) {
        await createOrLinkGuardian(tx, {
          schoolId,
          studentId,
          typeName: "mother",
          firstName: parsed.motherFirstName.trim(),
          lastName: parsed.motherLastName?.trim() || "",
          email: parsed.motherEmail?.trim() || null,
          phone: parsed.motherPhone?.trim() || null,
          occupation: parsed.motherOccupation?.trim() || null,
          // Mother is the primary contact only if father wasn't provided.
          isPrimary: !parsed.fatherFirstName?.trim(),
        })
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
