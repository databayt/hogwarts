// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

/**
 * Shared types for receipts feature
 */

export type ReceiptRow = {
  id: string
  schoolName: string
  invoiceNumber: string
  amount: number
  fileUrl: string | null
  fileName: string | null
  status: "pending" | "approved" | "rejected"
  uploadedAt: string
  reviewedAt: string | null
  notes: string | null
}
