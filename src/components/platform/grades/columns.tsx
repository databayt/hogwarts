"use client";

import { ColumnDef } from "@tanstack/react-table";
import { DataTableColumnHeader } from "@/components/table/data-table/data-table-column-header";
import { Button } from "@/components/ui/button";
import { MoreHorizontal } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useModal } from "@/components/atom/modal/context";
import { deleteResult } from "@/components/platform/grades/actions";
import { DeleteToast, ErrorToast, confirmDeleteDialog } from "@/components/atom/toast";

export type ResultRow = {
  id: string;
  studentName: string;
  assignmentTitle: string;
  className: string;
  score: number;
  maxScore: number;
  percentage: number;
  grade: string;
  createdAt: string;
};

export const resultColumns: ColumnDef<ResultRow>[] = [
  {
    accessorKey: "studentName",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Student" />,
    meta: { label: "Student", variant: "text" },
    id: 'studentName',
    enableColumnFilter: true,
  },
  {
    accessorKey: "assignmentTitle",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Assignment" />,
    meta: { label: "Assignment", variant: "text" },
    id: 'assignmentTitle',
    enableColumnFilter: true,
  },
  {
    accessorKey: "className",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Class" />,
    meta: { label: "Class", variant: "text" },
    id: 'className',
    enableColumnFilter: true,
  },
  {
    accessorKey: "score",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Score" />,
    meta: { label: "Score", variant: "number" },
    id: 'score',
    enableColumnFilter: true,
  },
  {
    accessorKey: "maxScore",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Max Score" />,
    meta: { label: "Max Score", variant: "number" },
    id: 'maxScore',
    enableColumnFilter: true,
  },
  {
    accessorKey: "percentage",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Percentage" />,
    meta: { label: "Percentage", variant: "number" },
    id: 'percentage',
    cell: ({ getValue }) => (
      <span className="text-xs tabular-nums text-muted-foreground">
        {(getValue<number>() || 0).toFixed(1)}%
      </span>
    ),
  },
  {
    accessorKey: "grade",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Grade" />,
    meta: { label: "Grade", variant: "text" },
    id: 'grade',
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
      const result = row.original;
      const { openModal } = useModal();
      const onView = () => {
        const qs = typeof window !== 'undefined' ? (window.location.search || "") : "";
        window.location.href = `/grades/${result.id}${qs}`;
      };
      const onEdit = () => openModal(result.id);
      const onDelete = async () => {
        try {
          const ok = await confirmDeleteDialog(`Delete result for ${result.studentName}?`);
          if (!ok) return;
          await deleteResult({ id: result.id });
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
