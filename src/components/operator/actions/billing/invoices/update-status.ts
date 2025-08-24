"use server";

import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireOperator, requireNotImpersonating, logOperatorAudit } from "@/components/operator/lib/operator-auth";

const schema = z.object({ id: z.string().min(1), status: z.enum(["paid", "void", "open", "uncollectible"]) });

export type UpdateInvoiceStatusInput = z.infer<typeof schema>;

export async function updateInvoiceStatus(input: UpdateInvoiceStatusInput) {
  const operator = await requireOperator();
  await requireNotImpersonating();
  const { id, status } = schema.parse(input);
  const invoice = await db.invoice.update(
    { where: { id }, data: { status } } as unknown as Prisma.InvoiceUpdateArgs
  );
  await logOperatorAudit({ userId: operator.userId, schoolId: invoice.schoolId, action: `BILLING_INVOICE_${status.toUpperCase()}` });
  revalidatePath("/operator/billing");
}




