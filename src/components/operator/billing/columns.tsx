"use client";

import { ColumnDef } from "@tanstack/react-table";
import { DataTableColumnHeader } from "@/components/table/data-table/data-table-column-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { invoiceUpdateStatus } from "@/components/operator/billing/actions";
import { SuccessToast, ErrorToast } from "@/components/atom/toast";

export type InvoiceRow = {
  id: string;
  number: string;
  tenantName: string;
  period: string;
  amount: number;
  status: string;
  createdAt: string;
};

export const invoiceColumns: ColumnDef<InvoiceRow>[] = [
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
    accessorKey: "period",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Period" />,
    meta: { label: "Period", variant: "text", placeholder: "e.g. 2025-01" },
  },
  {
    accessorKey: "amount",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Amount" />,
    cell: ({ getValue }) => <span className="tabular-nums">{(getValue<number>() / 100).toFixed(2)}</span>,
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
        {new Date(getValue<string>()).toLocaleDateString()}
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
                SuccessToast();
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
                SuccessToast();
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


