"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { revalidatePath } from "next/cache"
import { auth } from "@/auth"

import { db } from "@/lib/db"

// ============================================================================
// Authorization helper -- DEVELOPER only, NO schoolId
// ============================================================================

async function requireDeveloper() {
  const session = await auth()
  if (session?.user?.role !== "DEVELOPER") {
    throw new Error("Unauthorized: DEVELOPER role required")
  }
  return session
}

// ============================================================================
// Content type mapping
// ============================================================================

type ContentType =
  | "CatalogQuestion"
  | "CatalogMaterial"
  | "CatalogAssignment"
  | "CatalogBook"
  | "LessonVideo"

// ============================================================================
// Approve content across all 4 content types
// ============================================================================

export async function approveContent(contentType: ContentType, id: string) {
  const session = await requireDeveloper()
  const userId = session.user?.id

  const approvalData = {
    approvalStatus: "APPROVED" as const,
    approvedBy: userId,
    approvedAt: new Date(),
    rejectionReason: null,
  }

  switch (contentType) {
    case "CatalogQuestion":
      await db.catalogQuestion.update({
        where: { id },
        data: approvalData,
      })
      break
    case "CatalogMaterial":
      await db.catalogMaterial.update({
        where: { id },
        data: approvalData,
      })
      break
    case "CatalogAssignment":
      await db.catalogAssignment.update({
        where: { id },
        data: approvalData,
      })
      break
    case "CatalogBook": {
      const catalogBook = await db.catalogBook.update({
        where: { id },
        data: { ...approvalData, status: "PUBLISHED" },
        select: {
          id: true,
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
          contributedSchoolId: true,
        },
      })

      // Auto-select into contributor's school library
      if (catalogBook.contributedSchoolId) {
        const existingSelection = await db.schoolBookSelection.findFirst({
          where: {
            schoolId: catalogBook.contributedSchoolId,
            catalogBookId: id,
          },
        })

        if (!existingSelection) {
          await db.$transaction([
            db.schoolBookSelection.create({
              data: {
                schoolId: catalogBook.contributedSchoolId,
                catalogBookId: id,
                totalCopies: 1,
                availableCopies: 1,
                isActive: true,
              },
            }),
            db.book.create({
              data: {
                schoolId: catalogBook.contributedSchoolId,
                catalogBookId: id,
                title: catalogBook.title,
                author: catalogBook.author,
                genre: catalogBook.genre,
                description: catalogBook.description ?? "",
                summary: catalogBook.summary ?? "",
                coverUrl: catalogBook.coverUrl ?? "",
                coverColor: catalogBook.coverColor,
                rating: Math.round(catalogBook.rating),
                totalCopies: 1,
                availableCopies: 1,
                videoUrl: catalogBook.videoUrl,
                isbn: catalogBook.isbn,
                publisher: catalogBook.publisher,
                publicationYear: catalogBook.publicationYear,
                language: catalogBook.language,
                pageCount: catalogBook.pageCount,
                gradeLevel: catalogBook.gradeLevel,
              },
            }),
          ])

          // Update usage count
          const usageCount = await db.schoolBookSelection.count({
            where: { catalogBookId: id },
          })
          await db.catalogBook.update({
            where: { id },
            data: { usageCount },
          })
        }
      }
      break
    }
    case "LessonVideo":
      await db.lessonVideo.update({
        where: { id },
        data: {
          approvalStatus: "APPROVED",
          approvedBy: userId,
          approvedAt: new Date(),
          rejectionReason: null,
        },
      })
      break
    default:
      throw new Error(`Unknown content type: ${contentType}`)
  }

  revalidatePath("/catalog/approvals")
  return { success: true }
}

// ============================================================================
// Reject content across all 4 content types
// ============================================================================

export async function rejectContent(
  contentType: ContentType,
  id: string,
  rejectionReason: string
) {
  const session = await requireDeveloper()
  const userId = session.user?.id

  if (!rejectionReason || rejectionReason.trim().length === 0) {
    throw new Error("Rejection reason is required")
  }

  const rejectionData = {
    approvalStatus: "REJECTED" as const,
    approvedBy: userId,
    approvedAt: new Date(),
    rejectionReason,
  }

  switch (contentType) {
    case "CatalogQuestion":
      await db.catalogQuestion.update({
        where: { id },
        data: rejectionData,
      })
      break
    case "CatalogMaterial":
      await db.catalogMaterial.update({
        where: { id },
        data: rejectionData,
      })
      break
    case "CatalogAssignment":
      await db.catalogAssignment.update({
        where: { id },
        data: rejectionData,
      })
      break
    case "CatalogBook":
      await db.catalogBook.update({
        where: { id },
        data: rejectionData,
      })
      break
    case "LessonVideo":
      await db.lessonVideo.update({
        where: { id },
        data: {
          approvalStatus: "REJECTED",
          approvedBy: userId,
          approvedAt: new Date(),
          rejectionReason,
        },
      })
      break
    default:
      throw new Error(`Unknown content type: ${contentType}`)
  }

  revalidatePath("/catalog/approvals")
  return { success: true }
}
