"use client";

import { ColumnDef } from "@tanstack/react-table";
import { DataTableColumnHeader } from "@/components/table/data-table-column-header";
import { Button } from "@/components/ui/button";
import { MoreHorizontal } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useModal } from "@/components/atom/modal/context";
import { deleteAssignment } from "@/components/platform/assignments/actions";
import { DeleteToast, ErrorToast, confirmDeleteDialog } from "@/components/atom/toast";

export type AssignmentRow = {
  id: string;
  title: string;
  type: string;
  totalPoints: number;
  dueDate: string;
  createdAt: string;
};

export const assignmentColumns: ColumnDef<AssignmentRow>[] = [
  {
    accessorKey: "title",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Title" />,
    meta: { label: "Title", variant: "text" },
    id: 'title',
    enableColumnFilter: true,
  },
  {
    accessorKey: "type",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Type" />,
    meta: { label: "Type", variant: "text" },
    id: 'type',
    enableColumnFilter: true,
  },
  {
    accessorKey: "totalPoints",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Points" />,
    meta: { label: "Points", variant: "number" },
    id: 'totalPoints',
    enableColumnFilter: true,
  },
  {
    accessorKey: "dueDate",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Due Date" />,
    meta: { label: "Due Date", variant: "text" },
    id: 'dueDate',
    cell: ({ getValue }) => (
      <span className="text-xs tabular-nums text-muted-foreground">{new Date(getValue<string>()).toLocaleDateString()}</span>
    ),
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
      const assignment = row.original;
      const { openModal } = useModal();
      const onView = () => {
        const qs = typeof window !== 'undefined' ? (window.location.search || "") : "";
        window.location.href = `/assignments/${assignment.id}${qs}`;
      };
      const onEdit = () => openModal(assignment.id);
      const onDelete = async () => {
        try {
          const ok = await confirmDeleteDialog(`Delete ${assignment.title}?`);
          if (!ok) return;
          await deleteAssignment({ id: assignment.id });
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
