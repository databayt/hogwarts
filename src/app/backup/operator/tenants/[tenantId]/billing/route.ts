import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireOperator } from "@/components/operator/lib/operator-auth";
type InvoiceRowLite = { amount: number | null };

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ tenantId: string }> }
) {
  const resolvedParams = await params;
  await requireOperator();
  const tenantId = resolvedParams.tenantId;

  const [school, openInvoices] = await Promise.all([
    db.school.findUnique({ where: { id: tenantId }, select: { planType: true } }),
    (db as unknown as { invoice: { findMany: (args: unknown) => Promise<InvoiceRowLite[]> } }).invoice.findMany({ where: { schoolId: tenantId, status: "open" }, select: { amount: true } }),
  ]);

  const outstandingCents = Array.isArray(openInvoices)
    ? openInvoices.reduce((sum: number, i) => sum + (i.amount ?? 0), 0)
    : 0;

  return NextResponse.json({
    planType: school?.planType ?? "basic",
    trialEndsAt: null as string | null,
    nextInvoiceDate: null as string | null,
    outstandingCents,
  });
}




