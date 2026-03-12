"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import React, { useEffect, useRef, useState } from "react"
import { useParams } from "next/navigation"

import { FormHeading, FormLayout } from "@/components/form"
import type { WizardFormRef } from "@/components/form/wizard"
import { WizardStep } from "@/components/form/wizard"

import { useInvoiceWizard } from "../use-invoice-wizard"
import { ItemsForm } from "./form"

export default function ItemsContent() {
  const params = useParams()
  const invoiceId = params.id as string
  const formRef = useRef<WizardFormRef>(null)
  const { data, isLoading } = useInvoiceWizard()
  const [isValid, setIsValid] = useState(false)

  // Set initial validity from loaded data
  useEffect(() => {
    if (data) {
      setIsValid(
        data.items.length > 0 &&
          data.items.some((item) => item.item_name.trim().length >= 1)
      )
    }
  }, [data])

  return (
    <WizardStep
      entityId={invoiceId}
      nextStep={`/finance/invoice/add/${invoiceId}/review`}
      isValid={isValid}
      formRef={formRef}
      isLoading={isLoading}
    >
      <FormLayout>
        <FormHeading
          title="Line Items"
          description="Add the items or services for this invoice."
        />
        <ItemsForm
          ref={formRef}
          invoiceId={invoiceId}
          initialData={
            data
              ? {
                  items: data.items.map((item) => ({
                    item_name: item.item_name,
                    quantity: item.quantity,
                    price: item.price,
                    total: item.total,
                  })),
                  sub_total: data.sub_total,
                  discount: data.discount ?? undefined,
                  tax_percentage: data.tax_percentage ?? undefined,
                  total: data.total,
                }
              : undefined
          }
          onValidChange={setIsValid}
        />
      </FormLayout>
    </WizardStep>
  )
}
