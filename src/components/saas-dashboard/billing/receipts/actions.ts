"use server"

// Copyright (c) 2025-present databayt
// Licensed under SSPL-1.0 -- see LICENSE for details
import { revalidatePath } from "next/cache"
import { z } from "zod"

import { db } from "@/lib/db"
import {
  logOperatorAudit,
  requireNotImpersonating,
  requireOperator,
} from "@/components/saas-dashboard/lib/operator-auth"

import type { ReceiptRow } from "./types"

const reviewReceiptSchema = z.object({
  receiptId: z.string().min(1),
  status: z.enum(["approved", "rejected"]),
  notes: z.string().optional(),
})

export async function reviewReceipt(data: z.infer<typeof reviewReceiptSchema>) {
  try {
    const operator = await requireOperator()
    await requireNotImpersonating()
    const validated = reviewReceiptSchema.parse(data)

    // Update receipt status
    const receipt = await db.receipt.update({
      where: { id: validated.receiptId },
      data: {
        status: validated.status,
        reviewedAt: new Date(),
        notes: validated.notes,
      },
      include: {
        invoice: {
          select: {
            id: true,
            schoolId: true,
            amountDue: true,
            amountPaid: true,
          },
        },
      },
    })

    // If approved, credit the receipt toward the invoice. Accumulate onto any
    // prior partial payment instead of overwriting; only flip to "paid" once
    // the full amount is covered.
    if (validated.status === "approved") {
      const newAmountPaid = receipt.invoice.amountPaid + receipt.amount
      await db.invoice.update({
        where: { id: receipt.invoiceId },
        data: {
          status: newAmountPaid >= receipt.invoice.amountDue ? "paid" : "open",
          amountPaid: newAmountPaid,
          updatedAt: new Date(), // Track when payment was processed
        },
      })
    }

    // Create audit log with the real operator identity (+ IP/UA)
    await logOperatorAudit({
      userId: operator.userId,
      schoolId: receipt.invoice.schoolId,
      action: `receipt_${validated.status}`,
      reason:
        validated.notes ||
        `Receipt ${validated.status} for invoice ${receipt.invoiceId}`,
    })

    revalidatePath("/billing")
    revalidatePath("/billing/receipts")

    return { success: true }
  } catch (error) {
    console.error("Failed to review receipt:", error)
    return {
      success: false,
      error: {
        message:
          error instanceof Error ? error.message : "Failed to review receipt",
      },
    }
  }
}

const uploadReceiptSchema = z.object({
  invoiceId: z.string().min(1),
  amount: z.number().positive(),
  fileName: z.string().min(1),
  fileUrl: z.string().url(),
})

export async function uploadReceipt(data: z.infer<typeof uploadReceiptSchema>) {
  try {
    const operator = await requireOperator()
    await requireNotImpersonating()
    const validated = uploadReceiptSchema.parse(data)

    // Get the invoice to retrieve schoolId
    const invoice = await db.invoice.findUnique({
      where: { id: validated.invoiceId },
      select: { schoolId: true },
    })

    if (!invoice) {
      throw new Error("Invoice not found")
    }

    const receipt = await db.receipt.create({
      data: {
        schoolId: invoice.schoolId,
        invoiceId: validated.invoiceId,
        amount: validated.amount,
        fileName: validated.fileName,
        fileUrl: validated.fileUrl,
        status: "pending",
      },
    })

    // Create audit log with the real operator identity (+ IP/UA)
    await logOperatorAudit({
      userId: operator.userId,
      schoolId: invoice.schoolId,
      action: "receipt_uploaded",
      reason: `Receipt uploaded: ${validated.fileName} for invoice ${validated.invoiceId} - Amount: $${(validated.amount / 100).toFixed(2)}`,
    })

    revalidatePath("/billing")
    revalidatePath("/billing/receipts")

    return { success: true, receiptId: receipt.id }
  } catch (error) {
    console.error("Failed to upload receipt:", error)
    return {
      success: false,
      error: {
        message:
          error instanceof Error ? error.message : "Failed to upload receipt",
      },
    }
  }
}

// Get receipts with filters for pagination
export async function getReceipts(input: {
  page: number
  perPage: number
  status?: string
  search?: string
}) {
  try {
    await requireOperator()

    const offset = (input.page - 1) * input.perPage
    const where = {
      ...(input.status && input.status !== "all"
        ? { status: input.status }
        : {}),
      ...(input.search
        ? {
            OR: [
              {
                invoice: {
                  stripeInvoiceId: {
                    contains: input.search,
                    mode: "insensitive" as const,
                  },
                },
              },
              {
                invoice: {
                  school: {
                    name: {
                      contains: input.search,
                      mode: "insensitive" as const,
                    },
                  },
                },
              },
            ],
          }
        : {}),
    }

    const [receipts, total] = await Promise.all([
      db.receipt.findMany({
        where,
        include: {
          invoice: {
            select: {
              id: true,
              stripeInvoiceId: true,
              school: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: offset,
        take: input.perPage,
      }),
      db.receipt.count({ where }),
    ])

    const rows: ReceiptRow[] = receipts.map((receipt) => ({
      id: receipt.id,
      schoolName: receipt.invoice.school.name,
      invoiceNumber: receipt.invoice.stripeInvoiceId,
      amount: receipt.amount,
      fileUrl: receipt.fileUrl,
      fileName: receipt.fileName,
      status: receipt.status as "pending" | "approved" | "rejected",
      uploadedAt: receipt.createdAt.toISOString(),
      reviewedAt: receipt.reviewedAt?.toISOString() || null,
      notes: receipt.notes,
    }))

    return { success: true, data: rows, total }
  } catch (error) {
    console.error("Failed to fetch receipts:", error)
    return {
      success: false,
      error: {
        message:
          error instanceof Error ? error.message : "Failed to fetch receipts",
      },
      data: [],
      total: 0,
    }
  }
}
