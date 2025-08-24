"use server";
import { revalidatePath, revalidateTag } from "next/cache";
import { db } from "@/lib/db";
import { requireOperator, requireNotImpersonating, logOperatorAudit } from "@/components/platform/operator/lib/operator-auth";

export async function toggleTenantActive(tenantId: string, reason?: string) {
  const operator = await requireOperator();
  await requireNotImpersonating();

  const existing = await db.school.findUnique({ where: { id: tenantId } });
  if (!existing) throw new Error("Tenant not found");

  await db.school.update({
    where: { id: tenantId },
    data: { isActive: !existing.isActive },
  });

  await logOperatorAudit({
    userId: operator.userId,
    schoolId: tenantId,
    action: "TENANT_TOGGLE_ACTIVE",
    reason,
  });

  revalidateTag("tenants");
  revalidatePath("/operator/tenants");
}


