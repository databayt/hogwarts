"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { revalidatePath } from "next/cache"

import type { ActionResponse } from "@/lib/action-response"
import { db } from "@/lib/db"
import { requireDeveloper } from "@/components/saas-dashboard/lib/operator-auth"

import { catalogMaterialSchema } from "./material-validation"

// ============================================================================
// CatalogMaterial CRUD
// ============================================================================

export async function createCatalogMaterial(
  data: FormData
): Promise<ActionResponse> {
  try {
    await requireDeveloper()

    const raw = Object.fromEntries(data)
    const tags = data.getAll("tags") as string[]

    const validated = catalogMaterialSchema.parse({
      ...raw,
      tags,
      fileSize: raw.fileSize ? Number(raw.fileSize) : undefined,
      pageCount: raw.pageCount ? Number(raw.pageCount) : undefined,
    })

    const material = await db.catalogMaterial.create({
      data: {
        ...validated,
        // Server-controlled: SaaS admin = auto-approved
        approvalStatus: "APPROVED",
        visibility: "PUBLIC",
        status: "PUBLISHED",
      },
    })

    revalidatePath("/catalog/materials")
    return { success: true, data: { id: material.id } }
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to create material",
    }
  }
}

export async function updateCatalogMaterial(
  id: string,
  data: FormData
): Promise<ActionResponse> {
  try {
    await requireDeveloper()

    const existing = await db.catalogMaterial.findUnique({ where: { id } })
    if (!existing) {
      return { success: false, error: "Material not found" }
    }

    const raw = Object.fromEntries(data)
    const tags = data.getAll("tags") as string[]

    const validated = catalogMaterialSchema.partial().parse({
      ...raw,
      tags: tags.length > 0 ? tags : undefined,
      fileSize: raw.fileSize ? Number(raw.fileSize) : undefined,
      pageCount: raw.pageCount ? Number(raw.pageCount) : undefined,
    })

    // Strip server-controlled fields — prevent client from bypassing review
    const { approvalStatus, visibility, status, ...safeData } = validated

    const material = await db.catalogMaterial.update({
      where: { id },
      data: safeData,
    })

    revalidatePath("/catalog/materials")
    return { success: true, data: { id: material.id } }
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to update material",
    }
  }
}

export async function deleteCatalogMaterial(
  id: string
): Promise<ActionResponse> {
  try {
    await requireDeveloper()

    const existing = await db.catalogMaterial.findUnique({ where: { id } })
    if (!existing) {
      return { success: false, error: "Material not found" }
    }

    await db.catalogMaterial.delete({ where: { id } })

    revalidatePath("/catalog/materials")
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to delete material",
    }
  }
}
