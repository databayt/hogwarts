"use client";

import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/table/data-table/data-table";
import { DataTableToolbar } from "@/components/table/data-table/data-table-toolbar";
import { useDataTable } from "@/components/table/hooks/use-data-table";
import type { TeacherRow } from "./columns";

export function TeachersTable({ data, columns, pageCount }: { data: TeacherRow[]; columns: ColumnDef<TeacherRow, unknown>[]; pageCount: number }) {
  const { table } = useDataTable<TeacherRow>({ data, columns, pageCount });
  return (
    <DataTable table={table}>
      <DataTableToolbar table={table} />
    </DataTable>
  );
}



