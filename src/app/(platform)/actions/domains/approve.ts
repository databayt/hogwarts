"use server";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { requireOperator, requireNotImpersonating, logOperatorAudit } from "@/components/platform/operator/lib/operator-auth";

export async function approveDomainRequest(id: string, notes?: string) {
  const operator = await requireOperator();
  await requireNotImpersonating();
  const req = await db.domainRequest.update({ where: { id }, data: { status: "approved", notes } });
  await logOperatorAudit({ userId: operator.userId, schoolId: req.schoolId, action: "DOMAIN_APPROVE", reason: notes });
  revalidatePath("/operator/domains");
}


