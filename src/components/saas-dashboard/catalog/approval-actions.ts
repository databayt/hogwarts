"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { revalidatePath } from "next/cache"
import { z } from "zod"

import type { ActionResponse } from "@/lib/action-response"
import { db } from "@/lib/db"
import { requireDeveloper } from "@/components/saas-dashboard/lib/operator-auth"

// ============================================================================
// Content type mapping
// ============================================================================

type ContentType = "Question" | "Material" | "Assignment" | "Book" | "Video"

// Content types reachable by the operator flag-management dialog. Question /
// Material / Assignment / Book / Video share the approval pipeline; Exam has
// its own approval flow but its catalog flags are managed here too.
type FlagContentType = ContentType | "Exam"

// Which models carry a ContentStatus column (Video has none).
const TYPES_WITH_STATUS: ReadonlySet<FlagContentType> = new Set([
  "Question",
  "Material",
  "Assignment",
  "Book",
  "Exam",
])

// Which models carry price / currency columns.
const TYPES_WITH_PRICE: ReadonlySet<FlagContentType> = new Set([
  "Question",
  "Video",
  "Exam",
])

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

    const visibility = options?.visibility
    const isPaid = visibility === "PAID"

    // Material / Assignment / Book have no price columns -- PAID is meaningless
    // for them, so reject the request rather than silently ignoring it.
    if (
      isPaid &&
      (contentType === "Material" ||
        contentType === "Assignment" ||
        contentType === "Book")
    ) {
      return {
        success: false,
        error: "PAID visibility is not supported for this content type",
      }
    }

    switch (contentType) {
      case "Question": {
        // Question supports PAID pricing exactly like Video. Reviewer chose PAID
        // -> require a valid price and 3-letter currency.
        if (
          isPaid &&
          (!options?.price ||
            options.price <= 0 ||
            !options?.currency ||
            options.currency.trim().length !== 3)
        ) {
          return {
            success: false,
            error: "Paid content requires a price and 3-letter currency",
          }
        }
        await db.question.update({
          where: { id },
          data: {
            ...approvalData,
            // Approved school contributions are created with status "DRAFT";
            // school browse paths only surface PUBLISHED + APPROVED rows, so
            // approval must publish too.
            status: "PUBLISHED",
            ...(visibility ? { visibility } : {}),
            // Mirror the Video pricing conditional: write price/currency only
            // when PAID; null them out when an explicit non-PAID visibility is
            // chosen; otherwise leave the proposer's values untouched.
            ...(isPaid
              ? {
                  price: options!.price!,
                  currency: options!.currency!.trim().toUpperCase(),
                }
              : visibility
                ? { price: null, currency: null }
                : {}),
          },
        })
        break
      }
      case "Material":
        await db.material.update({
          where: { id },
          data: {
            ...approvalData,
            status: "PUBLISHED",
            ...(visibility ? { visibility } : {}),
          },
        })
        break
      case "Assignment":
        await db.assignment.update({
          where: { id },
          data: {
            ...approvalData,
            status: "PUBLISHED",
            ...(visibility ? { visibility } : {}),
          },
        })
        break
      case "Book": {
        // Transaction: approve + auto-select into contributor's library + update usage count
        await db.$transaction(async (tx) => {
          const catalogBook = await tx.book.update({
            where: { id },
            data: {
              ...approvalData,
              status: "PUBLISHED",
              ...(visibility ? { visibility } : {}),
            },
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
        // visibility / isPaid are computed once at the top of the action.
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

// ============================================================================
// Manage catalog flags (visibility / status / pricing) for any content type
// ============================================================================

const VISIBILITY_VALUES = ["PRIVATE", "SCHOOL", "PUBLIC", "PAID"] as const
const STATUS_VALUES = [
  "DRAFT",
  "REVIEW",
  "PUBLISHED",
  "ARCHIVED",
  "DEPRECATED",
] as const

const contentFlagsSchema = z.object({
  visibility: z.enum(VISIBILITY_VALUES).optional(),
  status: z.enum(STATUS_VALUES).optional(),
  price: z.number().nonnegative().nullable().optional(),
  currency: z.string().length(3).nullable().optional(),
})

export type ContentVisibility = (typeof VISIBILITY_VALUES)[number]
export type ContentStatus = (typeof STATUS_VALUES)[number]

/**
 * Operator-only catalog flag management. Lets a DEVELOPER directly set the
 * visibility / publication status / pricing of an already-existing catalog
 * item (independent of the approve/reject flow).
 *
 * Per-type field whitelist:
 *  - status        -> every type EXCEPT Video (Video has no ContentStatus)
 *  - price/currency -> Question, Video, Exam only
 *  - PAID guard     -> PAID requires a positive price + 3-letter currency,
 *                      either supplied in `flags` or already on the row
 */
export async function updateContentFlags(
  contentType: FlagContentType,
  id: string,
  flags: {
    visibility?: ContentVisibility
    status?: ContentStatus
    price?: number | null
    currency?: string | null
  }
): Promise<ActionResponse> {
  try {
    await requireDeveloper()

    const parsed = contentFlagsSchema.safeParse(flags)
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message ?? "Invalid flags",
      }
    }
    const { visibility, status, price, currency } = parsed.data

    const hasStatus = TYPES_WITH_STATUS.has(contentType)
    const hasPrice = TYPES_WITH_PRICE.has(contentType)

    // Reject any field that does not exist on this content type rather than
    // silently dropping it -- the caller asked for something impossible.
    if (status !== undefined && !hasStatus) {
      return {
        success: false,
        error: "Status is not supported for this content type",
      }
    }
    if ((price !== undefined || currency !== undefined) && !hasPrice) {
      return {
        success: false,
        error: "Pricing is not supported for this content type",
      }
    }
    if (visibility === "PAID" && !hasPrice) {
      return {
        success: false,
        error: "PAID visibility is not supported for this content type",
      }
    }

    // Build the update payload, type by type, only including whitelisted fields.
    const data: Record<string, unknown> = {}
    if (visibility !== undefined) data.visibility = visibility
    if (hasStatus && status !== undefined) data.status = status

    if (hasPrice) {
      const isPaid = visibility === "PAID"
      if (isPaid) {
        // PAID requires a positive price + 3-letter currency. The values can
        // come from the caller OR already be present on the row.
        let effectivePrice = price ?? undefined
        let effectiveCurrency = currency ?? undefined
        if (effectivePrice === undefined || effectiveCurrency === undefined) {
          const existing = await readPricing(contentType, id)
          if (effectivePrice === undefined)
            effectivePrice = existing?.price ?? undefined
          if (effectiveCurrency === undefined)
            effectiveCurrency = existing?.currency ?? undefined
        }
        if (
          effectivePrice === undefined ||
          effectivePrice <= 0 ||
          !effectiveCurrency ||
          effectiveCurrency.trim().length !== 3
        ) {
          return {
            success: false,
            error: "Paid content requires a price and 3-letter currency",
          }
        }
        data.price = effectivePrice
        data.currency = effectiveCurrency.trim().toUpperCase()
      } else if (visibility !== undefined) {
        // Switching away from PAID clears any stored pricing.
        data.price = null
        data.currency = null
      } else {
        // Visibility untouched -- allow explicit price/currency edits as-is.
        if (price !== undefined) data.price = price
        if (currency !== undefined)
          data.currency = currency ? currency.trim().toUpperCase() : currency
      }
    }

    if (Object.keys(data).length === 0) {
      return { success: false, error: "No flags to update" }
    }

    switch (contentType) {
      case "Question":
        await db.question.update({ where: { id }, data })
        break
      case "Material":
        await db.material.update({ where: { id }, data })
        break
      case "Assignment":
        await db.assignment.update({ where: { id }, data })
        break
      case "Book":
        await db.book.update({ where: { id }, data })
        break
      case "Video":
        await db.video.update({ where: { id }, data })
        break
      case "Exam":
        await db.exam.update({ where: { id }, data })
        break
      default:
        return {
          success: false,
          error: `Unknown content type: ${contentType}`,
        }
    }

    revalidatePath("/catalog/approvals")
    revalidatePath(tabPathFor(contentType))
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update flags",
    }
  }
}

/** Read the current price/currency of a priceable row (PAID guard fallback). */
async function readPricing(
  contentType: FlagContentType,
  id: string
): Promise<{ price: number | null; currency: string | null } | null> {
  switch (contentType) {
    case "Question": {
      const row = await db.question.findUnique({
        where: { id },
        select: { price: true, currency: true },
      })
      return row
        ? {
            price: row.price != null ? Number(row.price) : null,
            currency: row.currency,
          }
        : null
    }
    case "Video": {
      const row = await db.video.findUnique({
        where: { id },
        select: { price: true, currency: true },
      })
      return row ? { price: row.price, currency: row.currency } : null
    }
    case "Exam": {
      const row = await db.exam.findUnique({
        where: { id },
        select: { price: true, currency: true },
      })
      return row
        ? {
            price: row.price != null ? Number(row.price) : null,
            currency: row.currency,
          }
        : null
    }
    default:
      return null
  }
}

/** Map a content type to its catalog tab route for revalidation. */
function tabPathFor(contentType: FlagContentType): string {
  switch (contentType) {
    case "Question":
      return "/catalog/questions"
    case "Material":
      return "/catalog/materials"
    case "Assignment":
      return "/catalog/assignments"
    case "Book":
      return "/catalog/books"
    // Video and Exam are surfaced on the main catalog page.
    case "Video":
    case "Exam":
    default:
      return "/catalog"
  }
}
