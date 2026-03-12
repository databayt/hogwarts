"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import type { ActionResponse } from "@/lib/action-response"
import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"

import { emergencySchema, type EmergencyFormData } from "./validation"

export async function getStudentEmergency(
  studentId: string
): Promise<ActionResponse<EmergencyFormData>> {
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) return { success: false, error: "Missing school context" }

    const student = await db.student.findFirst({
      where: { id: studentId, schoolId },
      select: {
        emergencyContactName: true,
        emergencyContactPhone: true,
        emergencyContactRelation: true,
      },
    })

    if (!student) return { success: false, error: "Student not found" }

    return {
      success: true,
      data: {
        emergencyContactName: student.emergencyContactName ?? undefined,
        emergencyContactPhone: student.emergencyContactPhone ?? undefined,
        emergencyContactRelation: student.emergencyContactRelation ?? undefined,
      },
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to load",
    }
  }
}

export async function updateStudentEmergency(
  studentId: string,
  input: EmergencyFormData
): Promise<ActionResponse> {
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) return { success: false, error: "Missing school context" }

    const parsed = emergencySchema.parse(input)

    await db.student.updateMany({
      where: { id: studentId, schoolId },
      data: {
        emergencyContactName: parsed.emergencyContactName || null,
        emergencyContactPhone: parsed.emergencyContactPhone || null,
        emergencyContactRelation: parsed.emergencyContactRelation || null,
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
