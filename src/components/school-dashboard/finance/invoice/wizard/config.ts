// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { currencyOption } from "@/lib/utils"
import type { WizardConfig } from "@/components/form/wizard"

type Dict = Record<string, any> | undefined

/** Get localized invoice wizard config from dictionary (finance.invoiceConfig.wizard) */
export const getInvoiceWizardConfig = (d?: Dict): WizardConfig => {
  const w = d as Record<string, any> | undefined
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

/** Get localized invoice status options from dictionary (finance.invoiceConfig.wizard) */
export const getInvoiceStatusOptions = (d?: Dict) => {
  const s = d?.invoiceStatus as Record<string, string> | undefined
  return [
    { label: s?.unpaid || "Unpaid", value: "UNPAID" },
    { label: s?.paid || "Paid", value: "PAID" },
    { label: s?.overdue || "Overdue", value: "OVERDUE" },
    { label: s?.cancelled || "Cancelled", value: "CANCELLED" },
  ]
}

/** Get localized currency options from dictionary.
 *  Derives from the canonical `currencyOption` list in `@/lib/utils` so the
 *  invoice wizard never maintains its own divergent currency set. */
export const getCurrencyOptions = (d?: Dict) => {
  const c = d?.currency as Record<string, string> | undefined
  return currencyOption.map(({ value }) => ({
    label: c?.[value] || value,
    value,
  }))
}
