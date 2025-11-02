"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { requireOperator } from "@/components/operator/lib/operator-auth";
import { revalidatePath } from "next/cache";
import type { ReceiptRow } from "./types";

const reviewReceiptSchema = z.object({
  receiptId: z.string().min(1),
  status: z.enum(["approved", "rejected"]),
  notes: z.string().optional(),
});

export async function reviewReceipt(data: z.infer<typeof reviewReceiptSchema>) {
  try {
    await requireOperator();
    const validated = reviewReceiptSchema.parse(data);

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
          },
        },
      },
    });

    // If approved, mark the invoice as paid
    if (validated.status === "approved") {
      await db.invoice.update({
        where: { id: receipt.invoiceId },
        data: {
          status: "paid",
          amountPaid: receipt.amount,
          updatedAt: new Date(), // Track when payment was processed
        },
      });
    }

    // Create audit log
    await db.auditLog.create({
      data: {
        action: `receipt_${validated.status}`,
        userId: "operator", // TODO: Get actual operator user ID
        schoolId: receipt.invoice.schoolId,
        reason: validated.notes || `Receipt ${validated.status} for invoice ${receipt.invoiceId}`,
      },
    });

    revalidatePath("/billing");
    revalidatePath("/billing/receipts");

    return { success: true };
  } catch (error) {
    console.error("Failed to review receipt:", error);
    return {
      success: false,
      error: {
        message: error instanceof Error ? error.message : "Failed to review receipt",
      },
    };
  }
}

const uploadReceiptSchema = z.object({
  invoiceId: z.string().min(1),
  amount: z.number().positive(),
  fileName: z.string().min(1),
  fileUrl: z.string().url(),
});

export async function uploadReceipt(data: z.infer<typeof uploadReceiptSchema>) {
  try {
    await requireOperator();
    const validated = uploadReceiptSchema.parse(data);

    // Get the invoice to retrieve schoolId
    const invoice = await db.invoice.findUnique({
      where: { id: validated.invoiceId },
      select: { schoolId: true },
    });

    if (!invoice) {
      throw new Error("Invoice not found");
    }

    const receipt = await db.receipt.create({
      data: {
        invoiceId: validated.invoiceId,
        amount: validated.amount,
        fileName: validated.fileName,
        fileUrl: validated.fileUrl,
        status: "pending",
      },
    });

    // Create audit log
    await db.auditLog.create({
      data: {
        action: "receipt_uploaded",
        userId: "operator",
        schoolId: invoice.schoolId,
        reason: `Receipt uploaded: ${validated.fileName} for invoice ${validated.invoiceId} - Amount: $${(validated.amount / 100).toFixed(2)}`,
      },
    });

    revalidatePath("/billing");
    revalidatePath("/billing/receipts");

    return { success: true, receiptId: receipt.id };
  } catch (error) {
    console.error("Failed to upload receipt:", error);
    return {
      success: false,
      error: {
        message: error instanceof Error ? error.message : "Failed to upload receipt",
      },
    };
  }
}

// Get receipts with filters for pagination
export async function getReceipts(input: {
  page: number;
  perPage: number;
  status?: string;
  search?: string;
}) {
  try {
    await requireOperator();

    const offset = (input.page - 1) * input.perPage;
    const where = {
      ...(input.status && input.status !== "all" ? { status: input.status } : {}),
      ...(input.search
        ? {
            OR: [
              { invoice: { stripeInvoiceId: { contains: input.search, mode: "insensitive" as const } } },
              { invoice: { school: { name: { contains: input.search, mode: "insensitive" as const } } } },
            ]
          }
        : {})
    };

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
    ]);

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
    }));

    return { success: true, data: rows, total };
  } catch (error) {
    console.error("Failed to fetch receipts:", error);
    return {
      success: false,
      error: {
        message: error instanceof Error ? error.message : "Failed to fetch receipts",
      },
      data: [],
      total: 0,
    };
  }
}
