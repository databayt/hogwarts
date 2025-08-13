"use server";

import { z } from "zod";
import { createReceipt } from "@/app/(platform)/operator/actions/billing/receipts/create";
import { reviewReceipt } from "@/app/(platform)/operator/actions/billing/receipts/review";
import { updateInvoiceStatus } from "@/app/(platform)/operator/actions/billing/invoices/update-status";

export async function billingCreateReceipt(input: { invoiceId: string; schoolId: string; filename: string; amount: number }) {
  const parsed = z.object({ invoiceId: z.string().min(1), schoolId: z.string().min(1), filename: z.string().min(1), amount: z.number().int().nonnegative() }).parse(input);
  const id = await createReceipt(parsed);
  return { success: true as const, id };
}

export async function billingReviewReceipt(input: { id: string; decision: "approved" | "rejected"; reason?: string }) {
  const parsed = z.object({ id: z.string().min(1), decision: z.enum(["approved", "rejected"]), reason: z.string().optional() }).parse(input);
  await reviewReceipt(parsed);
  return { success: true as const };
}

export async function billingUpdateInvoiceStatus(input: { id: string; status: "paid" | "void" | "open" | "uncollectible" }) {
  const parsed = z.object({ id: z.string().min(1), status: z.enum(["paid", "void", "open", "uncollectible"]) }).parse(input);
  await updateInvoiceStatus(parsed);
  return { success: true as const };
}













