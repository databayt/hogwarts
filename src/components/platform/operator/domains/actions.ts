"use server";

import { z } from "zod";
import { approveDomainRequest } from "@/app/(platform)/operator/actions/domains/approve";
import { rejectDomainRequest } from "@/app/(platform)/operator/actions/domains/reject";
import { verifyDomainRequest } from "@/app/(platform)/operator/actions/domains/verify";
import { createDomainRequest } from "@/app/(platform)/operator/actions/domains/create";

export async function domainApprove(input: { id: string; notes?: string }) {
  const parsed = z.object({ id: z.string().min(1), notes: z.string().optional() }).parse(input);
  await approveDomainRequest(parsed.id, parsed.notes);
  return { success: true as const };
}

export async function domainReject(input: { id: string; notes?: string }) {
  const parsed = z.object({ id: z.string().min(1), notes: z.string().optional() }).parse(input);
  await rejectDomainRequest(parsed.id, parsed.notes);
  return { success: true as const };
}

export async function domainVerify(input: { id: string }) {
  const parsed = z.object({ id: z.string().min(1) }).parse(input);
  await verifyDomainRequest(parsed.id);
  return { success: true as const };
}

export async function domainCreate(input: { schoolId: string; domain: string; notes?: string }) {
  const parsed = z.object({ schoolId: z.string().min(1), domain: z.string().min(3), notes: z.string().optional() }).parse(input);
  await createDomainRequest(parsed);
  return { success: true as const };
}




















