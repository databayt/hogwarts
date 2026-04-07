// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

// Centralized constants for the Invoice feature

export const STEPS = {
  1: "Company & Client",
  2: "Invoice Details & Items",
  3: "Review & Submit",
} as const

export const STEP_FIELDS = {
  1: ["from", "to"] as const,
  2: ["invoice_no", "currency", "invoice_date", "due_date", "items"] as const,
  3: ["sub_total", "discount", "tax_percentage", "total", "notes"] as const,
} as const

export const TOTAL_FIELDS = [
  ...STEP_FIELDS[1],
  ...STEP_FIELDS[2],
  ...STEP_FIELDS[3],
].length

export const CURRENCY_OPTIONS = [
  { label: "USD", value: "USD" },
  { label: "EUR", value: "EUR" },
  { label: "GBP", value: "GBP" },
  { label: "INR", value: "INR" },
  { label: "CAD", value: "CAD" },
  { label: "AUD", value: "AUD" },
] as const

// --- Dictionary-based factory functions ---

type Dict = Record<string, any> | undefined

/** Get localized wizard step labels from dictionary (finance.invoiceConfig.steps) */
export const getStepLabels = (d?: Dict) => {
  const s = d?.steps as Record<string, string> | undefined
  return {
    1: s?.companyClient || "Company & Client",
    2: s?.invoiceDetailsItems || "Invoice Details & Items",
    3: s?.reviewSubmit || "Review & Submit",
  } as const
}

/** Get localized currency options from dictionary */
export const getCurrencyOptions = (d?: Dict) => {
  const c = d?.currency as Record<string, string> | undefined
  return [
    { label: c?.USD || "USD", value: "USD" },
    { label: c?.EUR || "EUR", value: "EUR" },
    { label: c?.GBP || "GBP", value: "GBP" },
    { label: c?.INR || "INR", value: "INR" },
    { label: c?.CAD || "CAD", value: "CAD" },
    { label: c?.AUD || "AUD", value: "AUD" },
  ]
}
