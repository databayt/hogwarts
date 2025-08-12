"use client";

import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/table/data-table/data-table";
import { DataTableToolbar } from "@/components/table/data-table/data-table-toolbar";
import { useDataTable } from "@/components/table/hooks/use-data-table";

export type DomainRow = {
  id: string;
  schoolName: string;
  domain: string;
  status: string;
  createdAt?: string;
};

export function DomainsTable({ data, columns, pageCount }: { data: DomainRow[]; columns: ColumnDef<DomainRow, unknown>[]; pageCount: number }) {
  const { table } = useDataTable<DomainRow>({
    data,
    columns,
    pageCount,
    manualPagination: true,
    manualFiltering: true,
    manualSorting: true,
  });
  return (
    <DataTable table={table}>
      <DataTableToolbar table={table} />
    </DataTable>
  );
}









