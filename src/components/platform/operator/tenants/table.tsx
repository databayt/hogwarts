"use client";
import * as React from "react";
import { DataTable } from "@/components/table/data-table/data-table";
import { DataTableToolbar } from "@/components/table/data-table/data-table-toolbar";
import { useDataTable } from "@/components/table/hooks/use-data-table";
// import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ColumnDef } from "@tanstack/react-table";

export function TenantsTable<TData>({
  data,
  columns,
  pageCount,
}: {
  data: TData[];
  columns: ColumnDef<TData, unknown>[];
  pageCount: number;
}) {
  // Disable sensitive actions when impersonating
  const [impersonating, setImpersonating] = React.useState(false);
  React.useEffect(() => {
    const cookie = document.cookie
      .split("; ")
      .find((row) => row.startsWith("impersonate_schoolId="));
    setImpersonating(!!cookie);
  }, []);
  const [tableData, setTableData] = React.useState<TData[]>(data);
  React.useEffect(() => setTableData(data), [data]);

  const { table } = useDataTable<TData>({
    data: tableData,
    columns,
    pageCount,
  });

  return (
    <DataTable table={table}>
      <DataTableToolbar table={table}>
        {impersonating && (
          <span className="text-xs text-amber-600">Impersonation active — actions disabled</span>
        )}
      </DataTableToolbar>
    </DataTable>
  );
}


