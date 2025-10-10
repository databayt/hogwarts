/**
 * Utility functions for Billing feature
 *
 * Helper functions for invoice and receipt data manipulation, formatting, and validation.
 */

import type { InvoiceStatus, ReceiptStatus, BillingPeriod } from "./types";
import {
  INVOICE_STATUS_LABELS,
  RECEIPT_STATUS_LABELS,
  CURRENCY_SYMBOLS,
  DEFAULT_CURRENCY,
  INVOICE_NUMBER_PREFIX,
  DEFAULT_INVOICE_DUE_DAYS,
  GRACE_PERIOD_DAYS,
  ALLOWED_RECEIPT_FILE_TYPES,
  MAX_RECEIPT_FILE_SIZE,
} from "./config";

/**
 * Format currency amount from cents
 */
export function formatCurrency(cents: number, currency = DEFAULT_CURRENCY): string {
  const amount = cents / 100;
  const symbol = CURRENCY_SYMBOLS[currency] || "$";

  return `${symbol}${amount.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * Format currency with full locale support
 */
export function formatCurrencyFull(cents: number, currency = DEFAULT_CURRENCY): string {
  const amount = cents / 100;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(amount);
}

/**
 * Parse currency string to cents
 */
export function parseCurrencyToCents(value: string): number {
  const cleaned = value.replace(/[^0-9.]/g, "");
  const amount = parseFloat(cleaned);
  return Math.round(amount * 100);
}

/**
 * Get invoice status label
 */
export function getInvoiceStatusLabel(status: InvoiceStatus): string {
  return INVOICE_STATUS_LABELS[status];
}

/**
 * Get receipt status label
 */
export function getReceiptStatusLabel(status: ReceiptStatus): string {
  return RECEIPT_STATUS_LABELS[status];
}

/**
 * Generate invoice number
 */
export function generateInvoiceNumber(sequence: number): string {
  return `${INVOICE_NUMBER_PREFIX}${sequence.toString().padStart(6, "0")}`;
}

/**
 * Calculate invoice due date
 */
export function calculateDueDate(issueDate: Date, dueDays = DEFAULT_INVOICE_DUE_DAYS): Date {
  const dueDate = new Date(issueDate);
  dueDate.setDate(dueDate.getDate() + dueDays);
  return dueDate;
}

/**
 * Check if invoice is overdue
 */
export function isInvoiceOverdue(
  dueDate: Date | string,
  status: InvoiceStatus,
  gracePeriod = GRACE_PERIOD_DAYS
): boolean {
  if (status === "paid" || status === "void") return false;

  const due = typeof dueDate === "string" ? new Date(dueDate) : dueDate;
  const grace = new Date(due);
  grace.setDate(grace.getDate() + gracePeriod);

  return new Date() > grace;
}

/**
 * Get days until/since due
 */
export function getDaysUntilDue(dueDate: Date | string): number {
  const due = typeof dueDate === "string" ? new Date(dueDate) : dueDate;
  const now = new Date();
  const diffTime = due.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Format due date status
 */
export function formatDueStatus(dueDate: Date | string, status: InvoiceStatus): string {
  if (status === "paid") return "Paid";
  if (status === "void") return "Void";

  const daysUntil = getDaysUntilDue(dueDate);

  if (daysUntil < 0) return `Overdue by ${Math.abs(daysUntil)} days`;
  if (daysUntil === 0) return "Due today";
  if (daysUntil === 1) return "Due tomorrow";
  return `Due in ${daysUntil} days`;
}

/**
 * Format billing period
 */
export function formatBillingPeriod(start: Date | string, end: Date | string): string {
  const startDate = typeof start === "string" ? new Date(start) : start;
  const endDate = typeof end === "string" ? new Date(end) : end;

  const formatter = new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
  });

  if (startDate.getMonth() === endDate.getMonth() && startDate.getFullYear() === endDate.getFullYear()) {
    return formatter.format(startDate);
  }

  return `${formatter.format(startDate)} - ${formatter.format(endDate)}`;
}

/**
 * Get billing period from date
 */
export function getBillingPeriod(date: Date): BillingPeriod {
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);

  return {
    start,
    end,
    label: new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "long",
    }).format(date),
  };
}

/**
 * Check if invoice can be paid
 */
export function canPayInvoice(status: InvoiceStatus): boolean {
  return status === "open" || status === "draft";
}

/**
 * Check if invoice can be voided
 */
export function canVoidInvoice(status: InvoiceStatus): boolean {
  return status !== "void" && status !== "paid";
}

/**
 * Check if receipt can be approved
 */
export function canApproveReceipt(status: ReceiptStatus): boolean {
  return status === "pending";
}

/**
 * Check if receipt can be rejected
 */
export function canRejectReceipt(status: ReceiptStatus): boolean {
  return status === "pending";
}

/**
 * Validate receipt file type
 */
export function isValidReceiptFileType(file: File): boolean {
  return ALLOWED_RECEIPT_FILE_TYPES.includes(file.type as typeof ALLOWED_RECEIPT_FILE_TYPES[number]);
}

/**
 * Validate receipt file size
 */
export function isValidReceiptFileSize(file: File): boolean {
  return file.size <= MAX_RECEIPT_FILE_SIZE;
}

/**
 * Get file extension from filename
 */
export function getFileExtension(filename: string): string {
  const parts = filename.split(".");
  return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : "";
}

/**
 * Format file size
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * Calculate total from invoice items
 */
export function calculateInvoiceTotal(items: Array<{ amount: number }>): number {
  return items.reduce((sum, item) => sum + item.amount, 0);
}

/**
 * Calculate outstanding balance
 */
export function calculateOutstanding(amountDue: number, amountPaid: number): number {
  return Math.max(0, amountDue - amountPaid);
}

/**
 * Format invoice status for display
 */
export function formatInvoiceStatus(status: InvoiceStatus, amountDue: number, amountPaid: number): string {
  if (status === "paid") return "Paid in full";
  if (status === "void") return "Voided";

  const outstanding = calculateOutstanding(amountDue, amountPaid);
  if (outstanding === 0) return "Paid";
  if (amountPaid > 0) return `Partially paid (${formatCurrency(outstanding)} due)`;

  return INVOICE_STATUS_LABELS[status];
}

/**
 * Sort invoices by field
 */
export function sortInvoices<T extends { number?: string; tenantName?: string; amount?: number; createdAt?: Date | string }>(
  invoices: T[],
  field: "number" | "tenantName" | "amount" | "createdAt",
  direction: "asc" | "desc" = "asc"
): T[] {
  return [...invoices].sort((a, b) => {
    let aVal = a[field];
    let bVal = b[field];

    // Handle date fields separately
    if (field === "createdAt") {
      const aTime = typeof aVal === "string" ? new Date(aVal).getTime() : (aVal as Date)?.getTime() || 0;
      const bTime = typeof bVal === "string" ? new Date(bVal).getTime() : (bVal as Date)?.getTime() || 0;
      return direction === "asc" ? aTime - bTime : bTime - aTime;
    }

    if (aVal === undefined || aVal === null) return 1;
    if (bVal === undefined || bVal === null) return -1;

    if (typeof aVal === "string" && typeof bVal === "string") {
      return direction === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    }

    if (typeof aVal === "number" && typeof bVal === "number") {
      return direction === "asc" ? aVal - bVal : bVal - aVal;
    }

    return 0;
  });
}

/**
 * Get invoice health status
 */
export function getInvoiceHealth(
  status: InvoiceStatus,
  dueDate: Date | string
): "healthy" | "warning" | "critical" {
  if (status === "paid") return "healthy";
  if (status === "void" || status === "uncollectible") return "critical";

  if (isInvoiceOverdue(dueDate, status)) return "critical";

  const daysUntil = getDaysUntilDue(dueDate);
  if (daysUntil <= 7) return "warning";

  return "healthy";
}
