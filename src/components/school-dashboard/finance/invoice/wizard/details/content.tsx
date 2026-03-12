"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import React, { useEffect, useRef, useState } from "react"
import { useParams } from "next/navigation"

import { FormHeading, FormLayout } from "@/components/form"
import type { WizardFormRef } from "@/components/form/wizard"
import { WizardStep } from "@/components/form/wizard"

import { useInvoiceWizard } from "../use-invoice-wizard"
import { DetailsForm } from "./form"

export default function DetailsContent() {
  const params = useParams()
  const invoiceId = params.id as string
  const formRef = useRef<WizardFormRef>(null)
  const { data, isLoading } = useInvoiceWizard()
  const [isValid, setIsValid] = useState(false)

  // Set initial validity from loaded data
  useEffect(() => {
    if (data) {
      setIsValid(
        data.invoice_no.trim().length >= 1 &&
          data.from.name.trim().length >= 1 &&
          data.from.address1.trim().length >= 1 &&
          data.to.name.trim().length >= 1 &&
          data.to.address1.trim().length >= 1
      )
    }
  }, [data])

  return (
    <WizardStep
      entityId={invoiceId}
      nextStep={`/finance/invoice/add/${invoiceId}/items`}
      isValid={isValid}
      formRef={formRef}
      isLoading={isLoading}
    >
      <FormLayout>
        <FormHeading
          title="Invoice Details"
          description="Enter the invoice information and addresses."
        />
        <DetailsForm
          ref={formRef}
          invoiceId={invoiceId}
          initialData={
            data
              ? {
                  invoice_no: data.invoice_no,
                  invoice_date: data.invoice_date,
                  due_date: data.due_date,
                  currency: data.currency,
                  from: {
                    name: data.from.name,
                    email: data.from.email ?? "",
                    address1: data.from.address1,
                    address2: data.from.address2 ?? undefined,
                    address3: data.from.address3 ?? undefined,
                  },
                  to: {
                    name: data.to.name,
                    email: data.to.email ?? "",
                    address1: data.to.address1,
                    address2: data.to.address2 ?? undefined,
                    address3: data.to.address3 ?? undefined,
                  },
                  notes: data.notes ?? undefined,
                  status: data.status as
                    | "UNPAID"
                    | "PAID"
                    | "OVERDUE"
                    | "CANCELLED",
                }
              : undefined
          }
          onValidChange={setIsValid}
        />
      </FormLayout>
    </WizardStep>
  )
}
