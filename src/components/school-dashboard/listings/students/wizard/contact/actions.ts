"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { ACTION_ERRORS, actionError } from "@/lib/action-errors"
import type { ActionResponse } from "@/lib/action-response"
import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"

import { contactSchema, type ContactFormData } from "./validation"

export async function getStudentContact(
  studentId: string
): Promise<ActionResponse<ContactFormData>> {
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) return actionError(ACTION_ERRORS.MISSING_SCHOOL)

    const student = await db.student.findFirst({
      where: { id: studentId, schoolId },
      select: {
        email: true,
        mobileNumber: true,
        alternatePhone: true,
        emergencyContactName: true,
        emergencyContactPhone: true,
        emergencyContactRelation: true,
      },
    })

    if (!student) return actionError(ACTION_ERRORS.STUDENT_NOT_FOUND)

    return {
      success: true,
      data: {
        email: student.email ?? undefined,
        mobileNumber: student.mobileNumber ?? undefined,
        alternatePhone: student.alternatePhone ?? undefined,
        emergencyContactName: student.emergencyContactName ?? undefined,
        emergencyContactPhone: student.emergencyContactPhone ?? undefined,
        emergencyContactRelation: student.emergencyContactRelation ?? undefined,
      },
    }
  } catch (error) {
    return actionError(
      ACTION_ERRORS.LOAD_FAILED,
      error instanceof Error ? error.message : undefined
    )
  }
}

export async function updateStudentContact(
  studentId: string,
  input: ContactFormData
): Promise<ActionResponse> {
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) return actionError(ACTION_ERRORS.MISSING_SCHOOL)

    const parsed = contactSchema.parse(input)

    await db.student.updateMany({
      where: { id: studentId, schoolId },
      data: {
        email: parsed.email || null,
        mobileNumber: parsed.mobileNumber || null,
        alternatePhone: parsed.alternatePhone || null,
        emergencyContactName: parsed.emergencyContactName || null,
        emergencyContactPhone: parsed.emergencyContactPhone || null,
        emergencyContactRelation: parsed.emergencyContactRelation || null,
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
