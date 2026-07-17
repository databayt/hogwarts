"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { ACTION_ERRORS, actionError } from "@/lib/action-errors"
import type { ActionResponse } from "@/lib/action-response"
import { db } from "@/lib/db"

import { isFinanceAuthError, requireFinanceActor } from "../../../guard"
import { itemsSchema, type ItemsFormData } from "./validation"

export async function getInvoiceItems(
  invoiceId: string
): Promise<ActionResponse<ItemsFormData>> {
  try {
    const ctx = await requireFinanceActor("invoice", "view")
    if (isFinanceAuthError(ctx)) return ctx
    const { schoolId } = ctx

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

    if (!invoice) return actionError(ACTION_ERRORS.INVOICE_NOT_FOUND)

    return {
      success: true,
      data: {
        items: invoice.items.map((item) => ({
          item_name: item.item_name,
          quantity: item.quantity,
          price: Number(item.price),
          total: Number(item.total),
        })),
        sub_total: Number(invoice.sub_total),
        discount:
          invoice.discount != null ? Number(invoice.discount) : undefined,
        tax_percentage:
          invoice.tax_percentage != null
            ? Number(invoice.tax_percentage)
            : undefined,
        total: Number(invoice.total),
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
    const ctx = await requireFinanceActor("invoice", "edit")
    if (isFinanceAuthError(ctx)) return ctx
    const { schoolId } = ctx

    const parsed = itemsSchema.parse(input)

    // Recomputed from quantity x price rather than trusted from the request:
    // the client posts sub_total/total next to the items, so a hand-made call
    // could otherwise pin any total onto real line items. Mirrors the wizard
    // form's arithmetic, where `discount` is an absolute amount subtracted
    // before `tax_percentage` applies.
    const items = parsed.items.map((item) => ({
      ...item,
      total: item.quantity * item.price,
    }))
    const subTotal = items.reduce((sum, item) => sum + item.total, 0)
    const afterDiscount = subTotal - (parsed.discount ?? 0)
    const total =
      afterDiscount + afterDiscount * ((parsed.tax_percentage ?? 0) / 100)

    await db.$transaction(async (tx) => {
      // Delete existing items
      await tx.userInvoiceItem.deleteMany({
        where: { invoiceId, schoolId },
      })

      // Recreate with new data
      if (items.length > 0) {
        await tx.userInvoiceItem.createMany({
          data: items.map((item) => ({
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
          sub_total: subTotal,
          discount: parsed.discount ?? null,
          tax_percentage: parsed.tax_percentage ?? null,
          total,
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
