/**
 * Constants for Billing feature
 *
 * Static configuration data, enums, and lookup tables for billing management.
 */

import type { InvoiceStatus, ReceiptStatus } from "./types";

/**
 * Available invoice statuses
 */
export const INVOICE_STATUSES: readonly InvoiceStatus[] = [
  "draft",
  "open",
  "paid",
  "uncollectible",
  "void",
] as const;

/**
 * Invoice status display labels
 */
export const INVOICE_STATUS_LABELS: Record<InvoiceStatus, string> = {
  draft: "Draft",
  open: "Open",
  paid: "Paid",
  uncollectible: "Uncollectible",
  void: "Void",
} as const;

/**
 * Invoice status badge variants
 */
export const INVOICE_STATUS_VARIANTS: Record<
  InvoiceStatus,
  "default" | "secondary" | "destructive" | "outline"
> = {
  draft: "outline",
  open: "secondary",
  paid: "default",
  uncollectible: "destructive",
  void: "destructive",
} as const;

/**
 * Available receipt statuses
 */
export const RECEIPT_STATUSES: readonly ReceiptStatus[] = ["pending", "approved", "rejected"] as const;

/**
 * Receipt status display labels
 */
export const RECEIPT_STATUS_LABELS: Record<ReceiptStatus, string> = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
} as const;

/**
 * Receipt status badge variants
 */
export const RECEIPT_STATUS_VARIANTS: Record<
  ReceiptStatus,
  "default" | "secondary" | "destructive" | "outline"
> = {
  pending: "outline",
  approved: "default",
  rejected: "destructive",
} as const;

/**
 * Default pagination options
 */
export const DEFAULT_PAGE_SIZE = 10;
export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const;

/**
 * Invoice table column IDs
 */
export const INVOICE_TABLE_COLUMNS = {
  NUMBER: "number",
  TENANT_NAME: "tenantName",
  PERIOD: "period",
  AMOUNT: "amount",
  STATUS: "status",
  CREATED_AT: "createdAt",
  ACTIONS: "actions",
} as const;

/**
 * Receipt table column IDs
 */
export const RECEIPT_TABLE_COLUMNS = {
  FILENAME: "filename",
  TENANT_NAME: "tenantName",
  INVOICE_NUMBER: "invoiceNumber",
  AMOUNT: "amount",
  STATUS: "status",
  CREATED_AT: "createdAt",
  ACTIONS: "actions",
} as const;

/**
 * Sortable invoice columns
 */
export const SORTABLE_INVOICE_COLUMNS = [
  INVOICE_TABLE_COLUMNS.NUMBER,
  INVOICE_TABLE_COLUMNS.TENANT_NAME,
  INVOICE_TABLE_COLUMNS.AMOUNT,
  INVOICE_TABLE_COLUMNS.CREATED_AT,
] as const;

/**
 * Filterable invoice columns
 */
export const FILTERABLE_INVOICE_COLUMNS = [
  INVOICE_TABLE_COLUMNS.NUMBER,
  INVOICE_TABLE_COLUMNS.TENANT_NAME,
  INVOICE_TABLE_COLUMNS.STATUS,
] as const;

/**
 * Default currency
 */
export const DEFAULT_CURRENCY = "USD";

/**
 * Supported currencies
 */
export const SUPPORTED_CURRENCIES = ["USD", "EUR", "GBP", "SDG"] as const;

/**
 * Currency symbols
 */
export const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: "$",
  EUR: "€",
  GBP: "£",
  SDG: "SDG",
} as const;

/**
 * Invoice action types for audit logging
 */
export const INVOICE_ACTIONS = {
  CREATED: "created",
  UPDATED: "updated",
  PAID: "paid",
  VOIDED: "voided",
  SENT: "sent",
  REMINDER_SENT: "reminder_sent",
} as const;

/**
 * Receipt action types for audit logging
 */
export const RECEIPT_ACTIONS = {
  UPLOADED: "uploaded",
  APPROVED: "approved",
  REJECTED: "rejected",
  DELETED: "deleted",
} as const;

/**
 * Allowed file types for receipt upload
 */
export const ALLOWED_RECEIPT_FILE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "application/pdf",
] as const;

/**
 * Maximum file size for receipts (5MB)
 */
export const MAX_RECEIPT_FILE_SIZE = 5 * 1024 * 1024;

/**
 * Invoice number prefix
 */
export const INVOICE_NUMBER_PREFIX = "INV-";

/**
 * Default invoice due days
 */
export const DEFAULT_INVOICE_DUE_DAYS = 30;

/**
 * Grace period days before marking as overdue
 */
export const GRACE_PERIOD_DAYS = 7;

/**
 * Payment terms options
 */
export const PAYMENT_TERMS = {
  NET_15: { value: "net_15", label: "Net 15", days: 15 },
  NET_30: { value: "net_30", label: "Net 30", days: 30 },
  NET_60: { value: "net_60", label: "Net 60", days: 60 },
  NET_90: { value: "net_90", label: "Net 90", days: 90 },
  DUE_ON_RECEIPT: { value: "due_on_receipt", label: "Due on Receipt", days: 0 },
} as const;

/**
 * Validation rules
 */
export const VALIDATION_RULES = {
  INVOICE_NUMBER_MIN_LENGTH: 3,
  INVOICE_NUMBER_MAX_LENGTH: 50,
  AMOUNT_MIN: 0,
  AMOUNT_MAX: 999999999, // $9,999,999.99
  FILENAME_MAX_LENGTH: 255,
} as const;

/**
 * Error messages
 */
export const ERROR_MESSAGES = {
  INVOICE_NOT_FOUND: "Invoice not found",
  RECEIPT_NOT_FOUND: "Receipt not found",
  INVALID_STATUS: "Invalid status",
  INVALID_AMOUNT: "Amount must be a positive number",
  AMOUNT_TOO_LARGE: "Amount exceeds maximum allowed value",
  FILE_TOO_LARGE: `File size must be less than ${MAX_RECEIPT_FILE_SIZE / (1024 * 1024)}MB`,
  INVALID_FILE_TYPE: "Only JPG, PNG, GIF, and PDF files are allowed",
  UPLOAD_FAILED: "Failed to upload receipt",
  ALREADY_PAID: "Invoice is already paid",
  ALREADY_VOIDED: "Invoice is already voided",
} as const;
