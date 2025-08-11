"use client";

import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/table/data-table/data-table";
import { DataTableToolbar } from "@/components/table/data-table/data-table-toolbar";
import { useDataTable } from "@/components/table/hooks/use-data-table";
import type { ClassRow } from "./columns";

export function ClassesTable({ data, columns, pageCount }: { data: ClassRow[]; columns: ColumnDef<ClassRow, unknown>[]; pageCount: number }) {
  const { table } = useDataTable<ClassRow>({ data, columns, pageCount });
  return (
    <DataTable table={table}>
      <DataTableToolbar table={table} />
    </DataTable>
  );
}







