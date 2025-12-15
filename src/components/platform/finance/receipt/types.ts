/**
 * Types for Receipt Tracker Feature
 * Follows Hogwarts pattern conventions
 */

export type ReceiptStatus = "pending" | "processing" | "processed" | "error"

export interface ReceiptItem {
  name: string
  quantity: number
  unitPrice: number
  totalPrice: number
}

export interface ExpenseReceipt {
  id: string
  schoolId: string
  userId: string

  // File information
  fileName: string
  fileDisplayName?: string | null
  fileUrl: string
  fileSize: number
  mimeType: string

  // Processing status
  status: ReceiptStatus

  // Extracted data (OCR results)
  merchantName?: string | null
  merchantAddress?: string | null
  merchantContact?: string | null
  transactionDate?: Date | null
  transactionAmount?: number | null
  currency?: string | null
  receiptSummary?: string | null

  // Line items
  items?: ReceiptItem[] | null

  // Metadata
  uploadedAt: Date
  processedAt?: Date | null
  createdAt: Date
  updatedAt: Date
}

export interface UploadReceiptInput {
  file: File
  schoolId: string
  userId: string
}

export interface ExtractedReceiptData {
  merchantName: string
  merchantAddress: string
  merchantContact: string
  transactionDate: string
  transactionAmount: string
  currency: string
  receiptSummary: string
  items: ReceiptItem[]
}

export interface ServerActionResponse<T = void> {
  success: boolean
  error?: string
  data?: T
}

export interface UploadReceiptResponse {
  receiptId: string
}

export interface GetReceiptsResponse {
  receipts: ExpenseReceipt[]
  total: number
}
