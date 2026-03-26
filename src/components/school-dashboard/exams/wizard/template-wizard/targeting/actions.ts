"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { revalidatePath } from "next/cache"
import { auth } from "@/auth"

import { ACTION_ERRORS, actionError } from "@/lib/action-errors"
import type { ActionResponse } from "@/lib/action-response"
import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"

import type { TargetingFormData } from "./validation"

export async function getGradeOptions(): Promise<
  ActionResponse<{ id: string; name: string }[]>
> {
  try {
    const session = await auth()
    if (!session?.user) {
      return actionError(ACTION_ERRORS.NOT_AUTHENTICATED)
    }

    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return actionError(ACTION_ERRORS.MISSING_SCHOOL)
    }

    const grades = await db.academicGrade.findMany({
      where: { schoolId },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    })

    return { success: true, data: grades }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch grades",
    }
  }
}

export async function getSectionOptions(
  gradeIds: string[]
): Promise<ActionResponse<{ id: string; name: string }[]>> {
  try {
    const session = await auth()
    if (!session?.user) {
      return actionError(ACTION_ERRORS.NOT_AUTHENTICATED)
    }

    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return actionError(ACTION_ERRORS.MISSING_SCHOOL)
    }

    const sections = await db.section.findMany({
      where: {
        schoolId,
        ...(gradeIds.length > 0 ? { gradeId: { in: gradeIds } } : {}),
      },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    })

    return { success: true, data: sections }
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to fetch sections",
    }
  }
}

export async function getClassroomOptions(
  gradeIds: string[]
): Promise<ActionResponse<{ id: string; name: string }[]>> {
  try {
    const session = await auth()
    if (!session?.user) {
      return actionError(ACTION_ERRORS.NOT_AUTHENTICATED)
    }

    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return actionError(ACTION_ERRORS.MISSING_SCHOOL)
    }

    const classrooms = await db.classroom.findMany({
      where: {
        schoolId,
        ...(gradeIds.length > 0 ? { gradeId: { in: gradeIds } } : {}),
      },
      select: { id: true, roomName: true },
      orderBy: { roomName: "asc" },
    })

    return {
      success: true,
      data: classrooms.map((c) => ({ id: c.id, name: c.roomName })),
    }
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to fetch classrooms",
    }
  }
}

export async function updateTemplateTargeting(
  templateId: string,
  data: TargetingFormData
): Promise<ActionResponse> {
  try {
    const session = await auth()
    if (!session?.user) {
      return actionError(ACTION_ERRORS.NOT_AUTHENTICATED)
    }

    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return actionError(ACTION_ERRORS.MISSING_SCHOOL)
    }

    const existing = await db.examTemplate.findFirst({
      where: { id: templateId, schoolId },
      select: { id: true },
    })

    if (!existing) {
      return actionError(ACTION_ERRORS.NOT_FOUND)
    }

    await db.examTemplate.updateMany({
      where: { id: templateId, schoolId },
      data: {
        gradeIds: data.gradeIds,
        sectionIds: data.sectionIds,
        classroomIds: data.classroomIds,
        wizardStep: "targeting",
      },
    })

    revalidatePath("/exams/generate")
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to update targeting",
    }
  }
}
