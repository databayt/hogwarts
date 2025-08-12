"use client";

import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/table/data-table/data-table";
import { DataTableToolbar } from "@/components/table/data-table/data-table-toolbar";
import { useDataTable } from "@/components/table/hooks/use-data-table";
import type { StudentRow } from "./columns";

export function StudentsTable({ data, columns, pageCount }: { data: StudentRow[]; columns: ColumnDef<StudentRow, unknown>[]; pageCount: number }) {
  const { table } = useDataTable<StudentRow>({ data, columns, pageCount });
  return (
    <DataTable table={table}>
      <DataTableToolbar table={table} />
    </DataTable>
  );
}



