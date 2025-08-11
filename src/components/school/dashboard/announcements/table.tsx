"use client";

import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/table/data-table/data-table";
import { DataTableToolbar } from "@/components/table/data-table/data-table-toolbar";
import { useDataTable } from "@/components/table/hooks/use-data-table";
import type { AnnouncementRow } from "./columns";

export function AnnouncementsTable({ data, columns, pageCount }: { data: AnnouncementRow[]; columns: ColumnDef<AnnouncementRow, unknown>[]; pageCount: number }) {
  const { table } = useDataTable<AnnouncementRow>({
    data,
    columns,
    pageCount,
  });
  return (
    <DataTable table={table}>
      <DataTableToolbar table={table} />
    </DataTable>
  );
}


