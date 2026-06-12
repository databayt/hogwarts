"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { revalidatePath } from "next/cache"

import type { ActionResponse } from "@/lib/action-response"
import { db } from "@/lib/db"
import { requireDeveloper } from "@/components/saas-dashboard/lib/operator-auth"

import { catalogBookSchema } from "./book-validation"

// ============================================================================
// Book CRUD
// ============================================================================

export async function createBook(
  data: FormData
): Promise<ActionResponse<{ id: string }>> {
  try {
    await requireDeveloper()

    const raw = Object.fromEntries(data)
    const tags = data.getAll("tags") as string[]

    const validated = catalogBookSchema.parse({
      ...raw,
      tags: tags.length > 0 ? tags : [],
      publicationYear: raw.publicationYear
        ? Number(raw.publicationYear)
        : undefined,
      pageCount: raw.pageCount ? Number(raw.pageCount) : undefined,
      digitalFileSize: raw.digitalFileSize
        ? Number(raw.digitalFileSize)
        : undefined,
    })

    const book = await db.book.create({
      data: {
        ...validated,
        approvalStatus: "APPROVED",
        visibility: "PUBLIC",
        status: "PUBLISHED",
      },
    })

    revalidatePath("/catalog/books")
    return { success: true, data: { id: book.id } }
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to create catalog book",
    }
  }
}

export async function updateBook(
  id: string,
  data: FormData
): Promise<ActionResponse<{ id: string }>> {
  try {
    await requireDeveloper()

    const existing = await db.book.findUnique({ where: { id } })
    if (!existing) {
      return { success: false, error: "catalog_book_not_found" }
    }

    const raw = Object.fromEntries(data)
    const tags = data.getAll("tags") as string[]

    const validated = catalogBookSchema.partial().parse({
      ...raw,
      tags: tags.length > 0 ? tags : undefined,
      publicationYear: raw.publicationYear
        ? Number(raw.publicationYear)
        : undefined,
      pageCount: raw.pageCount ? Number(raw.pageCount) : undefined,
      digitalFileSize: raw.digitalFileSize
        ? Number(raw.digitalFileSize)
        : undefined,
    })

    // Strip server-controlled fields — prevent client from bypassing review
    const { approvalStatus, visibility, status, ...safeData } = validated

    const book = await db.book.update({
      where: { id },
      data: safeData,
    })

    revalidatePath("/catalog/books")
    revalidatePath(`/catalog/books/${id}`)
    return { success: true, data: { id: book.id } }
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to update catalog book",
    }
  }
}

export async function deleteBook(id: string): Promise<ActionResponse> {
  try {
    await requireDeveloper()

    const existing = await db.book.findUnique({ where: { id } })
    if (!existing) {
      return { success: false, error: "catalog_book_not_found" }
    }

    await db.book.delete({ where: { id } })

    revalidatePath("/catalog/books")
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to delete catalog book",
    }
  }
}
