"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireOperator, requireNotImpersonating, logOperatorAudit } from "@/components/platform/operator/lib/operator-auth";

const createSchema = z.object({
  schoolId: z.string().min(1),
  domain: z.string().min(3),
  notes: z.string().optional(),
});

export type CreateDomainRequestInput = z.infer<typeof createSchema>;

export async function createDomainRequest(input: CreateDomainRequestInput) {
  const operator = await requireOperator();
  await requireNotImpersonating();
  const { schoolId, domain, notes } = createSchema.parse(input);

  const existing = await db.domainRequest.findUnique({ where: { schoolId_domain: { schoolId, domain } } });
  if (existing) throw new Error("Request already exists for this domain");

  const created = await db.domainRequest.create({ data: { schoolId, domain, status: "pending", notes } });
  await logOperatorAudit({ userId: operator.userId, schoolId, action: "DOMAIN_CREATE_REQUEST", reason: notes });
  revalidatePath("/operator/domains");
  return created.id;
}







