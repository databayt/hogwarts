"use client";

import { ColumnDef } from "@tanstack/react-table";
import { DataTableColumnHeader } from "@/components/table/data-table-column-header";
import { Button } from "@/components/ui/button";
import { MoreHorizontal } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useModal } from "@/components/atom/modal/context";
import { deleteStudent } from "@/components/platform/students/actions";
import { DeleteToast, ErrorToast, confirmDeleteDialog } from "@/components/atom/toast";
import type { Dictionary } from "@/components/internationalization/dictionaries";

export type StudentRow = {
  id: string;
  userId: string | null;
  name: string;
  className: string;
  status: string;
  createdAt: string;
};

export const getStudentColumns = (dictionary?: Dictionary['school']['students']): ColumnDef<StudentRow>[] => {
  const dict = dictionary || {
    fullName: "Name",
    class: "Class",
    editStudent: "Edit Student",
    deleteStudent: "Delete Student"
  };

  // Map dictionary keys to column structure for easier access
  const columns = {
    name: dict.fullName || "Name",
    class: dict.class || "Class",
    status: "Status",
    created: "Created",
    actions: "Actions"
  };

  const status = {
    active: "Active",
    inactive: "Inactive"
  };

  return [
  { accessorKey: "name", id: 'name', header: ({ column }) => <DataTableColumnHeader column={column} title={columns.name} />, meta: { label: columns.name, variant: "text" }, enableColumnFilter: true },
  { accessorKey: "className", id: 'className', header: ({ column }) => <DataTableColumnHeader column={column} title={columns.class} />, meta: { label: columns.class, variant: "text" } },
  { accessorKey: "status", id: 'status', header: ({ column }) => <DataTableColumnHeader column={column} title={columns.status} />, meta: { label: columns.status, variant: "select", options: [{ label: status.active, value: 'active' }, { label: status.inactive, value: 'inactive' }] }, enableColumnFilter: true },
  { accessorKey: "createdAt", id: 'createdAt', header: ({ column }) => <DataTableColumnHeader column={column} title={columns.created} />, cell: ({ getValue }) => <span className="text-xs tabular-nums text-muted-foreground">{new Date(getValue<string>()).toLocaleDateString()}</span>, meta: { label: columns.created, variant: "text" } },
  {
    id: "actions",
    header: () => <span className="sr-only">{columns.actions}</span>,
    cell: ({ row }) => {
      const student = row.original;
      const { openModal } = useModal();
      const onView = () => {
        if (!student.userId) {
          ErrorToast("This student does not have a user account");
          return;
        }
        const qs = typeof window !== 'undefined' ? (window.location.search || "") : "";
        window.location.href = `/profile/${student.userId}${qs}`;
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
            <DropdownMenuLabel>{columns.actions}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onView}>View</DropdownMenuItem>
            <DropdownMenuItem onClick={onEdit}>{dict.editStudent || "Edit"}</DropdownMenuItem>
            <DropdownMenuItem onClick={onDelete}>{dict.deleteStudent || "Delete"}</DropdownMenuItem>
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



