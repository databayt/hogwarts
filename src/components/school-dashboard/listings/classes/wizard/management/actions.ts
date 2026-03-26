"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { ACTION_ERRORS, actionError } from "@/lib/action-errors"
import type { ActionResponse } from "@/lib/action-response"
import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"

import { managementSchema, type ManagementFormData } from "./validation"

export async function getClassManagement(
  classId: string
): Promise<ActionResponse<ManagementFormData>> {
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) return actionError(ACTION_ERRORS.MISSING_SCHOOL)

    const cls = await db.class.findFirst({
      where: { id: classId, schoolId },
      select: {
        credits: true,
        minCapacity: true,
        maxCapacity: true,
        prerequisiteId: true,
      },
    })

    if (!cls) return actionError(ACTION_ERRORS.CLASS_NOT_FOUND)

    return {
      success: true,
      data: {
        credits: cls.credits ? Number(cls.credits) : undefined,
        minCapacity: cls.minCapacity ?? undefined,
        maxCapacity: cls.maxCapacity ?? undefined,
        prerequisiteId: cls.prerequisiteId ?? undefined,
      },
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to load",
    }
  }
}

export async function updateClassManagement(
  classId: string,
  input: ManagementFormData
): Promise<ActionResponse> {
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) return actionError(ACTION_ERRORS.MISSING_SCHOOL)

    const parsed = managementSchema.parse(input)

    await db.class.updateMany({
      where: { id: classId, schoolId },
      data: {
        credits: parsed.credits ?? null,
        minCapacity: parsed.minCapacity ?? null,
        maxCapacity: parsed.maxCapacity ?? null,
        prerequisiteId: parsed.prerequisiteId ?? null,
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
