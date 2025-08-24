"use server";

import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireOperator, requireNotImpersonating, logOperatorAudit } from "@/components/operator/lib/operator-auth";

const schema = z.object({ id: z.string().min(1), decision: z.enum(["approved", "rejected"]), reason: z.string().optional() });

export type ReviewReceiptInput = z.infer<typeof schema>;

export async function reviewReceipt(input: ReviewReceiptInput) {
  const operator = await requireOperator();
  await requireNotImpersonating();
  const { id, decision, reason } = schema.parse(input);
  const receipt = await db.receipt.update(
    { where: { id }, data: { status: decision } } as unknown as Prisma.ReceiptUpdateArgs
  );
  await logOperatorAudit({ userId: operator.userId, schoolId: receipt.schoolId, action: `BILLING_RECEIPT_${decision.toUpperCase()}`, reason });
  revalidatePath("/operator/billing");
}




