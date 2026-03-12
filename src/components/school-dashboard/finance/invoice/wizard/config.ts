// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import type { WizardConfig } from "@/components/form/wizard"

export const INVOICE_WIZARD_CONFIG: WizardConfig = {
  id: "invoice",
  steps: ["details", "items", "review"],
  groups: {
    1: ["details"],
    2: ["items"],
    3: ["review"],
  },
  groupLabels: ["Invoice Details", "Line Items", "Review"],
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
