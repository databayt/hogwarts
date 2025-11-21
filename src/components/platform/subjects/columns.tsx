"use client";

import { ColumnDef } from "@tanstack/react-table";
import { DataTableColumnHeader } from "@/components/table/data-table-column-header";
import { Button } from "@/components/ui/button";
import { MoreHorizontal } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useModal } from "@/components/atom/modal/context";
import { deleteSubject } from "@/components/platform/subjects/actions";
import { DeleteToast, ErrorToast, confirmDeleteDialog } from "@/components/atom/toast";

export type SubjectRow = {
  id: string;
  subjectName: string;
  departmentName: string;
  createdAt: string;
};

export const subjectColumns: ColumnDef<SubjectRow>[] = [
  {
    accessorKey: "subjectName",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Subject Name" />,
    meta: { label: "Subject Name", variant: "text" },
    id: 'subjectName',
    enableColumnFilter: true,
  },
  {
    accessorKey: "departmentName",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Department" />,
    meta: { label: "Department", variant: "text" },
    id: 'departmentName',
    enableColumnFilter: true,
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Created" />,
    meta: { label: "Created", variant: "text" },
    cell: ({ getValue }) => (
      <span className="text-xs tabular-nums text-muted-foreground">{new Date(getValue<string>()).toLocaleDateString()}</span>
    ),
  },
  {
    id: "actions",
    header: () => <span className="sr-only">Actions</span>,
    cell: ({ row }) => {
      const subject = row.original;
      const { openModal } = useModal();
      const onView = () => {
        const qs = typeof window !== 'undefined' ? (window.location.search || "") : "";
        window.location.href = `/subjects/${subject.id}${qs}`;
      };
      const onEdit = () => openModal(subject.id);
      const onDelete = async () => {
        try {
          const ok = await confirmDeleteDialog(`Delete ${subject.subjectName}?`);
          if (!ok) return;
          await deleteSubject({ id: subject.id });
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
