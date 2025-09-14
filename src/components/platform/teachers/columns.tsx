"use client";

import { ColumnDef } from "@tanstack/react-table";
import { DataTableColumnHeader } from "@/components/table/data-table/data-table-column-header";
import { Button } from "@/components/ui/button";
import { MoreHorizontal } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useModal } from "@/components/atom/modal/context";
import { deleteTeacher } from "@/components/platform/teachers/actions";
import { DeleteToast, ErrorToast, confirmDeleteDialog } from "@/components/atom/toast";
import type { Dictionary } from "@/components/internationalization/dictionaries";

export type TeacherRow = {
  id: string;
  name: string;
  emailAddress: string;
  status: string;
  createdAt: string;
};

export const getTeacherColumns = (dictionary?: Dictionary['school']['teachers']): ColumnDef<TeacherRow>[] => {
  const dict = dictionary || {
    fullName: "Name",
    editTeacher: "Edit Teacher",
    deleteTeacher: "Delete Teacher"
  };

  // Map dictionary keys to column structure for easier access
  const columns = {
    name: dict.fullName || "Name",
    email: "Email",
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
  { accessorKey: "emailAddress", id: 'emailAddress', header: ({ column }) => <DataTableColumnHeader column={column} title={columns.email} />, meta: { label: columns.email, variant: "text" }, enableColumnFilter: true },
  { accessorKey: "status", id: 'status', header: ({ column }) => <DataTableColumnHeader column={column} title={columns.status} />, meta: { label: columns.status, variant: "select", options: [{ label: status.active, value: 'active' }, { label: status.inactive, value: 'inactive' }] }, enableColumnFilter: true },
  { accessorKey: "createdAt", id: 'createdAt', header: ({ column }) => <DataTableColumnHeader column={column} title={columns.created} />, cell: ({ getValue }) => <span className="text-xs tabular-nums text-muted-foreground">{new Date(getValue<string>()).toLocaleDateString()}</span>, meta: { label: columns.created, variant: "text" } },
  {
    id: "actions",
    header: () => <span className="sr-only">{columns.actions}</span>,
    cell: ({ row }) => {
      const teacher = row.original;
      const { openModal } = useModal();
      const onView = () => {
        const qs = typeof window !== 'undefined' ? (window.location.search || "") : "";
        window.location.href = `/teachers/${teacher.id}${qs}`;
      };
      const onEdit = () => openModal(teacher.id);
      const onDelete = async () => {
        try {
          const ok = await confirmDeleteDialog(`Delete ${teacher.name}?`);
          if (!ok) return;
          await deleteTeacher({ id: teacher.id });
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
            <DropdownMenuItem onClick={onEdit}>{dict.editTeacher || "Edit"}</DropdownMenuItem>
            <DropdownMenuItem onClick={onDelete}>{dict.deleteTeacher || "Delete"}</DropdownMenuItem>
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
export const teacherColumns = getTeacherColumns();



