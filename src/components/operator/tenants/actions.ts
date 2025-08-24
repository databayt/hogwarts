"use server";

import { z } from "zod";
import { toggleTenantActive } from "@/components/operator/actions/tenants/toggle-active";
import { changeTenantPlan } from "@/components/operator/actions/tenants/change-plan";
import { endTenantTrial } from "@/components/operator/actions/tenants/end-trial";
import { startImpersonation } from "@/components/operator/actions/impersonation/start";
import { stopImpersonation } from "@/components/operator/actions/impersonation/stop";

const idSchema = z.object({ tenantId: z.string().min(1), reason: z.string().optional() });

export async function tenantToggleActive(input: z.infer<typeof idSchema>) {
  const { tenantId, reason } = idSchema.parse(input);
  await toggleTenantActive(tenantId, reason);
  return { success: true as const };
}

const planSchema = z.object({ tenantId: z.string().min(1), planType: z.string().min(1), reason: z.string().optional() });
export async function tenantChangePlan(input: z.infer<typeof planSchema>) {
  await changeTenantPlan(planSchema.parse(input));
  return { success: true as const };
}

export async function tenantEndTrial(input: z.infer<typeof idSchema>) {
  const { tenantId, reason } = idSchema.parse(input);
  await endTenantTrial({ tenantId, reason });
  return { success: true as const };
}

export async function tenantStartImpersonation(input: { tenantId: string; reason?: string }) {
  const parsed = z.object({ tenantId: z.string().min(1), reason: z.string().optional() }).parse(input);
  await startImpersonation(parsed.tenantId, parsed.reason);
  return { success: true as const };
}

export async function tenantStopImpersonation(input?: { reason?: string }) {
  const parsed = z.object({ reason: z.string().optional() }).parse(input ?? {});
  await stopImpersonation(parsed.reason);
  return { success: true as const };
}












