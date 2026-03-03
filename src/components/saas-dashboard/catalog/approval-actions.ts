"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { revalidatePath } from "next/cache"

import type { ActionResponse } from "@/lib/action-response"
import { db } from "@/lib/db"
import { requireDeveloper } from "@/components/saas-dashboard/lib/operator-auth"

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
// Approve content across all 5 content types
// ============================================================================

export async function approveContent(
  contentType: ContentType,
  id: string
): Promise<ActionResponse> {
  try {
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
        // Transaction: approve + auto-select into contributor's library + update usage count
        await db.$transaction(async (tx) => {
          const catalogBook = await tx.catalogBook.update({
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

          if (catalogBook.contributedSchoolId) {
            const existingSelection = await tx.schoolBookSelection.findFirst({
              where: {
                schoolId: catalogBook.contributedSchoolId,
                catalogBookId: id,
              },
            })

            if (!existingSelection) {
              await tx.schoolBookSelection.create({
                data: {
                  schoolId: catalogBook.contributedSchoolId,
                  catalogBookId: id,
                  totalCopies: 1,
                  availableCopies: 1,
                  isActive: true,
                },
              })

              await tx.book.create({
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
              })

              // Usage count inside transaction to prevent race condition
              const usageCount = await tx.schoolBookSelection.count({
                where: { catalogBookId: id },
              })
              await tx.catalogBook.update({
                where: { id },
                data: { usageCount },
              })
            }
          }
        })
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
        return {
          success: false,
          error: `Unknown content type: ${contentType}`,
        }
    }

    revalidatePath("/catalog/approvals")
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to approve content",
    }
  }
}

// ============================================================================
// Reject content across all 5 content types
// ============================================================================

export async function rejectContent(
  contentType: ContentType,
  id: string,
  rejectionReason: string
): Promise<ActionResponse> {
  try {
    const session = await requireDeveloper()
    const userId = session.user?.id

    if (!rejectionReason || rejectionReason.trim().length === 0) {
      return { success: false, error: "Rejection reason is required" }
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
        return {
          success: false,
          error: `Unknown content type: ${contentType}`,
        }
    }

    revalidatePath("/catalog/approvals")
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to reject content",
    }
  }
}
