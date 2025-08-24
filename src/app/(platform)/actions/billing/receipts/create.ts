"use server";

import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireOperator, requireNotImpersonating, logOperatorAudit } from "@/components/platform/operator/lib/operator-auth";

const schema = z.object({
  invoiceId: z.string().min(1),
  schoolId: z.string().min(1),
  filename: z.string().min(1),
  amount: z.number().int().nonnegative(),
});

export type CreateReceiptInput = z.infer<typeof schema>;

export async function createReceipt(input: CreateReceiptInput) {
  const operator = await requireOperator();
  await requireNotImpersonating();
  const { invoiceId, schoolId, filename, amount } = schema.parse(input);
  const rec = await db.receipt.create(
    { data: { invoiceId, schoolId, filename, amount, status: "pending" } } as unknown as Prisma.ReceiptCreateArgs
  );
  await logOperatorAudit({ userId: operator.userId, schoolId, action: "BILLING_RECEIPT_CREATE" });
  revalidatePath("/operator/billing");
  return rec.id;
}




