"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import type { ActionResponse } from "@/lib/action-response"
import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"

import { locationSchema, type LocationFormData } from "./validation"

export async function getTeacherLocation(
  teacherId: string
): Promise<ActionResponse<LocationFormData>> {
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) return { success: false, error: "Missing school context" }

    const teacher = await db.teacher.findFirst({
      where: { id: teacherId, schoolId },
      select: {
        currentAddress: true,
        city: true,
        state: true,
        postalCode: true,
        country: true,
      },
    })

    if (!teacher) return { success: false, error: "Teacher not found" }

    return {
      success: true,
      data: {
        currentAddress: teacher.currentAddress ?? undefined,
        city: teacher.city ?? undefined,
        state: teacher.state ?? undefined,
        postalCode: teacher.postalCode ?? undefined,
        country: teacher.country ?? undefined,
      },
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to load",
    }
  }
}

export async function updateTeacherLocation(
  teacherId: string,
  input: LocationFormData
): Promise<ActionResponse> {
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) return { success: false, error: "Missing school context" }

    const parsed = locationSchema.parse(input)

    await db.teacher.updateMany({
      where: { id: teacherId, schoolId },
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
