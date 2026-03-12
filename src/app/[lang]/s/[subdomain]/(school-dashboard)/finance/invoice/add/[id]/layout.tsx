"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import React from "react"

import { WizardLayout } from "@/components/form/wizard"
import { updateInvoiceWizardStep } from "@/components/school-dashboard/finance/invoice/wizard/actions"
import { INVOICE_WIZARD_CONFIG } from "@/components/school-dashboard/finance/invoice/wizard/config"
import {
  InvoiceWizardProvider,
  useInvoiceWizard,
} from "@/components/school-dashboard/finance/invoice/wizard/use-invoice-wizard"

export default function InvoiceWizardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <WizardLayout
      config={INVOICE_WIZARD_CONFIG}
      dataProvider={InvoiceWizardProvider}
      loadHook={useInvoiceWizard}
      basePath="/finance/invoice/add"
      onStepChange={(entityId, step) => {
        updateInvoiceWizardStep(entityId, step)
      }}
      finalLabel="Create Invoice"
    >
      {children}
    </WizardLayout>
  )
}
