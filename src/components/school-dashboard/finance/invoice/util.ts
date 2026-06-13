// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { InvoiceStatus } from "@prisma/client"

/**
 * Utility functions for Invoice components
 */

// Types aligned with Prisma model
interface InvoiceItem {
  id: string
  item_name: string
  quantity: number
  price: number
}

interface InvoiceData {
  from: { name: string }
  to: { name: string; email?: string | null }
  items: InvoiceItem[]
  sub_total?: number
  discount?: number
  tax_percentage?: number
  total?: number
  due_date?: Date | string
  status: InvoiceStatus
}

/**
 * Calculate invoice subtotal
 */
export function calculateSubtotal(items: InvoiceItem[]): number {
  return items.reduce((sum, item) => sum + item.quantity * item.price, 0)
}

/**
 * Calculate discount amount
 */
export function calculateDiscount(
  subtotal: number,
  discountRate: number
): number {
  return subtotal * (discountRate / 100)
}

/**
 * Calculate tax amount
 */
export function calculateTax(amount: number, taxRate: number): number {
  return amount * (taxRate / 100)
}

/**
 * Calculate invoice total
 */
export function calculateTotal(
  items: InvoiceItem[],
  taxRate: number = 0,
  discountRate: number = 0
): {
  subtotal: number
  discount: number
  taxableAmount: number
  tax: number
  total: number
} {
  const subtotal = calculateSubtotal(items)
  const discount = calculateDiscount(subtotal, discountRate)
  const taxableAmount = subtotal - discount
  const tax = calculateTax(taxableAmount, taxRate)
  const total = taxableAmount + tax

  return {
    subtotal,
    discount,
    taxableAmount,
    tax,
    total,
  }
}

/**
 * Format currency
 */
export function formatCurrency(
  amount: number,
  currency = "USD",
  locale = "ar"
): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
  }).format(amount)
}

/**
 * Format invoice number
 */
export function formatInvoiceNumber(
  prefix: string,
  number: number,
  length = 6
): string {
  return `${prefix}-${number.toString().padStart(length, "0")}`
}

/**
 * Generate invoice number
 */
export function generateInvoiceNumber(
  lastNumber: number,
  prefix = "INV"
): string {
  return formatInvoiceNumber(prefix, lastNumber + 1)
}

/**
 * Check if invoice is overdue
 */
export function isInvoiceOverdue(
  dueDate: Date | string,
  status: InvoiceStatus | string
): boolean {
  if (status === InvoiceStatus.PAID || status === InvoiceStatus.CANCELLED)
    return false

  const due = typeof dueDate === "string" ? new Date(dueDate) : dueDate
  return new Date() > due
}

/**
 * Calculate days overdue
 */
export function getDaysOverdue(dueDate: Date | string): number {
  const due = typeof dueDate === "string" ? new Date(dueDate) : dueDate
  const today = new Date()
  const diffTime = today.getTime() - due.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return Math.max(0, diffDays)
}

/**
 * Calculate days until due
 */
export function getDaysUntilDue(dueDate: Date | string): number {
  const due = typeof dueDate === "string" ? new Date(dueDate) : dueDate
  const today = new Date()
  const diffTime = due.getTime() - today.getTime()
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

/**
 * Format due date status
 */
export function formatDueStatus(
  dueDate: Date | string,
  status: InvoiceStatus | string,
  d?: Record<string, string>
): string {
  if (status === InvoiceStatus.PAID) return d?.paid ?? "Paid"
  if (status === InvoiceStatus.CANCELLED) return d?.void ?? "Cancelled"

  const daysUntil = getDaysUntilDue(dueDate)

  if (daysUntil < 0) {
    return `${d?.overdueBy ?? "Overdue by"} ${Math.abs(daysUntil)} ${d?.days ?? "days"}`
  }
  if (daysUntil === 0) return d?.dueToday ?? "Due today"
  if (daysUntil === 1) return d?.dueTomorrow ?? "Due tomorrow"
  return `${d?.dueIn ?? "Due in"} ${daysUntil} ${d?.days ?? "days"}`
}

/**
 * Get invoice status color
 */
export function getInvoiceStatusColor(status: InvoiceStatus | string): string {
  const colors: Record<InvoiceStatus, string> = {
    PAID: "green",
    UNPAID: "blue",
    PARTIAL: "amber",
    OVERDUE: "red",
    CANCELLED: "gray",
  }
  return colors[status as InvoiceStatus] ?? "gray"
}

/**
 * Validate invoice data
 */
export function validateInvoiceData(
  data: Partial<InvoiceData>,
  d?: Record<string, string>
): string[] {
  const errors: string[] = []

  if (!data.to?.name || data.to.name.trim() === "") {
    errors.push(d?.clientNameRequired ?? "Client name is required")
  }

  if (!data.to?.email || !isValidEmail(data.to.email)) {
    errors.push(d?.validClientEmail ?? "Valid client email is required")
  }

  if (!data.items || data.items.length === 0) {
    errors.push(d?.atLeastOneItem ?? "At least one item is required")
  }

  data.items?.forEach((item, index) => {
    if (!item.item_name || item.item_name.trim() === "") {
      errors.push(
        `${item.item_name || `Item ${index + 1}`}: ${d?.itemNameRequired ?? "Name is required"}`
      )
    }
    if (item.quantity <= 0) {
      errors.push(
        `${item.item_name || `Item ${index + 1}`}: ${d?.quantityGreaterThanZero ?? "Quantity must be greater than 0"}`
      )
    }
    if (item.price < 0) {
      errors.push(
        `${item.item_name || `Item ${index + 1}`}: ${d?.priceCannotBeNegative ?? "Price cannot be negative"}`
      )
    }
  })

  if (data.due_date && new Date(data.due_date) < new Date()) {
    errors.push(d?.dueDatePast ?? "Due date cannot be in the past")
  }

  return errors
}

/**
 * Validate email format
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Export invoice data to CSV
 */
export function exportInvoiceToCSV(
  invoice: InvoiceData,
  d?: Record<string, string>
): string {
  const headers = [
    d?.description ?? "Item",
    d?.quantity ?? "Quantity",
    d?.price ?? "Price",
    d?.amount ?? "Amount",
  ]
  const rows = invoice.items.map((item) => [
    item.item_name,
    item.quantity.toString(),
    formatCurrency(item.price),
    formatCurrency(item.quantity * item.price),
  ])

  const csvContent = [
    headers.join(","),
    ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    "",
    `${d?.subtotal ?? "Subtotal"},,, ${formatCurrency(invoice.sub_total || 0)}`,
    `${d?.discount ?? "Discount"},,, ${formatCurrency(invoice.discount || 0)}`,
    `${d?.tax ?? "Tax"},,, ${formatCurrency(invoice.tax_percentage || 0)}`,
    `${d?.total ?? "Total"},,, ${formatCurrency(invoice.total || 0)}`,
  ].join("\n")

  return csvContent
}

/**
 * Calculate payment schedule for recurring invoices
 */
export function calculatePaymentSchedule(
  startDate: Date,
  frequency: "weekly" | "monthly" | "quarterly" | "yearly",
  occurrences: number
): Date[] {
  const dates: Date[] = []
  const currentDate = new Date(startDate)

  for (let i = 0; i < occurrences; i++) {
    dates.push(new Date(currentDate))

    switch (frequency) {
      case "weekly":
        currentDate.setDate(currentDate.getDate() + 7)
        break
      case "monthly":
        currentDate.setMonth(currentDate.getMonth() + 1)
        break
      case "quarterly":
        currentDate.setMonth(currentDate.getMonth() + 3)
        break
      case "yearly":
        currentDate.setFullYear(currentDate.getFullYear() + 1)
        break
    }
  }

  return dates
}
