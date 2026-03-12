"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import React, { forwardRef, useImperativeHandle, useTransition } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"

import { Form } from "@/components/ui/form"
import { Separator } from "@/components/ui/separator"
import { ErrorToast } from "@/components/atom/toast"
import {
  DateField,
  InputField,
  SelectField,
  TextareaField,
} from "@/components/form"
import type { WizardFormRef } from "@/components/form/wizard"
import {
  CURRENCY_OPTIONS,
  INVOICE_STATUS_OPTIONS,
} from "@/components/school-dashboard/finance/invoice/wizard/config"

import { updateInvoiceDetails } from "./actions"
import { detailsSchema, type DetailsFormData } from "./validation"

interface DetailsFormProps {
  invoiceId: string
  initialData?: Partial<DetailsFormData>
  onValidChange?: (isValid: boolean) => void
}

export const DetailsForm = forwardRef<WizardFormRef, DetailsFormProps>(
  ({ invoiceId, initialData, onValidChange }, ref) => {
    const [isPending, startTransition] = useTransition()

    const form = useForm<DetailsFormData>({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      resolver: zodResolver(detailsSchema) as any,
      defaultValues: {
        invoice_no: initialData?.invoice_no || "",
        invoice_date: initialData?.invoice_date,
        due_date: initialData?.due_date,
        currency: initialData?.currency || "USD",
        from: {
          name: initialData?.from?.name || "",
          email: initialData?.from?.email || "",
          address1: initialData?.from?.address1 || "",
          address2: initialData?.from?.address2 || "",
          address3: initialData?.from?.address3 || "",
        },
        to: {
          name: initialData?.to?.name || "",
          email: initialData?.to?.email || "",
          address1: initialData?.to?.address1 || "",
          address2: initialData?.to?.address2 || "",
          address3: initialData?.to?.address3 || "",
        },
        notes: initialData?.notes || "",
        status: initialData?.status || "UNPAID",
      },
    })

    // Notify parent of validity changes
    const invoiceNo = form.watch("invoice_no")
    const fromName = form.watch("from.name")
    const fromAddress1 = form.watch("from.address1")
    const toName = form.watch("to.name")
    const toAddress1 = form.watch("to.address1")
    React.useEffect(() => {
      const isValid =
        invoiceNo.trim().length >= 1 &&
        fromName.trim().length >= 1 &&
        fromAddress1.trim().length >= 1 &&
        toName.trim().length >= 1 &&
        toAddress1.trim().length >= 1
      onValidChange?.(isValid)
    }, [invoiceNo, fromName, fromAddress1, toName, toAddress1, onValidChange])

    useImperativeHandle(ref, () => ({
      saveAndNext: () =>
        new Promise<void>((resolve, reject) => {
          startTransition(async () => {
            try {
              const valid = await form.trigger()
              if (!valid) {
                reject(new Error("Validation failed"))
                return
              }
              const data = form.getValues()
              const result = await updateInvoiceDetails(invoiceId, data)
              if (!result.success) {
                ErrorToast(result.error || "Failed to save")
                reject(new Error(result.error))
                return
              }
              resolve()
            } catch (err) {
              const msg = err instanceof Error ? err.message : "Failed to save"
              ErrorToast(msg)
              reject(err)
            }
          })
        }),
    }))

    return (
      <Form {...form}>
        <form className="space-y-6">
          {/* Invoice Details */}
          <div className="grid grid-cols-2 gap-4">
            <InputField
              name="invoice_no"
              label="Invoice Number"
              placeholder="INV-001"
              required
              disabled={isPending}
            />
            <SelectField
              name="currency"
              label="Currency"
              options={[...CURRENCY_OPTIONS]}
              required
              disabled={isPending}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <DateField
              name="invoice_date"
              label="Invoice Date"
              required
              disabled={isPending}
            />
            <DateField
              name="due_date"
              label="Due Date"
              required
              disabled={isPending}
            />
          </div>

          <SelectField
            name="status"
            label="Status"
            options={[...INVOICE_STATUS_OPTIONS]}
            disabled={isPending}
          />

          <Separator />

          {/* From Address */}
          <fieldset className="space-y-4">
            <legend className="text-sm font-medium">From</legend>
            <div className="grid grid-cols-2 gap-4">
              <InputField
                name="from.name"
                label="Name"
                placeholder="Your company name"
                required
                disabled={isPending}
              />
              <InputField
                name="from.email"
                label="Email"
                placeholder="billing@company.com"
                disabled={isPending}
              />
            </div>
            <InputField
              name="from.address1"
              label="Address Line 1"
              placeholder="Street address"
              required
              disabled={isPending}
            />
            <InputField
              name="from.address2"
              label="Address Line 2"
              placeholder="Suite, unit, etc."
              disabled={isPending}
            />
            <InputField
              name="from.address3"
              label="Address Line 3"
              placeholder="City, state, zip"
              disabled={isPending}
            />
          </fieldset>

          <Separator />

          {/* To Address */}
          <fieldset className="space-y-4">
            <legend className="text-sm font-medium">To</legend>
            <div className="grid grid-cols-2 gap-4">
              <InputField
                name="to.name"
                label="Name"
                placeholder="Client name"
                required
                disabled={isPending}
              />
              <InputField
                name="to.email"
                label="Email"
                placeholder="client@email.com"
                disabled={isPending}
              />
            </div>
            <InputField
              name="to.address1"
              label="Address Line 1"
              placeholder="Street address"
              required
              disabled={isPending}
            />
            <InputField
              name="to.address2"
              label="Address Line 2"
              placeholder="Suite, unit, etc."
              disabled={isPending}
            />
            <InputField
              name="to.address3"
              label="Address Line 3"
              placeholder="City, state, zip"
              disabled={isPending}
            />
          </fieldset>

          <Separator />

          {/* Notes */}
          <TextareaField
            name="notes"
            label="Notes"
            placeholder="Additional notes or terms..."
            disabled={isPending}
          />
        </form>
      </Form>
    )
  }
)

DetailsForm.displayName = "DetailsForm"
