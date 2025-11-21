"use client";

import { ColumnDef } from "@tanstack/react-table";
import { DataTableColumnHeader } from "@/components/table/data-table-column-header";
import { Button } from "@/components/ui/button";
import { MoreHorizontal } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useModal } from "@/components/atom/modal/context";
import { deleteParent } from "@/components/platform/parents/actions";
import { DeleteToast, ErrorToast, confirmDeleteDialog } from "@/components/atom/toast";

export type ParentRow = {
  id: string;
  userId: string | null;
  name: string;
  emailAddress: string;
  status: string;
  createdAt: string;
};

export const parentColumns: ColumnDef<ParentRow>[] = [
  { accessorKey: "name", id: 'name', header: ({ column }) => <DataTableColumnHeader column={column} title="Name" />, meta: { label: "Name", variant: "text" }, enableColumnFilter: true },
  { accessorKey: "emailAddress", id: 'emailAddress', header: ({ column }) => <DataTableColumnHeader column={column} title="Email" />, meta: { label: "Email", variant: "text" }, enableColumnFilter: true },
  { accessorKey: "status", id: 'status', header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />, meta: { label: "Status", variant: "select", options: [{ label: 'Active', value: 'active' }, { label: 'Inactive', value: 'inactive' }] }, enableColumnFilter: true },
  { accessorKey: "createdAt", id: 'createdAt', header: ({ column }) => <DataTableColumnHeader column={column} title="Created" />, cell: ({ getValue }) => <span className="text-xs tabular-nums text-muted-foreground">{new Date(getValue<string>()).toLocaleDateString()}</span>, meta: { label: "Created", variant: "text" } },
  {
    id: "actions",
    header: () => <span className="sr-only">Actions</span>,
    cell: ({ row }) => {
      const parent = row.original;
      const { openModal } = useModal();
      const onView = () => {
        if (!parent.userId) {
          ErrorToast("This parent does not have a user account");
          return;
        }
        const qs = typeof window !== 'undefined' ? (window.location.search || "") : "";
        window.location.href = `/profile/${parent.userId}${qs}`;
      };
      const onEdit = () => openModal(parent.id);
      const onDelete = async () => {
        try {
          const ok = await confirmDeleteDialog(`Delete ${parent.name}?`);
          if (!ok) return;
          await deleteParent({ id: parent.id });
          DeleteToast();
        } catch (e) {
          ErrorToast(e instanceof Error ? e.message : "Failed to delete");
        }
      };
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
              <span className="sr-only">Open menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onView}>View</DropdownMenuItem>
            <DropdownMenuItem onClick={onEdit}>Edit</DropdownMenuItem>
            <DropdownMenuItem onClick={onDelete}>Delete</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
    enableSorting: false,
    enableColumnFilter: false,
  },
];
