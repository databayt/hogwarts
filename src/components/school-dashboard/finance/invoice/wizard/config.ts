// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { WizardConfig } from "@/components/form/wizard"

export const INVOICE_WIZARD_CONFIG: WizardConfig = {
  id: "invoice",
  steps: ["details", "items"],
  groups: {
    1: ["details"],
    2: ["items"],
  },
  groupLabels: ["Invoice Details", "Line Items"],
  requiredSteps: ["details", "items"],
  finalLabel: "Create Invoice",
}

export const INVOICE_STATUS_OPTIONS = [
  { label: "Unpaid", value: "UNPAID" },
  { label: "Paid", value: "PAID" },
  { label: "Overdue", value: "OVERDUE" },
  { label: "Cancelled", value: "CANCELLED" },
] as const

export const CURRENCY_OPTIONS = [
  { label: "USD", value: "USD" },
  { label: "EUR", value: "EUR" },
  { label: "GBP", value: "GBP" },
  { label: "SDG", value: "SDG" },
  { label: "SAR", value: "SAR" },
  { label: "AED", value: "AED" },
] as const

// --- Dictionary-based factory functions ---

type Dict = Record<string, any> | undefined

/** Get localized invoice wizard config from dictionary */
export const getInvoiceWizardConfig = (d?: Dict): WizardConfig => {
  const w = d?.wizard as Record<string, any> | undefined
  const gl = w?.groupLabels as Record<string, string> | undefined
  return {
    id: "invoice",
    steps: ["details", "items"],
    groups: {
      1: ["details"],
      2: ["items"],
    },
    groupLabels: [
      gl?.invoiceDetails || "Invoice Details",
      gl?.lineItems || "Line Items",
    ],
    requiredSteps: ["details", "items"],
    finalLabel: w?.finalLabel || "Create Invoice",
  }
}

/** Get localized invoice status options from dictionary */
export const getInvoiceStatusOptions = (d?: Dict) => {
  const s = d?.invoiceStatus as Record<string, string> | undefined
  return [
    { label: s?.unpaid || "Unpaid", value: "UNPAID" },
    { label: s?.paid || "Paid", value: "PAID" },
    { label: s?.overdue || "Overdue", value: "OVERDUE" },
    { label: s?.cancelled || "Cancelled", value: "CANCELLED" },
  ]
}

/** Get localized currency options from dictionary */
export const getCurrencyOptions = (d?: Dict) => {
  const c = d?.currency as Record<string, string> | undefined
  return [
    { label: c?.USD || "USD", value: "USD" },
    { label: c?.EUR || "EUR", value: "EUR" },
    { label: c?.GBP || "GBP", value: "GBP" },
    { label: c?.SDG || "SDG", value: "SDG" },
    { label: c?.SAR || "SAR", value: "SAR" },
    { label: c?.AED || "AED", value: "AED" },
  ]
}
