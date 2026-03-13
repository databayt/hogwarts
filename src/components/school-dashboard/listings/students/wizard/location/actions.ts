"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import type { ActionResponse } from "@/lib/action-response"
import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"

import { locationSchema, type LocationFormData } from "./validation"

export async function getStudentLocation(
  studentId: string
): Promise<ActionResponse<LocationFormData>> {
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) return { success: false, error: "Missing school context" }

    const student = await db.student.findFirst({
      where: { id: studentId, schoolId },
      select: {
        currentAddress: true,
        city: true,
        state: true,
        postalCode: true,
        country: true,
      },
    })

    if (!student) return { success: false, error: "Student not found" }

    return {
      success: true,
      data: {
        currentAddress: student.currentAddress ?? undefined,
        city: student.city ?? undefined,
        state: student.state ?? undefined,
        postalCode: student.postalCode ?? undefined,
        country: student.country ?? undefined,
      },
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to load",
    }
  }
}

export async function updateStudentLocation(
  studentId: string,
  input: LocationFormData
): Promise<ActionResponse> {
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) return { success: false, error: "Missing school context" }

    const parsed = locationSchema.parse(input)

    await db.student.updateMany({
      where: { id: studentId, schoolId },
      data: {
        currentAddress: parsed.currentAddress || null,
        city: parsed.city || null,
        state: parsed.state || null,
        postalCode: parsed.postalCode || null,
        country: parsed.country || null,
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
