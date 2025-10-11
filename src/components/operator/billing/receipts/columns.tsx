"use client";

import { ColumnDef } from "@tanstack/react-table";
import { DataTableColumnHeader } from "@/components/table/data-table/data-table-column-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { receiptReview } from "@/components/operator/billing/actions";
import { SuccessToast, ErrorToast } from "@/components/atom/toast";

export type ReceiptRow = {
  id: string;
  tenantName: string;
  invoiceNumber: string;
  amount: number;
  filename: string;
  status: string;
  createdAt: string;
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
};

export const receiptColumns: ColumnDef<ReceiptRow>[] = [
  {
    id: "r_tenantName",
    accessorKey: "tenantName",
    header: ({ column }) => <DataTableColumnHeader column={column} title="School" />,
    enableColumnFilter: true,
    meta: { label: "School", variant: "text" },
  },
  {
    id: "r_invoice",
    accessorKey: "invoiceNumber",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Invoice" />,
    enableColumnFilter: true,
    meta: { label: "Invoice", variant: "text" },
  },
  {
    accessorKey: "filename",
    header: ({ column }) => <DataTableColumnHeader column={column} title="File" />,
    meta: { label: "File", variant: "text" },
  },
  {
    accessorKey: "amount",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Amount" />,
    cell: ({ getValue }) => <span className="tabular-nums">{(getValue<number>() / 100).toFixed(2)}</span>,
    meta: { label: "Amount", variant: "number" },
  },
  {
    id: "r_status",
    accessorKey: "status",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
    enableColumnFilter: true,
    cell: ({ getValue }) => {
      const v = (getValue<string>() ?? "").toLowerCase();
      const variant = v === "approved" ? "default" : v === "pending" ? "secondary" : "destructive";
      const label = v.charAt(0).toUpperCase() + v.slice(1);
      return <Badge variant={variant as "default" | "secondary" | "outline" | "destructive"}>{label}</Badge>;
    },
    meta: {
      label: "Status",
      variant: "select",
      options: [
        { label: "Pending", value: "pending" },
        { label: "Approved", value: "approved" },
        { label: "Rejected", value: "rejected" },
      ],
    },
  },
  {
    id: "actions",
    header: () => <span className="sr-only">Actions</span>,
    cell: ({ row }) => {
      const r = row.original as ReceiptRow;
      return (
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={async () => {
              try {
                const reason = prompt("Approval notes (optional)") || undefined;
                const result = await receiptReview({ id: r.id, decision: "approved", reason });
                if (result.success) {
                  SuccessToast();
                } else {
                  ErrorToast(result.error.message);
                }
              } catch (e) {
                ErrorToast(e instanceof Error ? e.message : "Approve failed");
              }
            }}
          >
            Approve
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={async () => {
              try {
                const reason = prompt("Rejection notes (optional)") || undefined;
                const result = await receiptReview({ id: r.id, decision: "rejected", reason });
                if (result.success) {
                  SuccessToast();
                } else {
                  ErrorToast(result.error.message);
                }
              } catch (e) {
                ErrorToast(e instanceof Error ? e.message : "Reject failed");
              }
            }}
          >
            Reject
          </Button>
        </div>
      );
    },
  },
];


