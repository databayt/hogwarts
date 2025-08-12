"use client";

import { ColumnDef } from "@tanstack/react-table";
import { DataTableColumnHeader } from "@/components/table/data-table/data-table-column-header";

export type StudentRow = {
  id: string;
  name: string;
  className: string;
  status: string;
  createdAt: string;
};

export const studentColumns: ColumnDef<StudentRow>[] = [
  { accessorKey: "name", id: 'name', header: ({ column }) => <DataTableColumnHeader column={column} title="Name" />, meta: { label: "Name", variant: "text" } },
  { accessorKey: "className", id: 'className', header: ({ column }) => <DataTableColumnHeader column={column} title="Class" />, meta: { label: "Class", variant: "text" } },
  { accessorKey: "status", id: 'status', header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />, meta: { label: "Status", variant: "select", options: [{ label: 'Active', value: 'active' }, { label: 'Inactive', value: 'inactive' }] } },
  { accessorKey: "createdAt", id: 'createdAt', header: ({ column }) => <DataTableColumnHeader column={column} title="Created" />, cell: ({ getValue }) => <span className="text-xs tabular-nums text-muted-foreground">{new Date(getValue<string>()).toLocaleDateString()}</span>, meta: { label: "Created", variant: "text" } },
];



