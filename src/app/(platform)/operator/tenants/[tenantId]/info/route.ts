import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireOperator } from "@/components/platform/operator/lib/operator-auth";

export async function GET(_req: Request, { params }: { params: { tenantId: string } }) {
  await requireOperator();
  const school = await db.school.findUnique({ where: { id: params.tenantId }, select: { name: true, domain: true } });
  return NextResponse.json({ name: school?.name ?? null, domain: school?.domain ?? null });
}









