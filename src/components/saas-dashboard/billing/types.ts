/**
 * Type definitions for Billing feature
 *
 * These types represent invoices, receipts, and billing-related domain models.
 */

import type { Invoice, Receipt } from "@prisma/client"

/**
 * Base invoice data from Prisma model
 */
export type InvoiceData = Invoice

/**
 * Base receipt data from Prisma model
 */
export type ReceiptData = Receipt

/**
 * Invoice with school/tenant information
 */
export interface InvoiceWithSchool extends Invoice {
  school: {
    id: string
    name: string
    domain: string
  }
}

/**
 * Invoice with receipts
 */
export interface InvoiceWithReceipts extends Invoice {
  receipts: Receipt[]
}

/**
 * Complete invoice detail with all related data
 */
export interface InvoiceDetail extends InvoiceWithSchool {
  receipts: Receipt[]
  appliedDiscounts?: Array<{
    id: string
    discountId: string
    amountCents: number
  }>
}

/**
 * Invoice list item for data tables
 */
export interface InvoiceListItem {
  id: string
  number: string
  tenantName: string
  period: string
  amount: number
  status: InvoiceStatus
  createdAt: string
}

/**
 * Receipt with invoice information
 */
export interface ReceiptWithInvoice extends Receipt {
  invoice: {
    id: string
    number: string
    schoolId: string
  }
  school: {
    id: string
    name: string
    domain: string
  }
}

/**
 * Receipt list item for data tables
 */
export interface ReceiptListItem {
  id: string
  filename: string
  tenantName: string
  invoiceNumber: string
  amount: number
  status: ReceiptStatus
  createdAt: string
}

/**
 * Invoice status enum
 */
export type InvoiceStatus = "draft" | "open" | "paid" | "uncollectible" | "void"

/**
 * Receipt status enum
 */
export type ReceiptStatus = "pending" | "approved" | "rejected"

/**
 * Billing period
 */
export interface BillingPeriod {
  start: Date
  end: Date
  label: string // e.g., "January 2025"
}

/**
 * Billing summary for a tenant
 */
export interface BillingSummary {
  totalInvoices: number
  totalAmount: number
  paidAmount: number
  outstandingAmount: number
  overdueAmount: number
  currency: string
}

/**
 * Invoice action types for audit logging
 */
export type InvoiceActionType =
  | "created"
  | "updated"
  | "paid"
  | "voided"
  | "sent"
  | "reminder_sent"

/**
 * Receipt action types for audit logging
 */
export type ReceiptActionType = "uploaded" | "approved" | "rejected" | "deleted"

/**
 * Invoice filter options
 */
export interface InvoiceFilters {
  search?: string
  number?: string
  tenantName?: string
  status?: InvoiceStatus | ""
  periodStart?: Date
  periodEnd?: Date
  minAmount?: number
  maxAmount?: number
}

/**
 * Receipt filter options
 */
export interface ReceiptFilters {
  search?: string
  tenantName?: string
  invoiceNumber?: string
  status?: ReceiptStatus | ""
  createdAfter?: Date
  createdBefore?: Date
}

/**
 * Invoice sort options
 */
export type InvoiceSortField =
  | "number"
  | "tenantName"
  | "amount"
  | "createdAt"
  | "periodStart"

export interface InvoiceSortOptions {
  field: InvoiceSortField
  direction: "asc" | "desc"
}

/**
 * Payment information
 */
export interface PaymentInfo {
  method: "stripe" | "manual" | "other"
  transactionId?: string
  paidAt: Date
  amount: number
  currency: string
}
