"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { revalidatePath } from "next/cache"

import type { ActionResponse } from "@/lib/action-response"
import { db } from "@/lib/db"
import { requireDeveloper } from "@/components/saas-dashboard/lib/operator-auth"

import { catalogQuestionSchema } from "./question-validation"

// ============================================================================
// CatalogQuestion CRUD
// ============================================================================

export async function createCatalogQuestion(
  data: FormData
): Promise<ActionResponse> {
  try {
    await requireDeveloper()

    const raw = Object.fromEntries(data)
    const tags = data.getAll("tags") as string[]

    let parsedOptions: unknown
    if (raw.options) {
      try {
        parsedOptions = JSON.parse(raw.options as string)
      } catch {
        return { success: false, error: "Invalid options JSON" }
      }
    }

    const validated = catalogQuestionSchema.parse({
      ...raw,
      tags,
      points: raw.points ? Number(raw.points) : 1,
      options: parsedOptions,
    })

    const question = await db.catalogQuestion.create({
      data: {
        ...validated,
        // Server-controlled: SaaS admin = auto-approved
        approvalStatus: "APPROVED",
        visibility: "PUBLIC",
        status: "PUBLISHED",
      },
    })

    revalidatePath("/catalog/questions")
    return { success: true, data: { id: question.id } }
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to create question",
    }
  }
}

export async function updateCatalogQuestion(
  id: string,
  data: FormData
): Promise<ActionResponse> {
  try {
    await requireDeveloper()

    const existing = await db.catalogQuestion.findUnique({ where: { id } })
    if (!existing) {
      return { success: false, error: "Question not found" }
    }

    const raw = Object.fromEntries(data)
    const tags = data.getAll("tags") as string[]

    let parsedOptions: unknown
    if (raw.options) {
      try {
        parsedOptions = JSON.parse(raw.options as string)
      } catch {
        return { success: false, error: "Invalid options JSON" }
      }
    }

    const validated = catalogQuestionSchema.partial().parse({
      ...raw,
      tags: tags.length > 0 ? tags : undefined,
      points: raw.points ? Number(raw.points) : undefined,
      options: parsedOptions,
    })

    const question = await db.catalogQuestion.update({
      where: { id },
      data: {
        ...validated,
        // Never allow client to override approvalStatus via update
        approvalStatus: undefined,
      },
    })

    revalidatePath("/catalog/questions")
    return { success: true, data: { id: question.id } }
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to update question",
    }
  }
}

export async function deleteCatalogQuestion(
  id: string
): Promise<ActionResponse> {
  try {
    await requireDeveloper()

    const existing = await db.catalogQuestion.findUnique({ where: { id } })
    if (!existing) {
      return { success: false, error: "Question not found" }
    }

    await db.catalogQuestion.delete({ where: { id } })

    revalidatePath("/catalog/questions")
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to delete question",
    }
  }
}
