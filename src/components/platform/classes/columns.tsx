"use client";

import { ColumnDef } from "@tanstack/react-table";
import { DataTableColumnHeader } from "@/components/table/data-table-column-header";
import { Button } from "@/components/ui/button";
import { MoreHorizontal } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useModal } from "@/components/atom/modal/context";
import { deleteClass } from "@/components/platform/classes/actions";
import { DeleteToast, ErrorToast, confirmDeleteDialog } from "@/components/atom/toast";

export type ClassRow = {
  id: string;
  name: string;
  subjectName: string;
  teacherName: string;
  termName: string;
  courseCode: string;
  credits: string | number;
  evaluationType: string;
  enrolledStudents: number;
  maxCapacity: number;
  createdAt: string;
};

export const getClassColumns = (): ColumnDef<ClassRow>[] => [
  {
    accessorKey: "name",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Class Name" />,
    meta: { label: "Class Name", variant: "text" },
    id: 'name',
    enableColumnFilter: true,
  },
  {
    accessorKey: "courseCode",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Course Code" />,
    meta: { label: "Course Code", variant: "text" },
    id: 'courseCode',
    enableColumnFilter: true,
    cell: ({ getValue }) => {
      const value = getValue<string>();
      return value ? <span className="font-mono text-xs">{value}</span> : <span className="text-muted-foreground">-</span>;
    },
  },
  {
    accessorKey: "subjectName",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Subject" />,
    meta: { label: "Subject", variant: "text" },
    id: 'subjectName',
    enableColumnFilter: true,
  },
  {
    accessorKey: "teacherName",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Teacher" />,
    meta: { label: "Teacher", variant: "text" },
    id: 'teacherName',
    enableColumnFilter: true,
  },
  {
    accessorKey: "credits",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Credits" />,
    meta: { label: "Credits", variant: "number" },
    id: 'credits',
    cell: ({ getValue }) => {
      const value = getValue<string | number>();
      return value ? <span className="tabular-nums">{value}</span> : <span className="text-muted-foreground">-</span>;
    },
  },
  {
    accessorKey: "evaluationType",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Evaluation" />,
    meta: { label: "Evaluation", variant: "text" },
    id: 'evaluationType',
    enableColumnFilter: true,
    cell: ({ getValue }) => {
      const value = getValue<string>();
      return <span className="text-xs">{value}</span>;
    },
  },
  {
    accessorKey: "enrolledStudents",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Enrolled" />,
    meta: { label: "Enrolled", variant: "number" },
    id: 'enrolledStudents',
    cell: ({ row }) => {
      const enrolled = row.original.enrolledStudents;
      const max = row.original.maxCapacity;
      return (
        <span className="tabular-nums text-xs">
          {enrolled}/{max}
        </span>
      );
    },
  },
  {
    accessorKey: "termName",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Term" />,
    meta: { label: "Term", variant: "text" },
    id: 'termName',
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
      const classItem = row.original;
      const { openModal } = useModal();
      const onView = () => {
        const qs = typeof window !== 'undefined' ? (window.location.search || "") : "";
        window.location.href = `/classes/${classItem.id}${qs}`;
      };
      const onEdit = () => openModal(classItem.id);
      const onDelete = async () => {
        try {
          const ok = await confirmDeleteDialog(`Delete ${classItem.name}?`);
          if (!ok) return;
          await deleteClass({ id: classItem.id });
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



