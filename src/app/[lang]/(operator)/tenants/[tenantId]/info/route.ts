import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireOperator } from "@/components/operator/lib/operator-auth";

export async function GET(_req: Request, { params }: { params: Promise<{ tenantId: string }> }) {
  const resolvedParams = await params;
  await requireOperator();
  const school = await db.school.findUnique({ where: { id: resolvedParams.tenantId }, select: { name: true, domain: true } });
  return NextResponse.json({ name: school?.name ?? null, domain: school?.domain ?? null });
}












