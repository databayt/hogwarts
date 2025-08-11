"use client";

import { ColumnDef } from "@tanstack/react-table";
import { DataTableColumnHeader } from "@/components/table/data-table/data-table-column-header";

export type TeacherRow = {
  id: string;
  name: string;
  department: string;
  createdAt: string;
};

export const teacherColumns: ColumnDef<TeacherRow>[] = [
  { accessorKey: "name", id: 'name', header: ({ column }) => <DataTableColumnHeader column={column} title="Name" />, meta: { label: "Name", variant: "text" } },
  { accessorKey: "department", id: 'department', header: ({ column }) => <DataTableColumnHeader column={column} title="Department" />, meta: { label: "Department", variant: "select" } },
  { accessorKey: "createdAt", id: 'createdAt', header: ({ column }) => <DataTableColumnHeader column={column} title="Created" />, cell: ({ getValue }) => <span className="text-xs tabular-nums text-muted-foreground">{new Date(getValue<string>()).toLocaleDateString()}</span>, meta: { label: "Created", variant: "text" } },
]



