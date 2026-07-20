// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Zod Validation Schemas for Receipt Tracker
 * Follows Hogwarts validation pattern
 */

import { z } from "zod"

import type { ValidationHelper } from "@/components/internationalization/helpers"

// ============================================================================
// Schema Factory Functions (i18n-enabled)
// ============================================================================

const createReceiptItemSchemaFactory = (v: ValidationHelper) =>
  z.object({
    name: z.string().min(1, v.required()),
    quantity: z.number().positive(v.positive()),
    unitPrice: z.number().nonnegative(v.min(0)),
    totalPrice: z.number().nonnegative(v.min(0)),
  })

export const createExtractedReceiptDataSchema = (v: ValidationHelper) =>
  z.object({
    merchantName: z.string().min(1, v.required()),
    merchantAddress: z.string().min(1, v.required()),
    merchantContact: z.string().optional().default(""),
    transactionDate: z.string().min(1, v.required()),
    transactionAmount: z.string().min(1, v.required()),
    currency: z.string().min(1, v.required()).default("USD"),
    receiptSummary: z.string().optional().default(""),
    items: z.array(createReceiptItemSchemaFactory(v)).min(1, v.required()),
  })

export const createUploadReceiptSchema = (v: ValidationHelper) =>
  z.object({
    file: z
      .instanceof(File)
      .refine((file) => file.size > 0, v.required())
      .refine(
        (file) => file.size <= 10 * 1024 * 1024,
        "File size must be less than 10MB" // TODO: add custom validation key
      )
      .refine(
        (file) =>
          ["image/jpeg", "image/png", "image/webp", "application/pdf"].includes(
            file.type
          ),
        "File must be an image (JPEG, PNG, WEBP) or PDF" // TODO: add custom validation key
      ),
    schoolId: z.string().min(1, v.required()),
    userId: z.string().min(1, v.required()),
  })

export const createUpdateReceiptSchema = (v: ValidationHelper) =>
  z.object({
    id: z.string().min(1, v.required()),
    fileDisplayName: z.string().optional(),
    merchantName: z.string().optional(),
    merchantAddress: z.string().optional(),
    merchantContact: z.string().optional(),
    transactionDate: z.date().optional(),
    transactionAmount: z.number().optional(),
    currency: z.string().optional(),
    receiptSummary: z.string().optional(),
    items: z.array(createReceiptItemSchemaFactory(v)).optional(),
  })

export const createDeleteReceiptSchema = (v: ValidationHelper) =>
  z.object({
    id: z.string().min(1, v.required()),
    schoolId: z.string().min(1, v.required()),
  })

export const createGetReceiptsSchema = (v: ValidationHelper) =>
  z.object({
    schoolId: z.string().min(1, v.required()),
    userId: z.string().optional(),
    status: z.enum(["pending", "processing", "processed", "error"]).optional(),
    /** Free-text search across merchantName/fileDisplayName/fileName. */
    search: z.string().optional(),
    limit: z.number().int().positive().max(100).default(50).optional(),
    offset: z.number().int().nonnegative().default(0).optional(),
    startDate: z.date().optional(),
    endDate: z.date().optional(),
  })

export const createGetReceiptByIdSchema = (v: ValidationHelper) =>
  z.object({
    id: z.string().min(1, v.required()),
    schoolId: z.string().min(1, v.required()),
  })

// ============================================================================
// Static Schemas (server-side fallback)
// ============================================================================

// Receipt item schema
export const receiptItemSchema = z.object({
  name: z.string().min(1, "Item name is required"),
  quantity: z.number().positive("Quantity must be positive"),
  unitPrice: z.number().nonnegative("Unit price must be non-negative"),
  totalPrice: z.number().nonnegative("Total price must be non-negative"),
})

// Extracted receipt data schema (from AI)
export const extractedReceiptDataSchema = z.object({
  merchantName: z.string().min(1, "Merchant name is required"),
  merchantAddress: z.string().min(1, "Merchant address is required"),
  merchantContact: z.string().optional().default(""),
  transactionDate: z.string().min(1, "Transaction date is required"),
  transactionAmount: z.string().min(1, "Transaction amount is required"),
  currency: z.string().min(1, "Currency is required").default("USD"),
  receiptSummary: z.string().optional().default(""),
  items: z.array(receiptItemSchema).min(1, "At least one item is required"),
})

// Upload receipt schema
export const uploadReceiptSchema = z.object({
  file: z
    .instanceof(File)
    .refine((file) => file.size > 0, "File cannot be empty")
    .refine(
      (file) => file.size <= 10 * 1024 * 1024, // 10MB
      "File size must be less than 10MB"
    )
    .refine(
      (file) =>
        ["image/jpeg", "image/png", "image/webp", "application/pdf"].includes(
          file.type
        ),
      "File must be an image (JPEG, PNG, WEBP) or PDF"
    ),
  schoolId: z.string().min(1, "School ID is required"),
  userId: z.string().min(1, "User ID is required"),
})

// Update receipt schema
export const updateReceiptSchema = z.object({
  id: z.string().min(1, "Receipt ID is required"),
  fileDisplayName: z.string().optional(),
  merchantName: z.string().optional(),
  merchantAddress: z.string().optional(),
  merchantContact: z.string().optional(),
  transactionDate: z.date().optional(),
  transactionAmount: z.number().optional(),
  currency: z.string().optional(),
  receiptSummary: z.string().optional(),
  items: z.array(receiptItemSchema).optional(),
})

// Delete receipt schema
export const deleteReceiptSchema = z.object({
  id: z.string().min(1, "Receipt ID is required"),
  schoolId: z.string().min(1, "School ID is required"),
})

// Get receipts query schema
export const getReceiptsSchema = z.object({
  schoolId: z.string().min(1, "School ID is required"),
  userId: z.string().optional(),
  status: z.enum(["pending", "processing", "processed", "error"]).optional(),
  /** Free-text search across merchantName/fileDisplayName/fileName. */
  search: z.string().optional(),
  limit: z.number().int().positive().max(100).default(50).optional(),
  offset: z.number().int().nonnegative().default(0).optional(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
})

// Get receipt by ID schema
export const getReceiptByIdSchema = z.object({
  id: z.string().min(1, "Receipt ID is required"),
  schoolId: z.string().min(1, "School ID is required"),
})

// Type inference exports
export type UploadReceiptInput = z.infer<typeof uploadReceiptSchema>
export type UpdateReceiptInput = z.infer<typeof updateReceiptSchema>
export type DeleteReceiptInput = z.infer<typeof deleteReceiptSchema>
export type GetReceiptsInput = z.infer<typeof getReceiptsSchema>
export type GetReceiptByIdInput = z.infer<typeof getReceiptByIdSchema>
export type ExtractedReceiptData = z.infer<typeof extractedReceiptDataSchema>
export type ReceiptItem = z.infer<typeof receiptItemSchema>
