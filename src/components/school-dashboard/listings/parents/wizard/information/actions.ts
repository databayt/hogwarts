"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import type { ActionResponse } from "@/lib/action-response"
import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"

import { informationSchema, type InformationFormData } from "./validation"

export async function getParentInformation(
  parentId: string
): Promise<ActionResponse<InformationFormData>> {
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) return { success: false, error: "Missing school context" }

    const guardian = await db.guardian.findFirst({
      where: { id: parentId, schoolId },
      select: {
        givenName: true,
        surname: true,
        emailAddress: true,
        profilePhotoUrl: true,
      },
    })

    if (!guardian) return { success: false, error: "Guardian not found" }

    return {
      success: true,
      data: {
        givenName: guardian.givenName,
        surname: guardian.surname,
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
    if (!schoolId) return { success: false, error: "Missing school context" }

    const parsed = informationSchema.parse(input)

    await db.guardian.updateMany({
      where: { id: parentId, schoolId },
      data: {
        givenName: parsed.givenName,
        surname: parsed.surname,
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
