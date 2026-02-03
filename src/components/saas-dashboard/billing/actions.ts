"use server"

import { revalidatePath } from "next/cache"
import type { Invoice } from "@prisma/client"
import { z } from "zod"

import { db } from "@/lib/db"
import {
  logOperatorAudit,
  requireNotImpersonating,
  requireOperator,
} from "@/components/saas-dashboard/lib/operator-auth"

// ============= Type Definitions =============

type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: Error }

// ============= Validation Schemas =============

const updateInvoiceStatusSchema = z.object({
  id: z.string().min(1),
  status: z.enum(["paid", "void", "open", "uncollectible"]),
})

// ============= Invoice Actions =============

export async function invoiceUpdateStatus(input: {
  id: string
  status: "paid" | "void" | "open" | "uncollectible"
}): Promise<ActionResult<Invoice>> {
  try {
    const operator = await requireOperator()
    await requireNotImpersonating()

    const validated = updateInvoiceStatusSchema.parse(input)

    // Properly typed Prisma operation - no type assertion needed
    const invoice = await db.invoice.update({
      where: { id: validated.id },
      data: {
        status: validated.status,
        updatedAt: new Date(),
      },
    })

    await logOperatorAudit({
      userId: operator.userId,
      schoolId: invoice.schoolId,
      action: `BILLING_INVOICE_${validated.status.toUpperCase()}`,
    })

    revalidatePath("/saas-dashboard/billing")

    return { success: true, data: invoice }
  } catch (error) {
    console.error("Failed to update invoice status:", error)
    return {
      success: false,
      error:
        error instanceof Error ? error : new Error("Failed to update invoice"),
    }
  }
}

// ============= Receipt Actions =============
// Moved to @/components/saas-dashboard/billing/receipts/actions.ts for better organization

// ============= Get Invoices Action =============

export async function getInvoices(input: {
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
                stripeInvoiceId: {
                  contains: input.search,
                  mode: "insensitive" as const,
                },
              },
              {
                school: {
                  name: {
                    contains: input.search,
                    mode: "insensitive" as const,
                  },
                },
              },
            ],
          }
        : {}),
    }

    const [invoices, total] = await Promise.all([
      db.invoice.findMany({
        where,
        include: {
          school: {
            select: {
              id: true,
              name: true,
            },
          },
          receipts: {
            select: {
              id: true,
              status: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: offset,
        take: input.perPage,
      }),
      db.invoice.count({ where }),
    ])

    const rows = invoices.map((invoice) => ({
      id: invoice.id,
      number: invoice.stripeInvoiceId,
      tenantName: invoice.school.name,
      periodStart: invoice.periodStart?.toISOString() || null,
      periodEnd: invoice.periodEnd?.toISOString() || null,
      amount: invoice.amountDue,
      status: invoice.status as "open" | "paid" | "void" | "uncollectible",
      createdAt: invoice.createdAt.toISOString(),
    }))

    return { success: true, data: rows, total }
  } catch (error) {
    console.error("Failed to fetch invoices:", error)
    return {
      success: false,
      error: {
        message:
          error instanceof Error ? error.message : "Failed to fetch invoices",
      },
      data: [],
      total: 0,
    }
  }
}

// ============= CSV Export =============

export async function getInvoicesCSV(filters?: {
  status?: string
  search?: string
}): Promise<string> {
  await requireOperator()

  const where = {
    ...(filters?.status && filters.status !== "all"
      ? { status: filters.status }
      : {}),
    ...(filters?.search
      ? {
          OR: [
            {
              stripeInvoiceId: {
                contains: filters.search,
                mode: "insensitive" as const,
              },
            },
            {
              school: {
                name: {
                  contains: filters.search,
                  mode: "insensitive" as const,
                },
              },
            },
          ],
        }
      : {}),
  }

  const invoices = await db.invoice.findMany({
    where,
    include: {
      school: {
        select: {
          name: true,
          domain: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 10000, // Limit to prevent memory issues
  })

  // CSV header
  const headers = [
    "Invoice Number",
    "School Name",
    "School Domain",
    "Amount Due",
    "Amount Paid",
    "Status",
    "Period Start",
    "Period End",
    "Created At",
    "Updated At",
  ]

  // CSV rows
  const rows = invoices.map((invoice) => [
    invoice.stripeInvoiceId || "",
    invoice.school.name,
    invoice.school.domain,
    (invoice.amountDue / 100).toFixed(2),
    (invoice.amountPaid / 100).toFixed(2),
    invoice.status,
    invoice.periodStart?.toLocaleDateString() || "",
    invoice.periodEnd?.toLocaleDateString() || "",
    invoice.createdAt.toLocaleDateString(),
    invoice.updatedAt.toLocaleDateString(),
  ])

  // Combine into CSV
  const csv = [
    headers.join(","),
    ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
  ].join("\n")

  return csv
}
