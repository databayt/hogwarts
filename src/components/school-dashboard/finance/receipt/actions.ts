// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Server Actions for Receipt Tracker Feature
 * Follows Hogwarts server action pattern with schoolId scoping
 */

"use server"

import { revalidatePath } from "next/cache"
import { auth } from "@/auth"

import { ACTION_ERRORS, actionError } from "@/lib/action-errors"
import { db } from "@/lib/db"
import { logger } from "@/lib/logger"
import { getTenantContext } from "@/lib/tenant-context"
import { getProvider } from "@/components/file"

import { extractReceiptData, retryExtraction } from "./ai/extract-receipt-data"
import type {
  ExpenseReceipt,
  GetReceiptsResponse,
  ServerActionResponse,
  UploadReceiptResponse,
} from "./types"
import {
  deleteReceiptSchema,
  getReceiptByIdSchema,
  getReceiptsSchema,
  updateReceiptSchema,
  uploadReceiptSchema,
} from "./validation"

/**
 * Upload a new receipt file and create database record
 * Automatically triggers AI extraction in background
 */
export async function uploadReceipt(
  formData: FormData
): Promise<ServerActionResponse<UploadReceiptResponse>> {
  try {
    // 1. Authenticate user
    const session = await auth()
    if (!session?.user) {
      return actionError(ACTION_ERRORS.NOT_AUTHENTICATED)
    }

    // 2. Get tenant context (CRITICAL for multi-tenant safety)
    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return actionError(ACTION_ERRORS.MISSING_SCHOOL)
    }

    // 3. Extract file reference — the FileUploader component pre-uploads to CDN
    //    and sends back (fileId, fileUrl). We also accept a legacy raw File for
    //    callers that still send the file directly under the "file" key.
    const rawFile = formData.get("file") as File | null
    const cdnFileId = formData.get("fileId") as string | null
    const cdnFileUrl = formData.get("fileUrl") as string | null

    // Pre-upload path: FileUploader already stored the file, gives us a URL.
    if (cdnFileId && cdnFileUrl) {
      const fileName = cdnFileId
      logger.info("Receipt using pre-uploaded CDN file", {
        action: "receipt_upload",
        schoolId,
        userId: session.user.id,
        cdnFileId,
      })

      // 5. Create database record with pending status (file is already in CDN)
      const receipt = await db.expenseReceipt.create({
        data: {
          schoolId,
          userId: session.user.id!,
          fileName,
          fileUrl: cdnFileUrl,
          fileSize: 0, // Size not available after pre-upload; non-critical
          mimeType: "application/octet-stream",
          status: "pending",
        },
      })

      logger.info("Receipt database record created", {
        action: "receipt_db_create",
        receiptId: receipt.id,
        schoolId,
      })

      void extractReceiptData(receipt.id, cdnFileUrl, schoolId)

      // 7. Revalidate receipts list page
      revalidatePath(`/s/[subdomain]/(school-dashboard)/finance/receipt`)

      return {
        success: true,
        data: { receiptId: receipt.id },
      }
    }

    // Legacy direct-upload path: caller sends a File object under "file".
    const file = rawFile
    if (!file) {
      return actionError(ACTION_ERRORS.VALIDATION_ERROR)
    }

    // Validate file type and size
    const validation = uploadReceiptSchema.safeParse({
      file,
      schoolId,
      userId: session.user.id!,
    })

    if (!validation.success) {
      return actionError(ACTION_ERRORS.VALIDATION_ERROR)
    }

    // 4. Upload to storage using centralized provider
    const filename = `${schoolId}/receipts/${Date.now()}-${file.name}`
    const provider = getProvider("aws_s3")
    const fileUrl = await provider.upload(file, filename, {
      contentType: file.type,
    })

    logger.info("Receipt file uploaded to storage", {
      action: "receipt_upload",
      schoolId,
      userId: session.user.id,
      filename,
      size: file.size,
    })

    // 5. Create database record with pending status
    const receipt = await db.expenseReceipt.create({
      data: {
        schoolId,
        userId: session.user.id!,
        fileName: file.name,
        fileUrl,
        fileSize: file.size,
        mimeType: file.type,
        status: "pending",
      },
    })

    logger.info("Receipt database record created", {
      action: "receipt_db_create",
      receiptId: receipt.id,
      schoolId,
    })

    // 6. Trigger AI extraction asynchronously (don't await). schoolId is
    // threaded through so every receipt write stays tenant-scoped.
    void extractReceiptData(receipt.id, fileUrl, schoolId)

    // 7. Revalidate receipts list page
    revalidatePath(`/s/[subdomain]/(school-dashboard)/finance/receipt`)

    return {
      success: true,
      data: {
        receiptId: receipt.id,
      },
    }
  } catch (error) {
    logger.error(
      "Receipt upload failed",
      error instanceof Error ? error : new Error("Unknown error"),
      {
        action: "receipt_upload_error",
      }
    )

    return actionError(ACTION_ERRORS.UPLOAD_FAILED)
  }
}

/**
 * Get all receipts for the current school
 * Supports filtering by status, date range, and user
 */
export async function getReceipts(input?: {
  userId?: string
  status?: "pending" | "processing" | "processed" | "error"
  limit?: number
  offset?: number
  startDate?: Date
  endDate?: Date
}): Promise<ServerActionResponse<GetReceiptsResponse>> {
  try {
    // 1. Authenticate
    const session = await auth()
    if (!session?.user) {
      return actionError(ACTION_ERRORS.UNAUTHORIZED)
    }

    // 2. Get tenant context
    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return actionError(ACTION_ERRORS.MISSING_SCHOOL)
    }

    // 3. Validate input
    const validated = getReceiptsSchema.parse({
      ...input,
      schoolId,
    })

    // 4. Build query filters
    const where: any = {
      schoolId,
    }

    if (validated.userId) {
      where.userId = validated.userId
    }

    if (validated.status) {
      where.status = validated.status
    }

    if (validated.startDate || validated.endDate) {
      where.uploadedAt = {}
      if (validated.startDate) {
        where.uploadedAt.gte = validated.startDate
      }
      if (validated.endDate) {
        where.uploadedAt.lte = validated.endDate
      }
    }

    // 5. Execute query with pagination
    const [receipts, total] = await Promise.all([
      db.expenseReceipt.findMany({
        where,
        orderBy: { uploadedAt: "desc" },
        take: validated.limit,
        skip: validated.offset,
      }),
      db.expenseReceipt.count({ where }),
    ])

    return {
      success: true,
      data: {
        receipts: receipts as ExpenseReceipt[],
        total,
      },
    }
  } catch (error) {
    logger.error(
      "Get receipts failed",
      error instanceof Error ? error : new Error("Unknown error"),
      {
        action: "get_receipts_error",
      }
    )

    return actionError(ACTION_ERRORS.LOAD_FAILED)
  }
}

/**
 * Get a single receipt by ID
 * Verifies tenant ownership
 */
export async function getReceiptById(
  id: string
): Promise<ServerActionResponse<ExpenseReceipt>> {
  try {
    // 1. Authenticate
    const session = await auth()
    if (!session?.user) {
      return actionError(ACTION_ERRORS.UNAUTHORIZED)
    }

    // 2. Get tenant context
    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return actionError(ACTION_ERRORS.MISSING_SCHOOL)
    }

    // 3. Validate input
    const validated = getReceiptByIdSchema.parse({ id, schoolId })

    // 4. Fetch receipt with tenant verification
    const receipt = await db.expenseReceipt.findFirst({
      where: {
        id: validated.id,
        schoolId: validated.schoolId,
      },
    })

    if (!receipt) {
      return actionError(ACTION_ERRORS.RECEIPT_NOT_FOUND)
    }

    return {
      success: true,
      data: receipt as ExpenseReceipt,
    }
  } catch (error) {
    logger.error(
      "Get receipt by ID failed",
      error instanceof Error ? error : new Error("Unknown error"),
      {
        action: "get_receipt_by_id_error",
        receiptId: id,
      }
    )

    return actionError(ACTION_ERRORS.LOAD_FAILED)
  }
}

/**
 * Delete a receipt and its associated file
 * Verifies tenant ownership
 */
export async function deleteReceipt(id: string): Promise<ServerActionResponse> {
  try {
    // 1. Authenticate
    const session = await auth()
    if (!session?.user) {
      return actionError(ACTION_ERRORS.UNAUTHORIZED)
    }

    // 2. Get tenant context
    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return actionError(ACTION_ERRORS.MISSING_SCHOOL)
    }

    // 3. Validate input
    const validated = deleteReceiptSchema.parse({ id, schoolId })

    // 4. Fetch receipt to get file URL
    const receipt = await db.expenseReceipt.findFirst({
      where: {
        id: validated.id,
        schoolId: validated.schoolId,
      },
    })

    if (!receipt) {
      return actionError(ACTION_ERRORS.RECEIPT_NOT_FOUND)
    }

    // 5. Delete file from storage using centralized provider
    const provider = getProvider("aws_s3")
    await provider.delete(receipt.fileUrl)

    logger.info("Receipt file deleted from storage", {
      action: "receipt_file_delete",
      receiptId: id,
      schoolId,
    })

    // 6. Delete database record. deleteMany keeps the schoolId in the WHERE
    // (defense-in-depth: the ownership check above already gates this, but the
    // delete itself must never be reachable for another tenant's id).
    await db.expenseReceipt.deleteMany({
      where: { id, schoolId },
    })

    logger.info("Receipt database record deleted", {
      action: "receipt_db_delete",
      receiptId: id,
      schoolId,
    })

    // 7. Revalidate receipts list page
    revalidatePath(`/s/[subdomain]/(school-dashboard)/finance/receipt`)

    return {
      success: true,
    }
  } catch (error) {
    logger.error(
      "Delete receipt failed",
      error instanceof Error ? error : new Error("Unknown error"),
      {
        action: "delete_receipt_error",
        receiptId: id,
      }
    )

    return actionError(ACTION_ERRORS.DELETE_FAILED)
  }
}

/**
 * Retry AI extraction for a failed receipt
 */
export async function retryReceiptExtraction(
  id: string
): Promise<ServerActionResponse> {
  try {
    // 1. Authenticate
    const session = await auth()
    if (!session?.user) {
      return actionError(ACTION_ERRORS.UNAUTHORIZED)
    }

    // 2. Get tenant context
    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return actionError(ACTION_ERRORS.MISSING_SCHOOL)
    }

    // 3. Verify receipt ownership
    const receipt = await db.expenseReceipt.findFirst({
      where: {
        id,
        schoolId,
      },
    })

    if (!receipt) {
      return actionError(ACTION_ERRORS.RECEIPT_NOT_FOUND)
    }

    // 4. Trigger extraction retry (schoolId-scoped end-to-end)
    await retryExtraction(id, schoolId)

    // 5. Revalidate
    revalidatePath(`/s/[subdomain]/(school-dashboard)/finance/receipt`)
    revalidatePath(`/s/[subdomain]/(school-dashboard)/finance/receipt/${id}`)

    return {
      success: true,
    }
  } catch (error) {
    logger.error(
      "Retry receipt extraction failed",
      error instanceof Error ? error : new Error("Unknown error"),
      {
        action: "retry_extraction_error",
        receiptId: id,
      }
    )

    return actionError(ACTION_ERRORS.UPDATE_FAILED)
  }
}
