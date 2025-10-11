"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireOperator, requireNotImpersonating, logOperatorAudit } from "@/components/operator/lib/operator-auth";
import type { Invoice, Receipt, Prisma } from "@prisma/client";

// ============= Type Definitions =============

type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: Error };

// ============= Validation Schemas =============

const updateInvoiceStatusSchema = z.object({
  id: z.string().min(1),
  status: z.enum(["paid", "void", "open", "uncollectible"])
});

const createReceiptSchema = z.object({
  invoiceId: z.string().min(1),
  schoolId: z.string().min(1),
  filename: z.string().min(1),
  amount: z.number().int().nonnegative()
});

const reviewReceiptSchema = z.object({
  id: z.string().min(1),
  decision: z.enum(["approved", "rejected"]),
  reason: z.string().optional()
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

export async function receiptCreate(
  input: { invoiceId: string; schoolId: string; filename: string; amount: number }
): Promise<ActionResult<Receipt>> {
  try {
    const operator = await requireOperator();
    await requireNotImpersonating();

    const validated = createReceiptSchema.parse(input);

    // Properly typed Prisma operation
    const receipt = await db.receipt.create({
      data: {
        invoiceId: validated.invoiceId,
        schoolId: validated.schoolId,
        filename: validated.filename,
        amount: validated.amount,
        status: "pending"
      }
    });

    await logOperatorAudit({
      userId: operator.userId,
      schoolId: validated.schoolId,
      action: "BILLING_RECEIPT_CREATED"
    });

    revalidatePath("/operator/billing");
    revalidatePath("/operator/billing/receipts");

    return { success: true, data: receipt };
  } catch (error) {
    console.error("Failed to create receipt:", error);
    return {
      success: false,
      error: error instanceof Error ? error : new Error("Failed to create receipt")
    };
  }
}

export async function receiptReview(
  input: { id: string; decision: "approved" | "rejected"; reason?: string }
): Promise<ActionResult<Receipt>> {
  try {
    const operator = await requireOperator();
    await requireNotImpersonating();

    const validated = reviewReceiptSchema.parse(input);

    // Use transaction for atomic updates
    const result = await db.$transaction(async (tx) => {
      const receipt = await tx.receipt.update({
        where: { id: validated.id },
        data: {
          status: validated.decision
        }
      });

      // If approved, update invoice status
      if (validated.decision === "approved") {
        await tx.invoice.update({
          where: { id: receipt.invoiceId },
          data: {
            status: "paid"
          }
        });
      }

      return receipt;
    });

    await logOperatorAudit({
      userId: operator.userId,
      schoolId: result.schoolId,
      action: `BILLING_RECEIPT_${validated.decision.toUpperCase()}`,
      reason: validated.reason
    });

    revalidatePath("/operator/billing");
    revalidatePath("/operator/billing/receipts");

    return { success: true, data: result };
  } catch (error) {
    console.error("Failed to review receipt:", error);
    return {
      success: false,
      error: error instanceof Error ? error : new Error("Failed to review receipt")
    };
  }
}




















