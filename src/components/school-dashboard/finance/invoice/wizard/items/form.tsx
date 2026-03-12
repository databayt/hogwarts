"use client"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useTransition,
} from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { Plus, Trash2 } from "lucide-react"
import { useFieldArray, useForm } from "react-hook-form"

import { Button } from "@/components/ui/button"
import { Form } from "@/components/ui/form"
import { Separator } from "@/components/ui/separator"
import { ErrorToast } from "@/components/atom/toast"
import { InputField, NumberField } from "@/components/form"
import type { WizardFormRef } from "@/components/form/wizard"

import { updateInvoiceItems } from "./actions"
import { itemsSchema, type ItemsFormData } from "./validation"

interface ItemsFormProps {
  invoiceId: string
  initialData?: Partial<ItemsFormData>
  onValidChange?: (isValid: boolean) => void
}

export const ItemsForm = forwardRef<WizardFormRef, ItemsFormProps>(
  ({ invoiceId, initialData, onValidChange }, ref) => {
    const [isPending, startTransition] = useTransition()

    const form = useForm<ItemsFormData>({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      resolver: zodResolver(itemsSchema) as any,
      defaultValues: {
        items: initialData?.items?.length
          ? initialData.items
          : [{ item_name: "", quantity: 1, price: 0, total: 0 }],
        sub_total: initialData?.sub_total || 0,
        discount: initialData?.discount || 0,
        tax_percentage: initialData?.tax_percentage || 0,
        total: initialData?.total || 0,
      },
    })

    const { fields, append, remove } = useFieldArray({
      control: form.control,
      name: "items",
    })

    // Watch items for auto-calculation
    const watchedItems = form.watch("items")
    const watchedDiscount = form.watch("discount") || 0
    const watchedTaxPercentage = form.watch("tax_percentage") || 0

    // Auto-calculate item totals and running totals
    const recalculate = useCallback(() => {
      let subTotal = 0

      watchedItems.forEach((item, index) => {
        const quantity = Number(item.quantity) || 0
        const price = Number(item.price) || 0
        const itemTotal = quantity * price

        // Only update if changed to avoid infinite loops
        if (item.total !== itemTotal) {
          form.setValue(`items.${index}.total`, itemTotal, {
            shouldDirty: true,
          })
        }

        subTotal += itemTotal
      })

      const discount = Number(watchedDiscount) || 0
      const taxPercentage = Number(watchedTaxPercentage) || 0
      const afterDiscount = subTotal - discount
      const taxAmount = afterDiscount * (taxPercentage / 100)
      const grandTotal = afterDiscount + taxAmount

      form.setValue("sub_total", subTotal, { shouldDirty: true })
      form.setValue("total", grandTotal, { shouldDirty: true })
    }, [watchedItems, watchedDiscount, watchedTaxPercentage, form])

    useEffect(() => {
      recalculate()
    }, [recalculate])

    // Validity: at least one item with a name
    useEffect(() => {
      const hasValidItem = watchedItems.some(
        (item) => item.item_name?.trim().length >= 1
      )
      onValidChange?.(hasValidItem)
    }, [watchedItems, onValidChange])

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
              const result = await updateInvoiceItems(invoiceId, data)
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

    const subTotal = form.watch("sub_total")
    const total = form.watch("total")

    return (
      <Form {...form}>
        <form className="space-y-6">
          {fields.map((field, index) => (
            <div
              key={field.id}
              className="relative space-y-4 rounded-lg border p-4"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">Item {index + 1}</p>
                {fields.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => remove(index)}
                    disabled={isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <InputField
                name={`items.${index}.item_name`}
                label="Item Name"
                placeholder="e.g., Consulting Services"
                required
                disabled={isPending}
              />
              <div className="grid grid-cols-3 gap-4">
                <NumberField
                  name={`items.${index}.quantity`}
                  label="Quantity"
                  min={1}
                  disabled={isPending}
                />
                <NumberField
                  name={`items.${index}.price`}
                  label="Price"
                  min={0}
                  step={0.01}
                  disabled={isPending}
                />
                <div className="space-y-2">
                  <label className="text-sm font-medium">Total</label>
                  <p className="flex h-10 items-center rounded-md border px-3 text-sm">
                    {(
                      (Number(watchedItems[index]?.quantity) || 0) *
                      (Number(watchedItems[index]?.price) || 0)
                    ).toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          ))}

          <Button
            type="button"
            variant="outline"
            onClick={() =>
              append({ item_name: "", quantity: 1, price: 0, total: 0 })
            }
            disabled={isPending}
            className="w-full"
          >
            <Plus className="me-2 h-4 w-4" />
            Add Item
          </Button>

          <Separator />

          {/* Totals */}
          <div className="space-y-4 rounded-lg border p-4">
            <div className="flex items-center justify-between text-sm">
              <span>Subtotal</span>
              <span className="font-medium">{subTotal.toFixed(2)}</span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <NumberField
                name="discount"
                label="Discount"
                min={0}
                step={0.01}
                disabled={isPending}
              />
              <NumberField
                name="tax_percentage"
                label="Tax %"
                min={0}
                max={100}
                step={0.01}
                disabled={isPending}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between text-lg font-bold">
              <span>Total</span>
              <span>{total.toFixed(2)}</span>
            </div>
          </div>
        </form>
      </Form>
    )
  }
)

ItemsForm.displayName = "ItemsForm"
