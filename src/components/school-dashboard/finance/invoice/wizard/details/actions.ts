"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { ACTION_ERRORS, actionError } from "@/lib/action-errors"
import type { ActionResponse } from "@/lib/action-response"
import { db } from "@/lib/db"

import { isFinanceAuthError, requireFinanceActor } from "../../../guard"
import { detailsSchema, type DetailsFormData } from "./validation"

export async function getInvoiceDetails(
  invoiceId: string
): Promise<ActionResponse<DetailsFormData>> {
  try {
    const ctx = await requireFinanceActor("invoice", "view")
    if (isFinanceAuthError(ctx)) return ctx
    const { schoolId } = ctx

    const invoice = await db.userInvoice.findFirst({
      where: { id: invoiceId, schoolId },
      include: {
        from: true,
        to: true,
      },
    })

    if (!invoice) return actionError(ACTION_ERRORS.INVOICE_NOT_FOUND)

    return {
      success: true,
      data: {
        invoice_no: invoice.invoice_no,
        invoice_date: invoice.invoice_date,
        due_date: invoice.due_date,
        currency: invoice.currency,
        from: {
          name: invoice.from.name,
          email: invoice.from.email ?? "",
          address1: invoice.from.address1,
          address2: invoice.from.address2 ?? undefined,
          address3: invoice.from.address3 ?? undefined,
        },
        to: {
          name: invoice.to.name,
          email: invoice.to.email ?? "",
          address1: invoice.to.address1,
          address2: invoice.to.address2 ?? undefined,
          address3: invoice.to.address3 ?? undefined,
        },
        notes: invoice.notes ?? undefined,
        status: invoice.status as "UNPAID" | "PAID" | "OVERDUE" | "CANCELLED",
      },
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to load",
    }
  }
}

export async function updateInvoiceDetails(
  invoiceId: string,
  input: DetailsFormData
): Promise<ActionResponse> {
  try {
    const ctx = await requireFinanceActor("invoice", "edit")
    if (isFinanceAuthError(ctx)) return ctx
    const { schoolId } = ctx

    const parsed = detailsSchema.parse(input)

    // Get current invoice to find address IDs
    const invoice = await db.userInvoice.findFirst({
      where: { id: invoiceId, schoolId },
      select: { fromAddressId: true, toAddressId: true },
    })

    if (!invoice) return actionError(ACTION_ERRORS.INVOICE_NOT_FOUND)

    await db.$transaction(async (tx) => {
      // Update from address
      await tx.userInvoiceAddress.update({
        where: { id: invoice.fromAddressId },
        data: {
          name: parsed.from.name,
          email: parsed.from.email || null,
          address1: parsed.from.address1,
          address2: parsed.from.address2 ?? null,
          address3: parsed.from.address3 ?? null,
        },
      })

      // Update to address
      await tx.userInvoiceAddress.update({
        where: { id: invoice.toAddressId },
        data: {
          name: parsed.to.name,
          email: parsed.to.email || null,
          address1: parsed.to.address1,
          address2: parsed.to.address2 ?? null,
          address3: parsed.to.address3 ?? null,
        },
      })

      // Update invoice fields
      await tx.userInvoice.updateMany({
        where: { id: invoiceId, schoolId },
        data: {
          invoice_no: parsed.invoice_no,
          invoice_date: parsed.invoice_date,
          due_date: parsed.due_date,
          currency: parsed.currency,
          notes: parsed.notes ?? null,
          status: parsed.status,
        },
      })
    })

    return { success: true }
  } catch (error) {
    // Duplicate invoice number within this school — surface a translatable
    // error code, not the raw Prisma P2002 message.
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      (error as { code?: string }).code === "P2002"
    ) {
      return actionError(ACTION_ERRORS.INVOICE_DUPLICATE_NUMBER)
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to save",
    }
  }
}
