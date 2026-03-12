"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { revalidatePath } from "next/cache"
import { auth } from "@/auth"

import type { ActionResponse } from "@/lib/action-response"
import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"

import type { ParentWizardData } from "./use-parent-wizard"

/** Fetch full guardian data for the wizard */
export async function getParentForWizard(
  parentId: string
): Promise<
  { success: true; data: ParentWizardData } | { success: false; error: string }
> {
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) return { success: false, error: "Missing school context" }

    const guardian = await db.guardian.findFirst({
      where: { id: parentId, schoolId },
      include: {
        phoneNumbers: {
          where: { schoolId },
          select: {
            id: true,
            phoneNumber: true,
            phoneType: true,
            isPrimary: true,
          },
        },
      },
    })

    if (!guardian) return { success: false, error: "Guardian not found" }

    return { success: true, data: guardian as ParentWizardData }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to load guardian",
    }
  }
}

/** Create a draft guardian record to start the wizard */
export async function createDraftParent(): Promise<
  ActionResponse<{ id: string }>
> {
  try {
    const session = await auth()
    if (!session?.user) {
      return { success: false, error: "Not authenticated" }
    }

    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return { success: false, error: "Missing school context" }
    }

    const guardian = await db.guardian.create({
      data: {
        schoolId,
        givenName: "",
        surname: "",
        wizardStep: "information",
      },
    })

    return { success: true, data: { id: guardian.id } }
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to create guardian",
    }
  }
}

/** Mark the parent wizard as complete */
export async function completeParentWizard(
  parentId: string
): Promise<ActionResponse> {
  try {
    const session = await auth()
    if (!session?.user) {
      return { success: false, error: "Not authenticated" }
    }

    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return { success: false, error: "Missing school context" }
    }

    // Validate required fields are present
    const guardian = await db.guardian.findFirst({
      where: { id: parentId, schoolId },
      select: { givenName: true, surname: true },
    })

    if (!guardian) {
      return { success: false, error: "Guardian not found" }
    }

    if (!guardian.givenName || !guardian.surname) {
      return {
        success: false,
        error: "Name is required before completing",
      }
    }

    await db.guardian.updateMany({
      where: { id: parentId, schoolId },
      data: { wizardStep: null },
    })

    revalidatePath("/parents")
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to complete parent wizard",
    }
  }
}

/** Update the current wizard step for resumability */
export async function updateParentWizardStep(
  parentId: string,
  step: string
): Promise<void> {
  try {
    const session = await auth()
    if (!session?.user) return

    const { schoolId } = await getTenantContext()
    if (!schoolId) return

    await db.guardian.updateMany({
      where: { id: parentId, schoolId },
      data: { wizardStep: step },
    })
  } catch {
    // Non-critical, don't throw
  }
}

/** Delete an abandoned draft guardian */
export async function deleteDraftParent(
  parentId: string
): Promise<ActionResponse> {
  try {
    const session = await auth()
    if (!session?.user) {
      return { success: false, error: "Not authenticated" }
    }

    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return { success: false, error: "Missing school context" }
    }

    // Atomic delete — only if it's still a draft
    const { count } = await db.guardian.deleteMany({
      where: { id: parentId, schoolId, wizardStep: { not: null } },
    })

    if (count === 0) {
      return { success: false, error: "Draft guardian not found" }
    }

    return { success: true }
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to delete draft guardian",
    }
  }
}
