"use client";
import * as React from "react";
import { DataTable } from "@/components/table/data-table/data-table";
import { DataTableToolbar } from "@/components/table/data-table/data-table-toolbar";
import { useDataTable } from "@/components/table/hooks/use-data-table";
import { ColumnDef } from "@tanstack/react-table";
import { getTenants } from "./queries";

interface TenantsTableProps<TData> {
  initialData: TData[];
  columns: ColumnDef<TData, unknown>[];
  total: number;
  perPage?: number;
}

export function TenantsTable<TData>({
  initialData,
  columns,
  total,
  perPage = 10,
}: TenantsTableProps<TData>) {
  // Disable sensitive actions when impersonating
  const [impersonating, setImpersonating] = React.useState(false);
  React.useEffect(() => {
    const cookie = document.cookie
      .split("; ")
      .find((row) => row.startsWith("impersonate_schoolId="));
    setImpersonating(!!cookie);
  }, []);

  // State for incremental loading
  const [data, setData] = React.useState<TData[]>(initialData);
  const [currentPage, setCurrentPage] = React.useState(1);
  const [isLoading, setIsLoading] = React.useState(false);

  const hasMore = data.length < total;

  const handleLoadMore = React.useCallback(async () => {
    if (isLoading || !hasMore) return;

    setIsLoading(true);
    try {
      const nextPage = currentPage + 1;
      const result = await getTenants({ page: nextPage, perPage });

      if (result.data.length > 0) {
        setData(prev => [...prev, ...result.data as TData[]]);
        setCurrentPage(nextPage);
      }
    } catch (error) {
      console.error('Failed to load more tenants:', error);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, perPage, isLoading, hasMore]);

  // Use pageCount of 1 since we're handling all data client-side
  const { table } = useDataTable<TData>({
    data,
    columns,
    pageCount: 1,
    initialState: {
      pagination: {
        pageIndex: 0,
        pageSize: data.length, // Show all loaded data
      }
    }
  });

  return (
    <DataTable
      table={table}
      paginationMode="load-more"
      hasMore={hasMore}
      isLoading={isLoading}
      onLoadMore={handleLoadMore}
    >
      <DataTableToolbar table={table}>
        {impersonating && (
          <span className="text-xs text-amber-600">Impersonation active — actions disabled</span>
        )}
      </DataTableToolbar>
    </DataTable>
  );
}


