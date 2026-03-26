"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { ACTION_ERRORS, actionError } from "@/lib/action-errors"
import type { ActionResponse } from "@/lib/action-response"
import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"

import { healthSchema, type HealthFormData } from "./validation"

export async function getStudentHealth(
  studentId: string
): Promise<ActionResponse<HealthFormData>> {
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) return actionError(ACTION_ERRORS.MISSING_SCHOOL)

    const student = await db.student.findFirst({
      where: { id: studentId, schoolId },
      select: {
        medicalConditions: true,
        allergies: true,
        medicationRequired: true,
        doctorName: true,
        doctorContact: true,
        insuranceProvider: true,
        insuranceNumber: true,
        bloodGroup: true,
      },
    })

    if (!student) return actionError(ACTION_ERRORS.STUDENT_NOT_FOUND)

    return {
      success: true,
      data: {
        medicalConditions: student.medicalConditions ?? undefined,
        allergies: student.allergies ?? undefined,
        medicationRequired: student.medicationRequired ?? undefined,
        doctorName: student.doctorName ?? undefined,
        doctorContact: student.doctorContact ?? undefined,
        insuranceProvider: student.insuranceProvider ?? undefined,
        insuranceNumber: student.insuranceNumber ?? undefined,
        bloodGroup: student.bloodGroup ?? undefined,
      },
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to load",
    }
  }
}

export async function updateStudentHealth(
  studentId: string,
  input: HealthFormData
): Promise<ActionResponse> {
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) return actionError(ACTION_ERRORS.MISSING_SCHOOL)

    const parsed = healthSchema.parse(input)

    await db.student.updateMany({
      where: { id: studentId, schoolId },
      data: {
        medicalConditions: parsed.medicalConditions || null,
        allergies: parsed.allergies || null,
        medicationRequired: parsed.medicationRequired || null,
        doctorName: parsed.doctorName || null,
        doctorContact: parsed.doctorContact || null,
        insuranceProvider: parsed.insuranceProvider || null,
        insuranceNumber: parsed.insuranceNumber || null,
        bloodGroup: parsed.bloodGroup || null,
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
