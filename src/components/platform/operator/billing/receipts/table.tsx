"use client";

import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/table/data-table/data-table";
import { DataTableToolbar } from "@/components/table/data-table/data-table-toolbar";
import { useDataTable } from "@/components/table/hooks/use-data-table";
import type { ReceiptRow } from "./columns";
import { EmptyState } from "@/components/platform/operator/common/empty-state";

export function ReceiptsTable({ data, columns, pageCount }: { data: ReceiptRow[]; columns: ColumnDef<ReceiptRow, unknown>[]; pageCount: number }) {
  const { table } = useDataTable<ReceiptRow>({
    data,
    columns,
    pageCount,
  });
  const hasRows = table.getRowModel().rows.length > 0;
  return (
    <DataTable table={table}>
      <DataTableToolbar table={table} />
      {!hasRows && <EmptyState title="No receipts" description="Upload a manual receipt to get started." />}
    </DataTable>
  );
}


