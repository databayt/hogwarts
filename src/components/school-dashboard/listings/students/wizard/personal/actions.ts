"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import type { ActionResponse } from "@/lib/action-response"
import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"

import { personalSchema, type PersonalFormData } from "./validation"

export async function getStudentPersonal(
  studentId: string
): Promise<ActionResponse<PersonalFormData>> {
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) return { success: false, error: "Missing school context" }

    const student = await db.student.findFirst({
      where: { id: studentId, schoolId },
      select: {
        givenName: true,
        middleName: true,
        surname: true,
        dateOfBirth: true,
        gender: true,
        nationality: true,
        profilePhotoUrl: true,
      },
    })

    if (!student) return { success: false, error: "Student not found" }

    return {
      success: true,
      data: {
        givenName: student.givenName,
        middleName: student.middleName ?? undefined,
        surname: student.surname,
        dateOfBirth: student.dateOfBirth,
        gender: student.gender as "male" | "female",
        nationality: student.nationality ?? undefined,
        profilePhotoUrl: student.profilePhotoUrl ?? undefined,
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
    if (!schoolId) return { success: false, error: "Missing school context" }

    const parsed = personalSchema.parse(input)

    await db.student.updateMany({
      where: { id: studentId, schoolId },
      data: {
        givenName: parsed.givenName,
        middleName: parsed.middleName ?? null,
        surname: parsed.surname,
        dateOfBirth: parsed.dateOfBirth,
        gender: parsed.gender,
        nationality: parsed.nationality ?? null,
        profilePhotoUrl: parsed.profilePhotoUrl ?? null,
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
