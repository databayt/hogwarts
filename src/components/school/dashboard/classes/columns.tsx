"use client";

import { ColumnDef } from "@tanstack/react-table";
import { DataTableColumnHeader } from "@/components/table/data-table/data-table-column-header";

export type ClassRow = {
  id: string;
  name: string;
  yearTerm: string;
  size: number;
  createdAt: string;
};

export const classColumns: ColumnDef<ClassRow>[] = [
  { accessorKey: "name", id: 'name', header: ({ column }) => <DataTableColumnHeader column={column} title="Class" />, meta: { label: "Class", variant: "text" } },
  { accessorKey: "yearTerm", id: 'yearTerm', header: ({ column }) => <DataTableColumnHeader column={column} title="Year/Term" />, meta: { label: "Year/Term", variant: "select" } },
  { accessorKey: "size", id: 'size', header: ({ column }) => <DataTableColumnHeader column={column} title="Size" />, meta: { label: "Size", variant: "number" } },
  { accessorKey: "createdAt", id: 'createdAt', header: ({ column }) => <DataTableColumnHeader column={column} title="Created" />, cell: ({ getValue }) => <span className="text-xs tabular-nums text-muted-foreground">{new Date(getValue<string>()).toLocaleDateString()}</span>, meta: { label: "Created", variant: "text" } },
]



