"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { revalidatePath } from "next/cache"

import type { ActionResponse } from "@/lib/action-response"
import { db } from "@/lib/db"
import { requireDeveloper } from "@/components/saas-dashboard/lib/operator-auth"

import { catalogAssignmentSchema } from "./assignment-validation"

// ============================================================================
// Assignment CRUD
// ============================================================================

export async function createAssignment(
  data: FormData
): Promise<ActionResponse> {
  try {
    await requireDeveloper()

    const raw = Object.fromEntries(data)
    const tags = data.getAll("tags") as string[]

    const validated = catalogAssignmentSchema.parse({
      ...raw,
      tags,
      totalPoints: raw.totalPoints ? Number(raw.totalPoints) : undefined,
      estimatedTime: raw.estimatedTime ? Number(raw.estimatedTime) : undefined,
    })

    const assignment = await db.assignment.create({
      data: {
        ...validated,
        // Server-controlled: SaaS admin = auto-approved
        approvalStatus: "APPROVED",
        visibility: "PUBLIC",
        status: "PUBLISHED",
      },
    })

    revalidatePath("/catalog/assignments")
    return { success: true, data: { id: assignment.id } }
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to create assignment",
    }
  }
}

export async function updateAssignment(
  id: string,
  data: FormData
): Promise<ActionResponse> {
  try {
    await requireDeveloper()

    const existing = await db.assignment.findUnique({ where: { id } })
    if (!existing) {
      return { success: false, error: "assignment_not_found" }
    }

    const raw = Object.fromEntries(data)
    const tags = data.getAll("tags") as string[]

    const validated = catalogAssignmentSchema.partial().parse({
      ...raw,
      tags: tags.length > 0 ? tags : undefined,
      totalPoints: raw.totalPoints ? Number(raw.totalPoints) : undefined,
      estimatedTime: raw.estimatedTime ? Number(raw.estimatedTime) : undefined,
    })

    // Strip server-controlled fields — prevent client from bypassing review
    const { approvalStatus, visibility, status, ...safeData } = validated

    const assignment = await db.assignment.update({
      where: { id },
      data: safeData,
    })

    revalidatePath("/catalog/assignments")
    return { success: true, data: { id: assignment.id } }
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to update assignment",
    }
  }
}

export async function deleteAssignment(id: string): Promise<ActionResponse> {
  try {
    await requireDeveloper()

    const existing = await db.assignment.findUnique({ where: { id } })
    if (!existing) {
      return { success: false, error: "assignment_not_found" }
    }

    await db.assignment.delete({ where: { id } })

    revalidatePath("/catalog/assignments")
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to delete assignment",
    }
  }
}
