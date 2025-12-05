"use client";

import { ColumnDef } from "@tanstack/react-table";
import { DataTableColumnHeader } from "@/components/table/data-table-column-header";
import { Button } from "@/components/ui/button";
import { Ellipsis, Eye, Pencil, Trash2 } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useModal } from "@/components/atom/modal/context";
import { deleteInvoice } from "@/components/platform/finance/invoice/actions";
import { DeleteToast, ErrorToast, confirmDeleteDialog } from "@/components/atom/toast";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import type { InvoiceRow } from "./types";

export type { InvoiceRow };

const getStatusBadge = (status: string) => {
  const statusConfig = {
    PAID: { variant: "default" as const, className: "bg-green-100 text-green-800 hover:bg-green-100" },
    UNPAID: { variant: "secondary" as const, className: "bg-yellow-100 text-yellow-800 hover:bg-yellow-100" },
    OVERDUE: { variant: "destructive" as const, className: "bg-red-100 text-red-800 hover:bg-red-100" },
    CANCELLED: { variant: "outline" as const, className: "bg-gray-100 text-gray-800 hover:bg-gray-100" },
  };
  
  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.UNPAID;
  
  return (
    <Badge variant={config.variant} className={config.className}>
      {status}
    </Badge>
  );
};

export const getInvoiceColumns = (): ColumnDef<InvoiceRow>[] => [
  { 
    accessorKey: "invoice_no", 
    id: 'invoice_no', 
    header: ({ column }) => <DataTableColumnHeader column={column} title="Invoice #" />, 
    meta: { label: "Invoice #", variant: "text" }, 
    enableColumnFilter: true 
  },
  { 
    accessorKey: "client_name", 
    id: 'client_name', 
    header: ({ column }) => <DataTableColumnHeader column={column} title="Client" />, 
    meta: { label: "Client", variant: "text" }, 
    enableColumnFilter: true 
  },
  { 
    accessorKey: "total", 
    id: 'total', 
    header: ({ column }) => <DataTableColumnHeader column={column} title="Total" />, 
    cell: ({ row }) => {
      const invoice = row.original;
      return (
        <span className="font-medium">
          {new Intl.NumberFormat('en-US', { 
            style: 'currency', 
            currency: invoice.currency 
          }).format(invoice.total)}
        </span>
      );
    },
    meta: { label: "Total", variant: "text" }
  },
  { 
    accessorKey: "status", 
    id: 'status', 
    header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />, 
    cell: ({ row }) => getStatusBadge(row.original.status),
    meta: { 
      label: "Status", 
      variant: "select", 
      options: [
        { label: 'Paid', value: 'PAID' }, 
        { label: 'Unpaid', value: 'UNPAID' }, 
        { label: 'Overdue', value: 'OVERDUE' },
        { label: 'Cancelled', value: 'CANCELLED' }
      ] 
    }, 
    enableColumnFilter: true 
  },
  { 
    accessorKey: "due_date", 
    id: 'due_date', 
    header: ({ column }) => <DataTableColumnHeader column={column} title="Due Date" />, 
    cell: ({ getValue }) => (
      <span className="text-xs tabular-nums text-muted-foreground">
        {new Date(getValue<string>()).toLocaleDateString()}
      </span>
    ), 
    meta: { label: "Due Date", variant: "text" } 
  },
  { 
    accessorKey: "createdAt", 
    id: 'createdAt', 
    header: ({ column }) => <DataTableColumnHeader column={column} title="Created" />, 
    cell: ({ getValue }) => (
      <span className="text-xs tabular-nums text-muted-foreground">
        {new Date(getValue<string>()).toLocaleDateString()}
      </span>
    ), 
    meta: { label: "Created", variant: "text" } 
  },
  {
    id: "actions",
    header: () => <span className="sr-only">Actions</span>,
    cell: ({ row }) => {
      const invoice = row.original;
      const { openModal } = useModal();
      const router = useRouter();

      const onView = () => {
        const qs = typeof window !== 'undefined' ? (window.location.search || "") : "";
        window.location.href = `/invoice/${invoice.id}${qs}`;
      };

      const onEdit = () => openModal(invoice.id);

      const onDelete = async () => {
        try {
          const ok = await confirmDeleteDialog(`Delete invoice ${invoice.invoice_no}?`);
          if (!ok) return;
          await deleteInvoice({ id: invoice.id });
          DeleteToast();
          router.refresh();
        } catch (e) {
          ErrorToast(e instanceof Error ? e.message : "Failed to delete");
        }
      };
      
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <Ellipsis className="h-4 w-4" />
              <span className="sr-only">Open menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onView}>
              <Eye className="mr-2 h-4 w-4" />
              View
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onEdit}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onDelete} className="text-red-600">
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
    enableSorting: false,
    enableColumnFilter: false,
  },
];

// NOTE: Do NOT export pre-generated columns. Always use getInvoiceColumns()
// inside useMemo in client components to avoid SSR hook issues.
