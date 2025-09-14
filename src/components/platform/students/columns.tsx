"use client";

import { ColumnDef } from "@tanstack/react-table";
import { DataTableColumnHeader } from "@/components/table/data-table/data-table-column-header";
import { Button } from "@/components/ui/button";
import { MoreHorizontal } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useModal } from "@/components/atom/modal/context";
import { deleteStudent } from "@/components/platform/students/actions";
import { DeleteToast, ErrorToast, confirmDeleteDialog } from "@/components/atom/toast";
import type { Dictionary } from "@/components/internationalization/dictionaries";

export type StudentRow = {
  id: string;
  name: string;
  className: string;
  status: string;
  createdAt: string;
};

export const getStudentColumns = (dictionary?: Dictionary['school']['students']): ColumnDef<StudentRow>[] => {
  const dict = dictionary || {
    columns: {
      name: "Name",
      class: "Class",
      status: "Status",
      created: "Created",
      actions: "Actions"
    },
    actions: {
      view: "View",
      edit: "Edit",
      delete: "Delete"
    },
    status: {
      active: "Active",
      inactive: "Inactive"
    }
  };

  return [
  { accessorKey: "name", id: 'name', header: ({ column }) => <DataTableColumnHeader column={column} title={dict.columns.name} />, meta: { label: dict.columns.name, variant: "text" }, enableColumnFilter: true },
  { accessorKey: "className", id: 'className', header: ({ column }) => <DataTableColumnHeader column={column} title={dict.columns.class} />, meta: { label: dict.columns.class, variant: "text" } },
  { accessorKey: "status", id: 'status', header: ({ column }) => <DataTableColumnHeader column={column} title={dict.columns.status} />, meta: { label: dict.columns.status, variant: "select", options: [{ label: dict.status.active, value: 'active' }, { label: dict.status.inactive, value: 'inactive' }] }, enableColumnFilter: true },
  { accessorKey: "createdAt", id: 'createdAt', header: ({ column }) => <DataTableColumnHeader column={column} title={dict.columns.created} />, cell: ({ getValue }) => <span className="text-xs tabular-nums text-muted-foreground">{new Date(getValue<string>()).toLocaleDateString()}</span>, meta: { label: dict.columns.created, variant: "text" } },
  {
    id: "actions",
    header: () => <span className="sr-only">{dict.columns.actions}</span>,
    cell: ({ row }) => {
      const student = row.original;
      const { openModal } = useModal();
      const onView = () => {
        const qs = typeof window !== 'undefined' ? (window.location.search || "") : "";
        window.location.href = `/students/${student.id}${qs}`;
      };
      const onEdit = () => openModal(student.id);
      const onDelete = async () => {
        try {
          const ok = await confirmDeleteDialog(`Delete ${student.name}?`);
          if (!ok) return;
          await deleteStudent({ id: student.id });
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
            <DropdownMenuLabel>{dict.columns.actions}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onView}>{dict.actions.view}</DropdownMenuItem>
            <DropdownMenuItem onClick={onEdit}>{dict.actions.edit}</DropdownMenuItem>
            <DropdownMenuItem onClick={onDelete}>{dict.actions.delete}</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
    enableSorting: false,
    enableColumnFilter: false,
  },
  ];
}

// Export a default version for backward compatibility
export const studentColumns = getStudentColumns();



