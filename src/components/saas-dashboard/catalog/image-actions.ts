"use server"

import { auth } from "@/auth"

import {
  deleteCatalogImage,
  processAndUploadCatalogImage,
} from "@/lib/catalog-image"
import { db } from "@/lib/db"

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
  thumbnailKey?: string
  error?: string
}> {
  const session = await auth()
  if (session?.user?.role !== "DEVELOPER") {
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
    const thumbnailKey = await processAndUploadCatalogImage(buffer, key)

    // Store key in database
    if (entityType === "subject") {
      await db.catalogSubject.update({
        where: { id: entityId },
        data: { thumbnailKey },
      })
    } else if (entityType === "chapter") {
      await db.catalogChapter.update({
        where: { id: entityId },
        data: { thumbnailKey },
      })
    } else {
      await db.catalogLesson.update({
        where: { id: entityId },
        data: { thumbnailKey },
      })
    }

    return { status: "success", thumbnailKey }
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
  const session = await auth()
  if (session?.user?.role !== "DEVELOPER") {
    return { status: "error", error: "Unauthorized" }
  }

  try {
    // Get current thumbnailKey
    let thumbnailKey: string | null = null

    if (entityType === "subject") {
      const entity = await db.catalogSubject.findUnique({
        where: { id: entityId },
        select: { thumbnailKey: true },
      })
      thumbnailKey = entity?.thumbnailKey ?? null
    } else if (entityType === "chapter") {
      const entity = await db.catalogChapter.findUnique({
        where: { id: entityId },
        select: { thumbnailKey: true },
      })
      thumbnailKey = entity?.thumbnailKey ?? null
    } else {
      const entity = await db.catalogLesson.findUnique({
        where: { id: entityId },
        select: { thumbnailKey: true },
      })
      thumbnailKey = entity?.thumbnailKey ?? null
    }

    if (thumbnailKey) {
      await deleteCatalogImage(thumbnailKey)
    }

    // Clear from database
    if (entityType === "subject") {
      await db.catalogSubject.update({
        where: { id: entityId },
        data: { thumbnailKey: null },
      })
    } else if (entityType === "chapter") {
      await db.catalogChapter.update({
        where: { id: entityId },
        data: { thumbnailKey: null },
      })
    } else {
      await db.catalogLesson.update({
        where: { id: entityId },
        data: { thumbnailKey: null },
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
