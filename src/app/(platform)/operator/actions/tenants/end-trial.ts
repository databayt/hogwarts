"use server";

import { z } from "zod";
import { revalidatePath, revalidateTag } from "next/cache";
import { db } from "@/lib/db";
import { requireOperator, requireNotImpersonating, logOperatorAudit } from "@/components/platform/operator/lib/operator-auth";

const endTrialSchema = z.object({
  tenantId: z.string().min(1),
  reason: z.string().optional(),
});

export type EndTrialInput = z.infer<typeof endTrialSchema>;

export async function endTenantTrial(input: EndTrialInput) {
  const operator = await requireOperator();
  await requireNotImpersonating();

  const { tenantId, reason } = endTrialSchema.parse(input);

  const existing = await db.school.findUnique({ where: { id: tenantId } });
  if (!existing) throw new Error("Tenant not found");

  await db.school.update({
    where: { id: tenantId },
    data: { maxStudents: existing.maxStudents, maxTeachers: existing.maxTeachers, planType: existing.planType, /* trial handling: set trial to ended when field exists */ },
  });

  await logOperatorAudit({
    userId: operator.userId,
    schoolId: tenantId,
    action: "TENANT_END_TRIAL",
    reason,
  });

  revalidateTag("tenants");
  revalidatePath("/operator/tenants");
}







