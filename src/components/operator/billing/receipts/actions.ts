"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { requireOperator } from "@/components/operator/lib/operator-auth";
import { revalidatePath } from "next/cache";

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
          paidAt: new Date(),
          amountPaid: receipt.amount,
        },
      });
    }

    // Create audit log
    await db.auditLog.create({
      data: {
        action: `receipt_${validated.status}`,
        userId: "operator", // TODO: Get actual operator user ID
        details: {
          receiptId: validated.receiptId,
          status: validated.status,
          notes: validated.notes,
        },
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
        schoolId: invoice.schoolId,
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
        details: {
          receiptId: receipt.id,
          invoiceId: validated.invoiceId,
          amount: validated.amount,
          fileName: validated.fileName,
        },
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
