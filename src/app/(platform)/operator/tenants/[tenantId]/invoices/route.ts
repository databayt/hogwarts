import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireOperator } from "@/components/platform/operator/lib/operator-auth";
import type { Prisma } from "@prisma/client";

export async function GET(
  _req: Request,
  { params }: { params: { tenantId: string } }
) {
  await requireOperator();
  const tenantId = params.tenantId;

  const invoices = await db.invoice.findMany({
    where: { schoolId: tenantId },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  const rows = invoices.map((i) => ({
    id: i.id,
    number: i.number ?? i.id.slice(0, 8),
    status: i.status ?? "open",
    amount: i.amount ?? 0,
    createdAt: i.createdAt?.toISOString?.() ?? String(i.createdAt),
  }));

  return NextResponse.json({ invoices: rows });
}




