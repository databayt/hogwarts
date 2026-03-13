"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import React, { useEffect, useRef, useState } from "react"
import { useParams, useRouter } from "next/navigation"

import { FormHeading, FormLayout } from "@/components/form"
import { useWizardValidation } from "@/components/form/template/wizard-validation-context"
import type { WizardFormRef } from "@/components/form/wizard"
import { WizardStep } from "@/components/form/wizard"

import { completeInvoiceWizard } from "../actions"
import { useInvoiceWizard } from "../use-invoice-wizard"
import { ItemsForm } from "./form"

export default function ItemsContent() {
  const params = useParams()
  const router = useRouter()
  const invoiceId = params.id as string
  const formRef = useRef<WizardFormRef>(null)
  const { data, isLoading } = useInvoiceWizard()
  const [isValid, setIsValid] = useState(false)
  const { setCustomNavigation } = useWizardValidation()
  const isSavingRef = useRef(false)

  // Set initial validity from loaded data
  useEffect(() => {
    if (data) {
      setIsValid(
        data.items.length > 0 &&
          data.items.some((item) => item.item_name.trim().length >= 1)
      )
    }
  }, [data])

  // Set up completion navigation: save form + complete wizard + redirect
  useEffect(() => {
    const handleNext = async () => {
      if (isSavingRef.current) return
      isSavingRef.current = true
      try {
        await formRef.current?.saveAndNext()
        const result = await completeInvoiceWizard(invoiceId)
        if (result.success) {
          router.push("/finance/invoice")
        }
      } catch {
        // Error handled in form
      } finally {
        isSavingRef.current = false
      }
    }

    setCustomNavigation({ onNext: handleNext })
    return () => setCustomNavigation(undefined)
  }, [invoiceId, router, setCustomNavigation])

  return (
    <WizardStep
      entityId={invoiceId}
      isValid={isValid}
      formRef={formRef}
      isLoading={isLoading}
      isReviewStep
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
