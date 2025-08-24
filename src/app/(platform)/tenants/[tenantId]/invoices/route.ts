import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireOperator } from "@/components/platform/operator/lib/operator-auth";
import type { Prisma } from "@prisma/client";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ tenantId: string }> }
) {
  const resolvedParams = await params;
  await requireOperator();
  const tenantId = resolvedParams.tenantId;

  // Operator view should use billing invoices (Stripe) table
  const invoices = await db.invoice.findMany({
    where: { schoolId: tenantId },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  const rows = invoices.map((i) => ({
    id: i.id,
    number: i.stripeInvoiceId ?? i.id.slice(0, 8),
    status: i.status,
    amount: i.amountPaid,
    createdAt: i.createdAt?.toISOString?.() ?? String(i.createdAt),
  }));

  return NextResponse.json({ invoices: rows });
}




