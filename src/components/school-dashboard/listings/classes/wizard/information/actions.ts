"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { after } from "next/server"

import { ACTION_ERRORS, actionError } from "@/lib/action-errors"
import type { ActionResponse } from "@/lib/action-response"
import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"
import { prewarm } from "@/components/translation/prewarm"

import { informationSchema, type InformationFormData } from "./validation"

export async function getClassInformation(
  classId: string
): Promise<ActionResponse<InformationFormData>> {
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) return actionError(ACTION_ERRORS.MISSING_SCHOOL)

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

    if (!cls) return actionError(ACTION_ERRORS.CLASS_NOT_FOUND)

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
    if (!schoolId) return actionError(ACTION_ERRORS.MISSING_SCHOOL)

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
      return actionError(ACTION_ERRORS.ALREADY_EXISTS)
    }

    const data = {
      name: parsed.name,
      subjectId: parsed.subjectId,
      teacherId: parsed.teacherId,
      gradeId: parsed.gradeId ?? null,
      courseCode: parsed.courseCode ?? null,
      evaluationType: parsed.evaluationType,
    }
    await db.class.updateMany({ where: { id: classId, schoolId }, data })

    // prewarm reads only registered fields (name) — runs off the response path
    after(() => prewarm("Class", { id: classId, ...data }, { schoolId }))
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to save",
    }
  }
}
