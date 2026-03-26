"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { ACTION_ERRORS, actionError } from "@/lib/action-errors"
import type { ActionResponse } from "@/lib/action-response"
import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"

import { informationSchema, type InformationFormData } from "./validation"

export async function getParentInformation(
  parentId: string
): Promise<ActionResponse<InformationFormData>> {
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) return actionError(ACTION_ERRORS.MISSING_SCHOOL)

    const guardian = await db.guardian.findFirst({
      where: { id: parentId, schoolId },
      select: {
        firstName: true,
        lastName: true,
        emailAddress: true,
        profilePhotoUrl: true,
      },
    })

    if (!guardian) return actionError(ACTION_ERRORS.PARENT_NOT_FOUND)

    return {
      success: true,
      data: {
        firstName: guardian.firstName,
        lastName: guardian.lastName,
        emailAddress: guardian.emailAddress ?? undefined,
        profilePhotoUrl: guardian.profilePhotoUrl ?? undefined,
      },
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to load",
    }
  }
}

export async function updateParentInformation(
  parentId: string,
  input: InformationFormData
): Promise<ActionResponse> {
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) return actionError(ACTION_ERRORS.MISSING_SCHOOL)

    const parsed = informationSchema.parse(input)

    await db.guardian.updateMany({
      where: { id: parentId, schoolId },
      data: {
        firstName: parsed.firstName,
        lastName: parsed.lastName,
        emailAddress: parsed.emailAddress || null,
        profilePhotoUrl: parsed.profilePhotoUrl ?? null,
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
