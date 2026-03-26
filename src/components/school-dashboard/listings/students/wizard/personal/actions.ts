"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { cookies } from "next/headers"

import { ACTION_ERRORS, actionError } from "@/lib/action-errors"
import type { ActionResponse } from "@/lib/action-response"
import { db } from "@/lib/db"
import type { NameFormat } from "@/lib/name-utils"
import { getTenantContext } from "@/lib/tenant-context"

import { personalSchema, type PersonalFormData } from "./validation"

export async function getStudentPersonal(
  studentId: string
): Promise<ActionResponse<PersonalFormData & { nameFormat: NameFormat }>> {
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
        nameFormat: (school?.nameFormat as NameFormat) ?? "full",
      },
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to load",
    }
  }
}

export async function updateStudentPersonal(
  studentId: string,
  input: PersonalFormData
): Promise<ActionResponse> {
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) return actionError(ACTION_ERRORS.MISSING_SCHOOL)

    const parsed = personalSchema.parse(input)

    // Detect the language the name was entered in (from current locale)
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
        lang,
      },
    })

    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to save",
    }
  }
}
