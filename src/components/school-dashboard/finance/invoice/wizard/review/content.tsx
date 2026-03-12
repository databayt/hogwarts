"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import React, { useCallback, useEffect, useRef, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { FormHeading, FormLayout } from "@/components/form"
import { useWizardValidation } from "@/components/form/template/wizard-validation-context"
import type { WizardFormRef } from "@/components/form/wizard"
import { WizardStep } from "@/components/form/wizard"

import { completeInvoiceWizard } from "../actions"
import { useInvoiceWizard } from "../use-invoice-wizard"

export default function ReviewContent() {
  const params = useParams()
  const router = useRouter()
  const invoiceId = params.id as string
  const formRef = useRef<WizardFormRef>(null)
  const { data, isLoading } = useInvoiceWizard()
  const { enableNext, disableNext, setCustomNavigation } = useWizardValidation()

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const submittingRef = useRef(false)

  const isValid =
    !!data?.invoice_no?.trim() &&
    data.items.length > 0 &&
    data.items.some((item) => item.item_name.trim().length >= 1)

  const handleComplete = useCallback(async () => {
    if (submittingRef.current) return
    submittingRef.current = true
    setIsSubmitting(true)
    setError(null)

    const result = await completeInvoiceWizard(invoiceId)

    if (result.success) {
      router.push("/finance/invoice")
    } else {
      submittingRef.current = false
      setIsSubmitting(false)
      setError(result.error || "Failed to complete. Please try again.")
    }
  }, [invoiceId, router])

  useEffect(() => {
    if (isValid && !isSubmitting) {
      enableNext()
      setCustomNavigation({ onNext: handleComplete })
    } else {
      disableNext()
      setCustomNavigation(undefined)
    }
  }, [
    isValid,
    isSubmitting,
    enableNext,
    disableNext,
    setCustomNavigation,
    handleComplete,
  ])

  const formatDate = (date: Date | null | undefined) => {
    if (!date) return null
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const formatCurrency = (amount: number | null | undefined) => {
    if (amount == null) return "0.00"
    return amount.toFixed(2)
  }

  return (
    <WizardStep
      entityId={invoiceId}
      nextStep={undefined}
      isValid={isValid}
      formRef={formRef}
      isLoading={isLoading}
      isReviewStep
    >
      <FormLayout>
        <FormHeading
          title="Review & Submit"
          description="Review the invoice before creating it."
        />

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {isSubmitting && (
          <div className="flex items-center justify-center gap-2 py-4">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Creating invoice...</span>
          </div>
        )}

        {/* Invoice Details */}
        {data && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Invoice Details</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <ReviewField label="Invoice Number" value={data.invoice_no} />
              <ReviewField label="Currency" value={data.currency} />
              <ReviewField
                label="Invoice Date"
                value={formatDate(data.invoice_date)}
              />
              <ReviewField label="Due Date" value={formatDate(data.due_date)} />
              <ReviewField label="Status" value={data.status} />
              <ReviewField label="Notes" value={data.notes} />
            </CardContent>
          </Card>
        )}

        {/* From Address */}
        {data && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">From</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <ReviewField label="Name" value={data.from.name} />
              <ReviewField label="Email" value={data.from.email} />
              <ReviewField label="Address 1" value={data.from.address1} />
              <ReviewField label="Address 2" value={data.from.address2} />
              <ReviewField label="Address 3" value={data.from.address3} />
            </CardContent>
          </Card>
        )}

        {/* To Address */}
        {data && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">To</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <ReviewField label="Name" value={data.to.name} />
              <ReviewField label="Email" value={data.to.email} />
              <ReviewField label="Address 1" value={data.to.address1} />
              <ReviewField label="Address 2" value={data.to.address2} />
              <ReviewField label="Address 3" value={data.to.address3} />
            </CardContent>
          </Card>
        )}

        {/* Line Items */}
        {data && data.items.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Line Items</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="pb-2 text-start font-medium">Item</th>
                      <th className="pb-2 text-end font-medium">Qty</th>
                      <th className="pb-2 text-end font-medium">Price</th>
                      <th className="pb-2 text-end font-medium">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.items.map((item) => (
                      <tr key={item.id} className="border-b last:border-0">
                        <td className="py-2">{item.item_name}</td>
                        <td className="py-2 text-end">{item.quantity}</td>
                        <td className="py-2 text-end">
                          {formatCurrency(item.price)}
                        </td>
                        <td className="py-2 text-end">
                          {formatCurrency(item.total)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <Separator className="my-4" />

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotal</span>
                  <span>{formatCurrency(data.sub_total)}</span>
                </div>
                {data.discount != null && data.discount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span>Discount</span>
                    <span>-{formatCurrency(data.discount)}</span>
                  </div>
                )}
                {data.tax_percentage != null && data.tax_percentage > 0 && (
                  <div className="flex justify-between text-sm">
                    <span>Tax ({data.tax_percentage}%)</span>
                    <span>
                      {formatCurrency(
                        (data.sub_total - (data.discount || 0)) *
                          (data.tax_percentage / 100)
                      )}
                    </span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span>
                    {data.currency} {formatCurrency(data.total)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </FormLayout>
    </WizardStep>
  )
}

function ReviewField({
  label,
  value,
}: {
  label: string
  value?: string | number | null
}) {
  if (!value) return null
  return (
    <div>
      <p className="text-muted-foreground text-xs">{label}</p>
      <p className="text-sm font-medium">{String(value)}</p>
    </div>
  )
}
