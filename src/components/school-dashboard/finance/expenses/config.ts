/**
 * Expenses Module - Configuration
 */

import { ExpenseStatus } from "@prisma/client"

export const ExpenseStatusLabels: Record<ExpenseStatus, string> = {
  PENDING: "Pending Approval",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  PAID: "Paid",
  CANCELLED: "Cancelled",
}

export const ExpenseStatusColors: Record<ExpenseStatus, string> = {
  PENDING: "warning",
  APPROVED: "success",
  REJECTED: "destructive",
  PAID: "secondary",
  CANCELLED: "secondary",
}

export const DefaultExpenseCategories = [
  "OFFICE_SUPPLIES",
  "TRAVEL",
  "MEALS",
  "UTILITIES",
  "MAINTENANCE",
  "EQUIPMENT",
  "SOFTWARE",
  "PROFESSIONAL_SERVICES",
  "MARKETING",
  "OTHER",
] as const

export type DefaultExpenseCategory = (typeof DefaultExpenseCategories)[number]

export const DefaultExpenseCategoryLabels: Record<
  DefaultExpenseCategory,
  string
> = {
  OFFICE_SUPPLIES: "Office Supplies",
  TRAVEL: "Travel & Transportation",
  MEALS: "Meals & Entertainment",
  UTILITIES: "Utilities",
  MAINTENANCE: "Maintenance & Repairs",
  EQUIPMENT: "Equipment",
  SOFTWARE: "Software & Subscriptions",
  PROFESSIONAL_SERVICES: "Professional Services",
  MARKETING: "Marketing & Advertising",
  OTHER: "Other",
}

export const EXPENSE_LIMITS = {
  MAX_AMOUNT_WITHOUT_RECEIPT: 5000, // $50.00 in cents
  MAX_AMOUNT_WITHOUT_APPROVAL: 10000, // $100.00 in cents
  MAX_AMOUNT_GENERAL: 1000000, // $10,000.00 in cents
} as const

export const RECEIPT_CONFIG = {
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_TYPES: ["image/jpeg", "image/png", "image/jpg", "application/pdf"],
} as const
