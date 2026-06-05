"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { revalidatePath, revalidateTag } from "next/cache"
import { auth } from "@/auth"
import { z } from "zod"

import { ACTION_ERRORS, actionError } from "@/lib/action-errors"
import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"
import { getCategoryFromMimeType } from "@/components/file/config"
import {
  getProvider,
  selectProvider,
} from "@/components/file/providers/factory"

import { logAttachmentUploaded } from "./audit"
import { MESSAGES_PATH } from "./config"
import { isConversationParticipant } from "./queries"

// Validation schema for attachment metadata
const attachmentMetadataSchema = z.object({
  conversationId: z.string().min(1, "Conversation ID is required"),
})

// Size limits for message attachments (bytes)
const ATTACHMENT_SIZE_LIMITS = {
  image: 10 * 1024 * 1024, // 10 MB
  video: 100 * 1024 * 1024, // 100 MB
  audio: 25 * 1024 * 1024, // 25 MB
  document: 50 * 1024 * 1024, // 50 MB
  archive: 25 * 1024 * 1024, // 25 MB
  other: 25 * 1024 * 1024, // 25 MB
} as const

// Allowed MIME types
const ALLOWED_MIME_TYPES = new Set([
  // Images
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  // Videos
  "video/mp4",
  "video/webm",
  "video/quicktime",
  // Audio
  "audio/mpeg",
  "audio/wav",
  "audio/ogg",
  "audio/webm",
  // Documents
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/plain",
])

export interface AttachmentUploadResult {
  id: string
  fileUrl: string
  fileName: string
  fileSize: number
  fileType: string
  thumbnail?: string
}

type ActionResponse<T> =
  | { success: true; data: T }
  | { success: false; error: string }

/**
 * Upload an attachment for a message
 *
 * This server action handles:
 * 1. Authentication and authorization (user must be conversation participant)
 * 2. File validation (size limits, MIME types)
 * 3. Storage upload (AWS S3 or Vercel Blob based on config)
 * 4. Thumbnail generation for images (optional)
 *
 * The uploaded file is NOT attached to a message yet - that happens when
 * the message is sent via sendMessage action with attachment URLs.
 */
export async function uploadMessageAttachment(
  formData: FormData
): Promise<ActionResponse<AttachmentUploadResult>> {
  try {
    // 1. Authenticate
    const session = await auth()
    if (!session?.user?.id) {
      return actionError(ACTION_ERRORS.NOT_AUTHENTICATED)
    }

    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return actionError(ACTION_ERRORS.MISSING_SCHOOL)
    }

    // 2. Extract and validate input
    const file = formData.get("file") as File | null
    const conversationId = formData.get("conversationId") as string | null

    if (!file || !(file instanceof File)) {
      return actionError(ACTION_ERRORS.VALIDATION_ERROR, "No file provided")
    }

    if (!conversationId) {
      return actionError(
        ACTION_ERRORS.VALIDATION_ERROR,
        "Conversation ID is required"
      )
    }

    // 3. Check user is participant in conversation
    const isParticipant = await isConversationParticipant(
      schoolId,
      conversationId,
      session.user.id
    )
    if (!isParticipant) {
      return actionError(ACTION_ERRORS.UNAUTHORIZED)
    }

    // 4. Validate file type (client pre-validates; this is the server fallback)
    if (!ALLOWED_MIME_TYPES.has(file.type)) {
      return actionError(ACTION_ERRORS.ATTACHMENT_TYPE_INVALID)
    }

    // 5. Validate file size
    const category = getCategoryFromMimeType(file.type)
    const sizeLimit =
      ATTACHMENT_SIZE_LIMITS[category as keyof typeof ATTACHMENT_SIZE_LIMITS] ||
      ATTACHMENT_SIZE_LIMITS.other

    if (file.size > sizeLimit) {
      const maxMB = Math.round(sizeLimit / (1024 * 1024))
      return actionError(
        ACTION_ERRORS.ATTACHMENT_TOO_LARGE,
        `Maximum size: ${maxMB}MB`
      )
    }

    // 6. Generate unique filename with path
    const timestamp = Date.now()
    const randomSuffix = Math.random().toString(36).slice(2, 8)
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_")
    const filename = `${timestamp}-${randomSuffix}-${sanitizedName}`

    // Storage path: messaging/{schoolId}/{conversationId}/{filename}
    const storagePath = `messaging/${schoolId}/${conversationId}/${filename}`

    // 7. Get storage provider using the factory
    const providerName = selectProvider({
      category: category as
        | "video"
        | "image"
        | "document"
        | "audio"
        | "archive"
        | "other",
      size: file.size,
      tier: "hot",
      purpose: "messaging",
    })
    const provider = getProvider(providerName)

    // 8. Upload file
    const fileUrl = await provider.upload(file, storagePath, {
      contentType: file.type,
      access: "private", // Private for messaging attachments
      metadata: {
        schoolId,
        conversationId,
        uploadedBy: session.user.id,
        originalName: file.name,
      },
    })

    // 9. Generate thumbnail for images (optional)
    let thumbnail: string | undefined
    if (category === "image") {
      // For now, we'll skip thumbnail generation
      // Could be added later with Sharp processing
    }

    // 10. Return result
    const result: AttachmentUploadResult = {
      id: `${timestamp}-${randomSuffix}`,
      fileUrl,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      thumbnail,
    }

    // 11. Audit log (non-blocking)
    logAttachmentUploaded(
      { schoolId, userId: session.user.id },
      {
        conversationId,
        attachmentId: result.id,
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
      }
    ).catch((err) =>
      console.error("[uploadMessageAttachment] Audit log error:", err)
    )

    return { success: true, data: result }
  } catch (error) {
    console.error("[uploadMessageAttachment] Error:", error)
    return actionError(
      ACTION_ERRORS.ATTACHMENT_UPLOAD_FAILED,
      error instanceof Error ? error.message : undefined
    )
  }
}

/**
 * Delete an attachment (only before message is sent)
 */
export async function deleteMessageAttachment(
  fileUrl: string,
  conversationId: string
): Promise<ActionResponse<void>> {
  try {
    // 1. Authenticate
    const session = await auth()
    if (!session?.user?.id) {
      return actionError(ACTION_ERRORS.NOT_AUTHENTICATED)
    }

    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return actionError(ACTION_ERRORS.MISSING_SCHOOL)
    }

    // 2. Verify the file URL belongs to this conversation and school
    if (!fileUrl.includes(`messaging/${schoolId}/${conversationId}`)) {
      return actionError(ACTION_ERRORS.VALIDATION_ERROR, "Invalid attachment URL")
    }

    // 3. Check user is participant in conversation
    const isParticipant = await isConversationParticipant(
      schoolId,
      conversationId,
      session.user.id
    )
    if (!isParticipant) {
      return actionError(ACTION_ERRORS.UNAUTHORIZED)
    }

    // 4. Get storage provider and delete
    // Use default provider for delete (URL determines actual location)
    const providerName = selectProvider({
      category: "document",
      size: 0,
      tier: "hot",
    })
    const provider = getProvider(providerName)
    await provider.delete(fileUrl)

    return { success: true, data: undefined }
  } catch (error) {
    console.error("[deleteMessageAttachment] Error:", error)
    return actionError(
      ACTION_ERRORS.DELETE_FAILED,
      error instanceof Error ? error.message : undefined
    )
  }
}

/**
 * Validate attachments before sending a message
 * Returns validated attachment URLs that can be saved
 */
export async function validateMessageAttachments(
  attachmentUrls: string[],
  conversationId: string
): Promise<ActionResponse<string[]>> {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return actionError(ACTION_ERRORS.NOT_AUTHENTICATED)
    }

    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return actionError(ACTION_ERRORS.MISSING_SCHOOL)
    }

    // Validate each URL belongs to this conversation and school
    const validUrls: string[] = []

    for (const url of attachmentUrls) {
      // Check URL pattern matches expected storage path
      if (url.includes(`messaging/${schoolId}/${conversationId}`)) {
        validUrls.push(url)
      } else {
        console.warn("[validateMessageAttachments] Invalid URL rejected:", url)
      }
    }

    return { success: true, data: validUrls }
  } catch (error) {
    console.error("[validateMessageAttachments] Error:", error)
    return actionError(
      ACTION_ERRORS.SAVE_FAILED,
      error instanceof Error ? error.message : undefined
    )
  }
}
