"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import {
  deleteCatalogImage,
  processAndUploadCatalogImage,
} from "@/lib/catalog-image"
import { db } from "@/lib/db"
import { requireDeveloper } from "@/components/saas-dashboard/lib/operator-auth"

type EntityType = "subject" | "chapter" | "lesson"

function buildKey(entityType: EntityType, entityId: string): string {
  const plural =
    entityType === "subject"
      ? "subjects"
      : entityType === "chapter"
        ? "chapters"
        : "lessons"
  return `catalog/${plural}/${entityId}/thumbnail`
}

/**
 * Upload and process a catalog thumbnail image.
 * DEVELOPER-only — catalog is global (no schoolId).
 */
export async function uploadCatalogThumbnail(
  formData: FormData,
  entityType: EntityType,
  entityId: string
): Promise<{
  status: "success" | "error"
  thumbnail?: string
  error?: string
}> {
  try {
    await requireDeveloper()
  } catch {
    return { status: "error", error: "Unauthorized" }
  }

  const file = formData.get("file") as File | null
  if (!file || file.size === 0) {
    return { status: "error", error: "No file provided" }
  }

  // Validate file type
  if (!file.type.startsWith("image/")) {
    return { status: "error", error: "File must be an image" }
  }

  // Max 10MB
  if (file.size > 10 * 1024 * 1024) {
    return { status: "error", error: "File too large (max 10MB)" }
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer())
    const key = buildKey(entityType, entityId)

    // Process and upload to S3
    const thumbnail = await processAndUploadCatalogImage(buffer, key)

    // Store key in database
    if (entityType === "subject") {
      await db.subject.update({
        where: { id: entityId },
        data: { thumbnail },
      })
    } else if (entityType === "chapter") {
      await db.chapter.update({
        where: { id: entityId },
        data: { thumbnail },
      })
    } else {
      await db.lesson.update({
        where: { id: entityId },
        data: { thumbnail },
      })
    }

    return { status: "success", thumbnail }
  } catch (error) {
    console.error("[catalog-image] Upload failed:", error)
    return {
      status: "error",
      error: error instanceof Error ? error.message : "Upload failed",
    }
  }
}

/**
 * Delete a catalog thumbnail image.
 * DEVELOPER-only.
 */
export async function deleteCatalogThumbnail(
  entityType: EntityType,
  entityId: string
): Promise<{ status: "success" | "error"; error?: string }> {
  try {
    await requireDeveloper()
  } catch {
    return { status: "error", error: "Unauthorized" }
  }

  try {
    // Get current thumbnail
    let thumbnail: string | null = null

    if (entityType === "subject") {
      const entity = await db.subject.findUnique({
        where: { id: entityId },
        select: { thumbnail: true },
      })
      thumbnail = entity?.thumbnail ?? null
    } else if (entityType === "chapter") {
      const entity = await db.chapter.findUnique({
        where: { id: entityId },
        select: { thumbnail: true },
      })
      thumbnail = entity?.thumbnail ?? null
    } else {
      const entity = await db.lesson.findUnique({
        where: { id: entityId },
        select: { thumbnail: true },
      })
      thumbnail = entity?.thumbnail ?? null
    }

    if (thumbnail) {
      await deleteCatalogImage(thumbnail)
    }

    // Clear from database
    if (entityType === "subject") {
      await db.subject.update({
        where: { id: entityId },
        data: { thumbnail: null },
      })
    } else if (entityType === "chapter") {
      await db.chapter.update({
        where: { id: entityId },
        data: { thumbnail: null },
      })
    } else {
      await db.lesson.update({
        where: { id: entityId },
        data: { thumbnail: null },
      })
    }

    return { status: "success" }
  } catch (error) {
    console.error("[catalog-image] Delete failed:", error)
    return {
      status: "error",
      error: error instanceof Error ? error.message : "Delete failed",
    }
  }
}
