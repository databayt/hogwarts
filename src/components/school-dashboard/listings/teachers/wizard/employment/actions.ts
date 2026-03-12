"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import type { ActionResponse } from "@/lib/action-response"
import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"

import { employmentSchema, type EmploymentFormData } from "./validation"

export async function getTeacherEmployment(
  teacherId: string
): Promise<ActionResponse<EmploymentFormData>> {
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) return { success: false, error: "Missing school context" }

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

    if (!teacher) return { success: false, error: "Teacher not found" }

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
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to load",
    }
  }
}

export async function updateTeacherEmployment(
  teacherId: string,
  input: EmploymentFormData
): Promise<ActionResponse> {
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) return { success: false, error: "Missing school context" }

    const parsed = employmentSchema.parse(input)

    await db.teacher.updateMany({
      where: { id: teacherId, schoolId },
      data: {
        employeeId: parsed.employeeId ?? null,
        joiningDate: parsed.joiningDate ?? null,
        employmentStatus: parsed.employmentStatus,
        employmentType: parsed.employmentType,
        contractStartDate: parsed.contractStartDate ?? null,
        contractEndDate: parsed.contractEndDate ?? null,
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
