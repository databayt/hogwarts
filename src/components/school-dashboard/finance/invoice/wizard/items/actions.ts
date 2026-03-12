"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import type { ActionResponse } from "@/lib/action-response"
import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"

import { itemsSchema, type ItemsFormData } from "./validation"

export async function getInvoiceItems(
  invoiceId: string
): Promise<ActionResponse<ItemsFormData>> {
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) return { success: false, error: "Missing school context" }

    const invoice = await db.userInvoice.findFirst({
      where: { id: invoiceId, schoolId },
      select: {
        sub_total: true,
        discount: true,
        tax_percentage: true,
        total: true,
        items: {
          select: {
            item_name: true,
            quantity: true,
            price: true,
            total: true,
          },
        },
      },
    })

    if (!invoice) return { success: false, error: "Invoice not found" }

    return {
      success: true,
      data: {
        items: invoice.items.map((item) => ({
          item_name: item.item_name,
          quantity: item.quantity,
          price: item.price,
          total: item.total,
        })),
        sub_total: invoice.sub_total,
        discount: invoice.discount ?? undefined,
        tax_percentage: invoice.tax_percentage ?? undefined,
        total: invoice.total,
      },
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to load",
    }
  }
}

export async function updateInvoiceItems(
  invoiceId: string,
  input: ItemsFormData
): Promise<ActionResponse> {
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) return { success: false, error: "Missing school context" }

    const parsed = itemsSchema.parse(input)

    await db.$transaction(async (tx) => {
      // Delete existing items
      await tx.userInvoiceItem.deleteMany({
        where: { invoiceId, schoolId },
      })

      // Recreate with new data
      if (parsed.items.length > 0) {
        await tx.userInvoiceItem.createMany({
          data: parsed.items.map((item) => ({
            invoiceId,
            schoolId,
            item_name: item.item_name,
            quantity: item.quantity,
            price: item.price,
            total: item.total,
          })),
        })
      }

      // Update totals on invoice
      await tx.userInvoice.updateMany({
        where: { id: invoiceId, schoolId },
        data: {
          sub_total: parsed.sub_total,
          discount: parsed.discount ?? null,
          tax_percentage: parsed.tax_percentage ?? null,
          total: parsed.total,
        },
      })
    })

    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to save",
    }
  }
}
