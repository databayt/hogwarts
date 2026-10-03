"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { ACTION_ERRORS, actionError } from "@/lib/action-errors"
import type { ActionResponse } from "@/lib/action-response"
import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"

import { employmentSchema, type EmploymentFormData } from "./validation"

export async function getTeacherEmployment(
  teacherId: string
): Promise<ActionResponse<EmploymentFormData>> {
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) return actionError(ACTION_ERRORS.MISSING_SCHOOL)

    const teacher = await db.teacher.findFirst({
      where: { id: teacherId, schoolId },
      select: {
        employeeId: true,
        joiningDate: true,
        employmentStatus: true,
        employmentType: true,
        contractStartDate: true,
        contractEndDate: true,
      },
    })

    if (!teacher) return actionError(ACTION_ERRORS.TEACHER_NOT_FOUND)

    return {
      success: true,
      data: {
        employeeId: teacher.employeeId ?? undefined,
        joiningDate: teacher.joiningDate ?? undefined,
        employmentStatus:
          teacher.employmentStatus as EmploymentFormData["employmentStatus"],
        employmentType:
          teacher.employmentType as EmploymentFormData["employmentType"],
        contractStartDate: teacher.contractStartDate ?? undefined,
        contractEndDate: teacher.contractEndDate ?? undefined,
      },
    }
  } catch (error) {
    console.error("[teacher-wizard]", error)
    return actionError(ACTION_ERRORS.LOAD_FAILED)
  }
}

export async function updateTeacherEmployment(
  teacherId: string,
  input: EmploymentFormData
): Promise<ActionResponse> {
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) return actionError(ACTION_ERRORS.MISSING_SCHOOL)

    const parsed = employmentSchema.parse(input)

    await db.teacher.updateMany({
      where: { id: teacherId, schoolId },
      data: {
        // Blank must be NULL, not "": (schoolId, employeeId) is unique, so
        // the first teacher saved with "" made every later one without an
        // employee number fail at Create.
        employeeId: parsed.employeeId?.trim() || null,
        joiningDate: parsed.joiningDate ?? null,
        employmentStatus: parsed.employmentStatus,
        employmentType: parsed.employmentType,
        contractStartDate: parsed.contractStartDate ?? null,
        contractEndDate: parsed.contractEndDate ?? null,
      },
    })

    return { success: true }
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2002"
    ) {
      return actionError(ACTION_ERRORS.TEACHER_EMPLOYEE_ID_IN_USE)
    }
    console.error("[teacher-wizard]", error)
    return actionError(ACTION_ERRORS.SAVE_FAILED)
  }
}
