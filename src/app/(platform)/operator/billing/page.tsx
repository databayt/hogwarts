import { BillingContent } from "@/components/platform/operator/billing/content";
import { billingSearchParams } from "@/components/platform/operator/billing/validation";
import { SearchParams } from "nuqs/server";
import { db } from "@/lib/db";
import { ReceiptsTable } from "@/components/platform/operator/billing/receipts/table";
import { receiptColumns, type ReceiptRow } from "@/components/platform/operator/billing/receipts/columns";
import { receiptsSearchParams } from "@/components/platform/operator/billing/receipts/validation";
import { ReceiptUpload } from "@/components/platform/operator/billing/receipts/upload";
import type { Prisma } from "@prisma/client";

export const metadata = {
  title: "Operator: Billing",
};

export default async function BillingPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await billingSearchParams.parse(await searchParams);
  const where: Prisma.InvoiceWhereInput = {
    ...(sp.number ? { stripeInvoiceId: { contains: sp.number, mode: "insensitive" } } : {}),
    ...(sp.tenantName ? { school: { name: { contains: sp.tenantName, mode: "insensitive" } } } : {}),
    ...(sp.status ? { status: sp.status } : {}),
  };
  const page = sp.page;
  const take = sp.perPage;
  const skip = (page - 1) * take;
  const [invoices, total, receipts, receiptsTotal, tenants] = await db.$transaction([
    db.invoice.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take,
      include: { school: { select: { name: true } } },
    }),
    db.invoice.count({ where }),
    db.receipt.findMany({ orderBy: { createdAt: "desc" }, take: 20, include: { school: { select: { name: true } }, invoice: { select: { stripeInvoiceId: true, id: true } } } }),
    db.receipt.count(),
    db.school.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);
  const rows = invoices.map((i) => ({
    id: i.id,
    number: i.stripeInvoiceId ?? i.id.slice(0, 8),
    tenantName: i.school?.name ?? "-",
    period: i.periodStart && i.periodEnd ? `${i.periodStart.toISOString?.() ?? String(i.periodStart)} - ${i.periodEnd.toISOString?.() ?? String(i.periodEnd)}` : "-",
    amount: (i.amountPaid ?? i.amountDue) ?? 0,
    status: i.status ?? "open",
    createdAt: i.createdAt?.toISOString?.() ?? String(i.createdAt),
  }));
  const rsp = await receiptsSearchParams.parse(await searchParams);
  const receiptWhere: Prisma.ReceiptWhereInput = {
    ...(rsp.tenantName ? { school: { name: { contains: rsp.tenantName, mode: "insensitive" } } } : {}),
    ...(rsp.invoiceNumber ? { invoice: { stripeInvoiceId: { contains: rsp.invoiceNumber, mode: "insensitive" } } } : {}),
    ...(rsp.status ? { status: rsp.status } : {}),
  };
  const [receiptPage, receiptTotal] = await db.$transaction([
    db.receipt.findMany({ where: receiptWhere, orderBy: { createdAt: "desc" }, skip: (rsp.page - 1) * rsp.perPage, take: rsp.perPage, include: { school: { select: { name: true } }, invoice: { select: { stripeInvoiceId: true, id: true } } } }),
    db.receipt.count({ where: receiptWhere }),
  ]);

  const receiptRows: ReceiptRow[] = receiptPage.map((r) => ({
    id: r.id,
    tenantName: r.school?.name ?? "-",
    invoiceNumber: r.invoice?.stripeInvoiceId ?? r.invoiceId.slice(0, 8),
    amount: r.amount ?? 0,
    filename: r.filename ?? "-",
    status: r.status ?? "pending",
    createdAt: r.createdAt?.toISOString?.() ?? String(r.createdAt),
  }));

  return (
    <>
      <BillingContent rows={rows} pageCount={Math.ceil(total / take)} />
      <div className="mt-6 space-y-4">
        <h2 className="text-lg font-semibold">Manual Receipts</h2>
        <ReceiptUpload tenants={tenants} invoices={invoices.map((i) => ({ id: i.id, number: i.stripeInvoiceId ?? i.id.slice(0,8) }))} />
        <ReceiptsTable data={receiptRows} columns={receiptColumns} pageCount={Math.ceil(receiptTotal / rsp.perPage)} />
      </div>
    </>
  );
}


