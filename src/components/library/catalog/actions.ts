"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { revalidatePath } from "next/cache"
import { auth } from "@/auth"
import { z } from "zod"

import type { ActionResponse } from "@/lib/action-response"
import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"

// ============================================================================
// Validation
// ============================================================================

const updateSelectionSchema = z
  .object({
    totalCopies: z.number().int().positive().optional(),
    availableCopies: z.number().int().nonnegative().optional(),
    shelfLocation: z.string().optional(),
    customName: z.string().optional(),
    gradeId: z.string().nullable().optional(),
    isActive: z.boolean().optional(),
  })
  .strict()

// ============================================================================
// Authorization helper — ADMIN or DEVELOPER, requires schoolId
// ============================================================================

async function requireSchoolAdmin() {
  const session = await auth()
  const role = session?.user?.role
  if (role !== "ADMIN" && role !== "DEVELOPER") {
    throw new Error("Unauthorized: ADMIN or DEVELOPER role required")
  }
  const { schoolId } = await getTenantContext()
  if (!schoolId) {
    throw new Error("Missing school context")
  }
  return { session, schoolId }
}

// ============================================================================
// Select a catalog book (add to school library)
// ============================================================================

export async function selectBook(
  catalogBookId: string,
  totalCopies: number,
  shelfLocation?: string
): Promise<ActionResponse> {
  try {
    const { schoolId } = await requireSchoolAdmin()

    // Check if already selected
    const existing = await db.bookSelection.findFirst({
      where: { schoolId, catalogBookId },
    })

    if (existing) {
      return { success: false, error: "Book already in library" }
    }

    // Get catalog book data
    const catalogBook = await db.book.findUnique({
      where: { id: catalogBookId },
      select: {
        title: true,
        author: true,
        genre: true,
        description: true,
        summary: true,
        coverUrl: true,
        coverColor: true,
        rating: true,
        videoUrl: true,
        isbn: true,
        publisher: true,
        publicationYear: true,
        language: true,
        pageCount: true,
        gradeLevel: true,
      },
    })

    if (!catalogBook) {
      return { success: false, error: "Catalog book not found" }
    }

    // Create selection + school Book + update usage count in a single transaction
    await db.$transaction(async (tx) => {
      await tx.bookSelection.create({
        data: {
          schoolId,
          catalogBookId,
          totalCopies,
          availableCopies: totalCopies,
          shelfLocation: shelfLocation || null,
          isActive: true,
        },
      })

      await tx.schoolBook.create({
        data: {
          schoolId,
          catalogBookId,
          title: catalogBook.title,
          author: catalogBook.author,
          genre: catalogBook.genre,
          description: catalogBook.description ?? "",
          summary: catalogBook.summary ?? "",
          coverUrl: catalogBook.coverUrl ?? "",
          coverColor: catalogBook.coverColor,
          rating: Math.round(catalogBook.rating),
          totalCopies,
          availableCopies: totalCopies,
          videoUrl: catalogBook.videoUrl,
          isbn: catalogBook.isbn,
          publisher: catalogBook.publisher,
          publicationYear: catalogBook.publicationYear,
          language: catalogBook.language,
          pageCount: catalogBook.pageCount,
          gradeLevel: catalogBook.gradeLevel,
        },
      })

      const usageCount = await tx.bookSelection.count({
        where: { catalogBookId },
      })
      await tx.book.update({
        where: { id: catalogBookId },
        data: { usageCount },
      })
    })

    revalidatePath("/library/catalog")
    revalidatePath("/library/books")
    revalidatePath("/library/admin/books")
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to select catalog book",
    }
  }
}

// ============================================================================
// Deselect a catalog book (remove from school library)
// ============================================================================

export async function deselectBook(
  catalogBookId: string
): Promise<ActionResponse> {
  try {
    const { schoolId } = await requireSchoolAdmin()

    const existing = await db.bookSelection.findFirst({
      where: { schoolId, catalogBookId },
    })

    if (!existing) {
      return { success: false, error: "Selection not found" }
    }

    // Delete selection, unlink books, and update usage count in a single transaction
    await db.$transaction(async (tx) => {
      await tx.bookSelection.delete({ where: { id: existing.id } })

      // Unlink school books but don't delete (they may have borrow records)
      await tx.schoolBook.updateMany({
        where: { schoolId, catalogBookId },
        data: { catalogBookId: null },
      })

      const usageCount = await tx.bookSelection.count({
        where: { catalogBookId },
      })
      await tx.book.update({
        where: { id: catalogBookId },
        data: { usageCount },
      })
    })

    revalidatePath("/library/catalog")
    revalidatePath("/library/books")
    revalidatePath("/library/admin/books")
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to deselect catalog book",
    }
  }
}

// ============================================================================
// Update a book selection (copies, location)
// ============================================================================

export async function updateBookSelection(
  selectionId: string,
  data: z.infer<typeof updateSelectionSchema>
): Promise<ActionResponse> {
  try {
    const { schoolId } = await requireSchoolAdmin()

    const validated = updateSelectionSchema.parse(data)

    const selection = await db.bookSelection.findFirst({
      where: { id: selectionId, schoolId },
    })

    if (!selection) {
      return { success: false, error: "Selection not found" }
    }

    await db.bookSelection.update({
      where: { id: selectionId },
      data: validated,
    })

    revalidatePath("/library/catalog")
    revalidatePath("/library/books")
    revalidatePath("/library/admin/books")
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to update book selection",
    }
  }
}

// ============================================================================
// Toggle a book selection active/inactive
// ============================================================================

export async function toggleBookSelection(
  catalogBookId: string,
  isActive: boolean
): Promise<ActionResponse> {
  try {
    const { schoolId } = await requireSchoolAdmin()

    const selection = await db.bookSelection.findFirst({
      where: { schoolId, catalogBookId },
    })

    if (!selection) {
      return { success: false, error: "Selection not found" }
    }

    await db.bookSelection.update({
      where: { id: selection.id },
      data: { isActive },
    })

    revalidatePath("/library/catalog")
    revalidatePath("/library/books")
    revalidatePath("/library/admin/books")
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to toggle book selection",
    }
  }
}
