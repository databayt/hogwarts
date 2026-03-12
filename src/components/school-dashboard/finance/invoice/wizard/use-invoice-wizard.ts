// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details

import { createWizardProvider } from "@/components/form/wizard"

import { getInvoiceForWizard } from "./actions"

export interface InvoiceWizardData {
  id: string
  schoolId: string
  invoice_no: string
  invoice_date: Date
  due_date: Date
  currency: string
  sub_total: number
  discount: number | null
  tax_percentage: number | null
  total: number
  notes: string | null
  status: string
  userId: string
  wizardStep: string | null
  from: {
    id: string
    name: string
    email: string | null
    address1: string
    address2: string | null
    address3: string | null
  }
  to: {
    id: string
    name: string
    email: string | null
    address1: string
    address2: string | null
    address3: string | null
  }
  items: {
    id: string
    item_name: string
    quantity: number
    price: number
    total: number
  }[]
}

export const {
  Provider: InvoiceWizardProvider,
  useWizardData: useInvoiceWizard,
} = createWizardProvider<InvoiceWizardData>("Invoice", {
  loadFn: getInvoiceForWizard,
})
