"use client";

import { ColumnDef } from "@tanstack/react-table";
import { DataTableColumnHeader } from "@/components/table/data-table/data-table-column-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { reviewReceipt } from "./actions";
import { SuccessToast, ErrorToast } from "@/components/atom/toast";

export type ReceiptRow = {
  id: string;
  schoolName: string;
  invoiceNumber: string;
  amount: number;
  fileUrl: string | null;
  fileName: string | null;
  status: "pending" | "approved" | "rejected";
  uploadedAt: string;
  reviewedAt: string | null;
  notes: string | null;
};

export const receiptColumns: ColumnDef<ReceiptRow>[] = [
  {
    id: "r_schoolName",
    accessorKey: "schoolName",
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
    accessorKey: "fileName",
    header: ({ column }) => <DataTableColumnHeader column={column} title="File" />,
    cell: ({ row }) => {
      const fileName = row.original.fileName;
      const fileUrl = row.original.fileUrl;
      if (fileUrl) {
        return (
          <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
            {fileName || "View File"}
          </a>
        );
      }
      return <span className="text-muted-foreground">{fileName || "No file"}</span>;
    },
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
          {r.status === "pending" && (
            <>
              <Button
                size="sm"
                variant="outline"
                onClick={async () => {
                  try {
                    const notes = prompt("Approval notes (optional)") || undefined;
                    const result = await reviewReceipt({ receiptId: r.id, status: "approved", notes });
                    if (result.success) {
                      SuccessToast("Receipt approved successfully");
                      window.location.reload();
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
                variant="destructive"
                onClick={async () => {
                  try {
                    const notes = prompt("Rejection reason (optional)") || undefined;
                    const result = await reviewReceipt({ receiptId: r.id, status: "rejected", notes });
                    if (result.success) {
                      SuccessToast("Receipt rejected successfully");
                      window.location.reload();
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
            </>
          )}
          {r.status !== "pending" && (
            <span className="text-xs text-muted-foreground">
              {r.status === "approved" ? "Approved" : "Rejected"}
              {r.reviewedAt && ` on ${new Date(r.reviewedAt).toLocaleDateString()}`}
            </span>
          )}
        </div>
      );
    },
  },
];


