"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { revalidatePath } from "next/cache"
import { auth } from "@/auth"

import type { ActionResponse } from "@/lib/action-response"
import { db } from "@/lib/db"
import { getTenantContext } from "@/lib/tenant-context"

import type { InvoiceWizardData } from "./use-invoice-wizard"

/** Fetch full invoice data for the wizard */
export async function getInvoiceForWizard(
  invoiceId: string
): Promise<
  { success: true; data: InvoiceWizardData } | { success: false; error: string }
> {
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) return { success: false, error: "Missing school context" }

    const invoice = await db.userInvoice.findFirst({
      where: { id: invoiceId, schoolId },
      include: {
        from: true,
        to: true,
        items: {
          where: { schoolId },
          select: {
            id: true,
            item_name: true,
            quantity: true,
            price: true,
            total: true,
          },
        },
      },
    })

    if (!invoice) return { success: false, error: "Invoice not found" }

    return { success: true, data: invoice as InvoiceWizardData }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to load invoice",
    }
  }
}

/** Create a draft invoice record to start the wizard */
export async function createDraftInvoice(): Promise<
  ActionResponse<{ id: string }>
> {
  try {
    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return { success: false, error: "Missing school context" }
    }

    const session = await auth()
    if (!session?.user?.id) {
      return { success: false, error: "Not authenticated" }
    }

    const invoice = await db.$transaction(async (tx) => {
      // Create from address
      const fromAddress = await tx.userInvoiceAddress.create({
        data: {
          name: "",
          email: "",
          address1: "",
          schoolId,
        },
      })

      // Create to address
      const toAddress = await tx.userInvoiceAddress.create({
        data: {
          name: "",
          email: "",
          address1: "",
          schoolId,
        },
      })

      // Create invoice with linked addresses
      return tx.userInvoice.create({
        data: {
          invoice_no: "",
          invoice_date: new Date(),
          due_date: new Date(),
          currency: "USD",
          sub_total: 0,
          total: 0,
          status: "UNPAID",
          userId: session.user.id,
          schoolId,
          fromAddressId: fromAddress.id,
          toAddressId: toAddress.id,
          wizardStep: "details",
        },
      })
    })

    return { success: true, data: { id: invoice.id } }
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to create invoice",
    }
  }
}

/** Mark the invoice wizard as complete */
export async function completeInvoiceWizard(
  invoiceId: string
): Promise<ActionResponse> {
  try {
    const session = await auth()
    if (!session?.user) {
      return { success: false, error: "Not authenticated" }
    }

    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return { success: false, error: "Missing school context" }
    }

    // Validate invoice has items
    const invoice = await db.userInvoice.findFirst({
      where: { id: invoiceId, schoolId },
      include: { items: { select: { id: true } } },
    })

    if (!invoice) {
      return { success: false, error: "Invoice not found" }
    }

    if (invoice.items.length === 0) {
      return {
        success: false,
        error: "At least one line item is required before completing",
      }
    }

    if (!invoice.invoice_no) {
      return {
        success: false,
        error: "Invoice number is required before completing",
      }
    }

    await db.userInvoice.updateMany({
      where: { id: invoiceId, schoolId },
      data: { wizardStep: null },
    })

    revalidatePath("/finance/invoice")
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to complete invoice wizard",
    }
  }
}

/** Update the current wizard step for resumability */
export async function updateInvoiceWizardStep(
  invoiceId: string,
  step: string
): Promise<void> {
  try {
    const session = await auth()
    if (!session?.user) return

    const { schoolId } = await getTenantContext()
    if (!schoolId) return

    await db.userInvoice.updateMany({
      where: { id: invoiceId, schoolId },
      data: { wizardStep: step },
    })
  } catch {
    // Non-critical, don't throw
  }
}

/** Delete an abandoned draft invoice */
export async function deleteDraftInvoice(
  invoiceId: string
): Promise<ActionResponse> {
  try {
    const session = await auth()
    if (!session?.user) {
      return { success: false, error: "Not authenticated" }
    }

    const { schoolId } = await getTenantContext()
    if (!schoolId) {
      return { success: false, error: "Missing school context" }
    }

    // Only delete if it's still a draft
    const invoice = await db.userInvoice.findFirst({
      where: { id: invoiceId, schoolId, wizardStep: { not: null } },
      select: { id: true, fromAddressId: true, toAddressId: true },
    })

    if (!invoice) {
      return { success: false, error: "Draft invoice not found" }
    }

    await db.$transaction(async (tx) => {
      // Delete items first (cascade should handle but be explicit)
      await tx.userInvoiceItem.deleteMany({
        where: { invoiceId: invoice.id },
      })

      // Delete invoice (this will free the address FK)
      await tx.userInvoice.deleteMany({
        where: { id: invoice.id, schoolId },
      })

      // Delete addresses
      await tx.userInvoiceAddress.deleteMany({
        where: {
          id: { in: [invoice.fromAddressId, invoice.toAddressId] },
        },
      })
    })

    return { success: true }
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to delete draft invoice",
    }
  }
}
