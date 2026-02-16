"use server"

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
