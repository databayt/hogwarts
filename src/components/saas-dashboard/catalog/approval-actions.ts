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

type ContentType = "Question" | "Material" | "Assignment" | "Book" | "Video"

// ============================================================================
// Approve content across all 5 content types
// ============================================================================

export async function approveContent(
  contentType: ContentType,
  id: string,
  options?: {
    visibility?: "PRIVATE" | "SCHOOL" | "PUBLIC" | "PAID"
    isFeatured?: boolean
    price?: number | null
    currency?: string | null
  }
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
      case "Question":
        await db.question.update({
          where: { id },
          data: approvalData,
        })
        break
      case "Material":
        await db.material.update({
          where: { id },
          data: approvalData,
        })
        break
      case "Assignment":
        await db.assignment.update({
          where: { id },
          data: approvalData,
        })
        break
      case "Book": {
        // Transaction: approve + auto-select into contributor's library + update usage count
        await db.$transaction(async (tx) => {
          const catalogBook = await tx.book.update({
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
            const existingSelection = await tx.bookSelection.findFirst({
              where: {
                schoolId: catalogBook.contributedSchoolId,
                catalogBookId: id,
              },
            })

            if (!existingSelection) {
              await tx.bookSelection.create({
                data: {
                  schoolId: catalogBook.contributedSchoolId,
                  catalogBookId: id,
                  totalCopies: 1,
                  availableCopies: 1,
                  isActive: true,
                },
              })

              await tx.schoolBook.create({
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
              const usageCount = await tx.bookSelection.count({
                where: { catalogBookId: id },
              })
              await tx.book.update({
                where: { id },
                data: { usageCount },
              })
            }
          }
        })
        break
      }
      case "Video": {
        const visibility = options?.visibility
        const isPaid = visibility === "PAID"
        // Reviewer chose PAID → require a valid price and 3-letter currency.
        if (
          isPaid &&
          (!options?.price ||
            options.price <= 0 ||
            !options?.currency ||
            options.currency.trim().length !== 3)
        ) {
          return {
            success: false,
            error: "Paid videos require a price and 3-letter currency",
          }
        }
        const updated = await db.video.update({
          where: { id },
          data: {
            approvalStatus: "APPROVED",
            approvedBy: userId,
            approvedAt: new Date(),
            rejectionReason: null,
            ...(visibility ? { visibility } : {}),
            ...(options?.isFeatured !== undefined
              ? { isFeatured: options.isFeatured }
              : {}),
            // Writing pricing fields only when explicitly part of approval decision,
            // otherwise leave the proposer-supplied values as-is.
            ...(isPaid
              ? {
                  price: options!.price!,
                  currency: options!.currency!.trim().toUpperCase(),
                }
              : visibility
                ? { price: null, currency: null }
                : {}),
          },
          select: { userId: true, schoolId: true, title: true },
        })
        // Fire-and-forget notify the proposer. Notification requires a schoolId, so
        // platform-level videos (no school) are silently skipped.
        if (updated.userId && updated.schoolId) {
          await db.notification
            .create({
              data: {
                schoolId: updated.schoolId,
                userId: updated.userId,
                actorId: userId ?? null,
                type: "document_shared",
                priority: "normal",
                title: "Video approved",
                body: `Your video "${updated.title}" has been approved and is now live.`,
                metadata: {
                  entityType: "video",
                  entityId: id,
                  url: "/stream/settings?tab=videos",
                },
              },
            })
            .catch(() => {
              // Notification failure must not fail the approval.
            })
        }
        break
      }
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
      case "Question":
        await db.question.update({
          where: { id },
          data: rejectionData,
        })
        break
      case "Material":
        await db.material.update({
          where: { id },
          data: rejectionData,
        })
        break
      case "Assignment":
        await db.assignment.update({
          where: { id },
          data: rejectionData,
        })
        break
      case "Book":
        await db.book.update({
          where: { id },
          data: rejectionData,
        })
        break
      case "Video": {
        const updated = await db.video.update({
          where: { id },
          data: {
            approvalStatus: "REJECTED",
            approvedBy: userId,
            approvedAt: new Date(),
            rejectionReason,
          },
          select: { userId: true, schoolId: true, title: true },
        })
        if (updated.userId && updated.schoolId) {
          await db.notification
            .create({
              data: {
                schoolId: updated.schoolId,
                userId: updated.userId,
                actorId: userId ?? null,
                type: "system_alert",
                priority: "high",
                title: "Video needs changes",
                body: `Your video "${updated.title}" was not approved. Reason: ${rejectionReason}`,
                metadata: {
                  entityType: "video",
                  entityId: id,
                  url: "/stream/settings?tab=videos",
                  rejectionReason,
                },
              },
            })
            .catch(() => {
              // Notification failure must not fail the rejection.
            })
        }
        break
      }
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
