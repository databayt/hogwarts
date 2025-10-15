"use client";

import { ColumnDef } from "@tanstack/react-table";
import { DataTableColumnHeader } from "@/components/table/data-table/data-table-column-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { invoiceUpdateStatus } from "@/components/operator/billing/actions";
import { SuccessToast, ErrorToast } from "@/components/atom/toast";
import type { Locale } from "@/components/internationalization/config";
import { formatCurrency, formatDate, formatDateRange } from "@/lib/i18n-format";

export type InvoiceRow = {
  id: string;
  number: string;
  tenantName: string;
  periodStart: string | null;
  periodEnd: string | null;
  amount: number;
  status: string;
  createdAt: string;
};

export function getInvoiceColumns(lang: Locale): ColumnDef<InvoiceRow>[] {
  return [
    {
      accessorKey: "number",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Invoice" />,
      meta: { label: "Invoice", variant: "text", placeholder: "Search number" },
    },
    {
      accessorKey: "tenantName",
      header: ({ column }) => <DataTableColumnHeader column={column} title="School" />,
      meta: { label: "School", variant: "text", placeholder: "Search school" },
    },
    {
      id: "period",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Period" />,
      cell: ({ row }) => {
        const { periodStart, periodEnd } = row.original;
        if (!periodStart || !periodEnd) return "-";
        return <span className="tabular-nums">{formatDateRange(periodStart, periodEnd, lang)}</span>;
      },
      meta: { label: "Period", variant: "text", placeholder: "e.g. 2025-01" },
    },
    {
      accessorKey: "amount",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Amount" />,
      cell: ({ getValue }) => <span className="tabular-nums">{formatCurrency(getValue<number>() / 100, lang)}</span>,
      meta: { label: "Amount", variant: "number" },
    },
    {
      accessorKey: "status",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
      meta: {
        label: "Status",
        variant: "select",
        options: [
          { label: "Draft", value: "draft" },
          { label: "Open", value: "open" },
          { label: "Paid", value: "paid" },
          { label: "Uncollectible", value: "uncollectible" },
          { label: "Void", value: "void" },
        ],
      },
      cell: ({ getValue }) => {
        const v = (getValue<string>() ?? "").toLowerCase();
        const variant = v === "paid" ? "default" : v === "open" ? "secondary" : v === "draft" ? "outline" : "destructive";
        const label = v.charAt(0).toUpperCase() + v.slice(1);
        return <Badge variant={variant as "default" | "secondary" | "outline" | "destructive"}>{label}</Badge>;
      },
    },
    {
      accessorKey: "createdAt",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Created" />,
      meta: { label: "Created", variant: "text" },
      cell: ({ getValue }) => (
        <span className="text-xs tabular-nums text-muted-foreground">
          {formatDate(getValue<string>(), lang)}
        </span>
      ),
    },
    {
      id: "actions",
      header: () => <span className="sr-only">Actions</span>,
      cell: ({ row }) => {
        const inv = row.original as InvoiceRow;
        return (
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={async () => {
              try {
                const result = await invoiceUpdateStatus({ id: inv.id, status: "paid" });
                if (result.success) {
                  SuccessToast("Invoice marked as paid");
                } else {
                  ErrorToast(result.error.message);
                }
              } catch (e) {
                ErrorToast(e instanceof Error ? e.message : "Failed");
              }
            }}>Mark paid</Button>
            <Button size="sm" variant="outline" onClick={async () => {
              try {
                const result = await invoiceUpdateStatus({ id: inv.id, status: "void" });
                if (result.success) {
                  SuccessToast("Invoice voided successfully");
                } else {
                  ErrorToast(result.error.message);
                }
              } catch (e) {
                ErrorToast(e instanceof Error ? e.message : "Failed");
              }
            }}>Void</Button>
          </div>
        );
      },
    },
  ];
}


