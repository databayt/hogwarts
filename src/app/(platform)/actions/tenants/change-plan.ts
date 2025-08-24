"use server";

import { z } from "zod";
import { revalidatePath, revalidateTag } from "next/cache";
import { db } from "@/lib/db";
import { requireOperator, requireNotImpersonating, logOperatorAudit } from "@/components/platform/operator/lib/operator-auth";

const changePlanSchema = z.object({
  tenantId: z.string().min(1),
  planType: z.string().min(1),
  reason: z.string().optional(),
});

export type ChangePlanInput = z.infer<typeof changePlanSchema>;

export async function changeTenantPlan(input: ChangePlanInput): Promise<void> {
  const operator = await requireOperator();
  await requireNotImpersonating();

  const { tenantId, planType, reason } = changePlanSchema.parse(input);

  const existing = await db.school.findUnique({ where: { id: tenantId } });
  if (!existing) throw new Error("Tenant not found");

  await db.school.update({
    where: { id: tenantId },
    data: { planType },
  });

  await logOperatorAudit({
    userId: operator.userId,
    schoolId: tenantId,
    action: "TENANT_CHANGE_PLAN",
    reason,
  });

  revalidateTag("tenants");
  revalidatePath("/operator/tenants");
}


