"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireOperator, requireNotImpersonating, logOperatorAudit } from "@/components/operator/lib/operator-auth";
import type { Invoice } from "@prisma/client";

// ============= Type Definitions =============

type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: Error };

// ============= Validation Schemas =============

const updateInvoiceStatusSchema = z.object({
  id: z.string().min(1),
  status: z.enum(["paid", "void", "open", "uncollectible"])
});


// ============= Invoice Actions =============

export async function invoiceUpdateStatus(
  input: { id: string; status: "paid" | "void" | "open" | "uncollectible" }
): Promise<ActionResult<Invoice>> {
  try {
    const operator = await requireOperator();
    await requireNotImpersonating();

    const validated = updateInvoiceStatusSchema.parse(input);

    // Properly typed Prisma operation - no type assertion needed
    const invoice = await db.invoice.update({
      where: { id: validated.id },
      data: {
        status: validated.status,
        updatedAt: new Date()
      }
    });

    await logOperatorAudit({
      userId: operator.userId,
      schoolId: invoice.schoolId,
      action: `BILLING_INVOICE_${validated.status.toUpperCase()}`
    });

    revalidatePath("/operator/billing");

    return { success: true, data: invoice };
  } catch (error) {
    console.error("Failed to update invoice status:", error);
    return {
      success: false,
      error: error instanceof Error ? error : new Error("Failed to update invoice")
    };
  }
}

// ============= Receipt Actions =============
// Moved to @/components/operator/billing/receipts/actions.ts for better organization

// ============= CSV Export =============

export async function getInvoicesCSV(filters?: { status?: string; search?: string }): Promise<string> {
  await requireOperator();

  const where = {
    ...(filters?.status && filters.status !== "all"
      ? { status: filters.status }
      : {}),
    ...(filters?.search
      ? {
          OR: [
            { stripeInvoiceId: { contains: filters.search, mode: "insensitive" as const } },
            { school: { name: { contains: filters.search, mode: "insensitive" as const } } }
          ]
        }
      : {})
  };

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
  });

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
    "Paid At",
  ];

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
    invoice.paidAt?.toLocaleDateString() || "",
  ]);

  // Combine into CSV
  const csv = [
    headers.join(","),
    ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
  ].join("\n");

  return csv;
}




















