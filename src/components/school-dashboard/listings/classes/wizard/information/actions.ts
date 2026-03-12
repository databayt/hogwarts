"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import type { ActionResponse } from "@/lib/action-response"
import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"

import { informationSchema, type InformationFormData } from "./validation"

export async function getClassInformation(
  classId: string
): Promise<ActionResponse<InformationFormData>> {
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) return { success: false, error: "Missing school context" }

    const cls = await db.class.findFirst({
      where: { id: classId, schoolId },
      select: {
        name: true,
        subjectId: true,
        teacherId: true,
        gradeId: true,
        courseCode: true,
        evaluationType: true,
      },
    })

    if (!cls) return { success: false, error: "Class not found" }

    return {
      success: true,
      data: {
        name: cls.name,
        subjectId: cls.subjectId,
        teacherId: cls.teacherId,
        gradeId: cls.gradeId ?? undefined,
        courseCode: cls.courseCode ?? undefined,
        evaluationType:
          cls.evaluationType as InformationFormData["evaluationType"],
      },
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to load",
    }
  }
}

export async function updateClassInformation(
  classId: string,
  input: InformationFormData
): Promise<ActionResponse> {
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) return { success: false, error: "Missing school context" }

    const parsed = informationSchema.parse(input)

    // Check uniqueness of name within school (excluding current class)
    const existing = await db.class.findFirst({
      where: {
        schoolId,
        name: parsed.name,
        id: { not: classId },
      },
      select: { id: true },
    })

    if (existing) {
      return { success: false, error: "A class with this name already exists" }
    }

    await db.class.updateMany({
      where: { id: classId, schoolId },
      data: {
        name: parsed.name,
        subjectId: parsed.subjectId,
        teacherId: parsed.teacherId,
        gradeId: parsed.gradeId ?? null,
        courseCode: parsed.courseCode ?? null,
        evaluationType: parsed.evaluationType,
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
