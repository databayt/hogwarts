"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { revalidatePath } from "next/cache"

import type { ActionResponse } from "@/lib/action-response"
import { db } from "@/lib/db"
import { requireDeveloper } from "@/components/saas-dashboard/lib/operator-auth"

import { catalogAssignmentSchema } from "./assignment-validation"

// ============================================================================
// CatalogAssignment CRUD
// ============================================================================

export async function createCatalogAssignment(
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

    const assignment = await db.catalogAssignment.create({
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

export async function updateCatalogAssignment(
  id: string,
  data: FormData
): Promise<ActionResponse> {
  try {
    await requireDeveloper()

    const existing = await db.catalogAssignment.findUnique({ where: { id } })
    if (!existing) {
      return { success: false, error: "Assignment not found" }
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

    const assignment = await db.catalogAssignment.update({
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

export async function deleteCatalogAssignment(
  id: string
): Promise<ActionResponse> {
  try {
    await requireDeveloper()

    const existing = await db.catalogAssignment.findUnique({ where: { id } })
    if (!existing) {
      return { success: false, error: "Assignment not found" }
    }

    await db.catalogAssignment.delete({ where: { id } })

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
