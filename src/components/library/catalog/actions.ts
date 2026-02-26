"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { revalidatePath } from "next/cache"
import { auth } from "@/auth"

import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"

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

export async function selectCatalogBook(
  catalogBookId: string,
  totalCopies: number,
  shelfLocation?: string
) {
  const { schoolId } = await requireSchoolAdmin()

  // Check if already selected
  const existing = await db.schoolBookSelection.findFirst({
    where: { schoolId, catalogBookId },
  })

  if (existing) {
    return { success: false, error: "Book already in library" }
  }

  // Get catalog book data
  const catalogBook = await db.catalogBook.findUnique({
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
    },
  })

  if (!catalogBook) {
    return { success: false, error: "Catalog book not found" }
  }

  // Create selection + school Book in a transaction
  await db.$transaction([
    db.schoolBookSelection.create({
      data: {
        schoolId,
        catalogBookId,
        totalCopies,
        availableCopies: totalCopies,
        shelfLocation: shelfLocation || null,
        isActive: true,
      },
    }),
    db.book.create({
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
      },
    }),
  ])

  // Update usage count
  const usageCount = await db.schoolBookSelection.count({
    where: { catalogBookId },
  })
  await db.catalogBook.update({
    where: { id: catalogBookId },
    data: { usageCount },
  })

  revalidatePath("/library/catalog")
  revalidatePath("/library/books")
  revalidatePath("/library/admin/books")
  return { success: true }
}

// ============================================================================
// Deselect a catalog book (remove from school library)
// ============================================================================

export async function deselectCatalogBook(catalogBookId: string) {
  const { schoolId } = await requireSchoolAdmin()

  // Delete selection
  const existing = await db.schoolBookSelection.findFirst({
    where: { schoolId, catalogBookId },
  })

  if (!existing) {
    return { success: false, error: "Selection not found" }
  }

  await db.$transaction([
    db.schoolBookSelection.delete({ where: { id: existing.id } }),
    // Unlink books but don't delete (they may have borrow records)
    db.book.updateMany({
      where: { schoolId, catalogBookId },
      data: { catalogBookId: null },
    }),
  ])

  // Update usage count
  const usageCount = await db.schoolBookSelection.count({
    where: { catalogBookId },
  })
  await db.catalogBook.update({
    where: { id: catalogBookId },
    data: { usageCount },
  })

  revalidatePath("/library/catalog")
  revalidatePath("/library/books")
  revalidatePath("/library/admin/books")
  return { success: true }
}

// ============================================================================
// Update a book selection (copies, location)
// ============================================================================

export async function updateBookSelection(
  selectionId: string,
  data: {
    totalCopies?: number
    availableCopies?: number
    shelfLocation?: string
  }
) {
  const { schoolId } = await requireSchoolAdmin()

  const selection = await db.schoolBookSelection.findFirst({
    where: { id: selectionId, schoolId },
  })

  if (!selection) {
    throw new Error("Selection not found")
  }

  await db.schoolBookSelection.update({
    where: { id: selectionId },
    data,
  })

  revalidatePath("/library/catalog")
  return { success: true }
}
