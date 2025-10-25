"use client";

import { useState, useCallback } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/table/data-table/data-table";
import { DataTableToolbar } from "@/components/table/data-table/data-table-toolbar";
import { useDataTable } from "@/components/table/hooks/use-data-table";
import type { ReceiptRow } from "./columns";
import { EmptyState } from "@/components/operator/common/empty-state";
import { getReceipts } from "./actions";

interface ReceiptsTableProps {
  initialData: ReceiptRow[];
  columns: ColumnDef<ReceiptRow, unknown>[];
  total: number;
  perPage?: number;
}

export function ReceiptsTable({ initialData, columns, total, perPage = 10 }: ReceiptsTableProps) {
  // State for incremental loading
  const [data, setData] = useState<ReceiptRow[]>(initialData);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  const hasMore = data.length < total;

  const handleLoadMore = useCallback(async () => {
    if (isLoading || !hasMore) return;

    setIsLoading(true);
    try {
      const nextPage = currentPage + 1;
      const result = await getReceipts({ page: nextPage, perPage });

      if (result.success && result.data.length > 0) {
        setData(prev => [...prev, ...result.data]);
        setCurrentPage(nextPage);
      }
    } catch (error) {
      console.error('Failed to load more receipts:', error);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, perPage, isLoading, hasMore]);

  // Use pageCount of 1 since we're handling all data client-side
  const { table } = useDataTable<ReceiptRow>({
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

  const hasRows = table.getRowModel().rows.length > 0;

  return (
    <DataTable
      table={table}
      paginationMode="load-more"
      hasMore={hasMore}
      isLoading={isLoading}
      onLoadMore={handleLoadMore}
    >
      <DataTableToolbar table={table} />
      {!hasRows && <EmptyState title="No receipts" description="Upload a manual receipt to get started." />}
    </DataTable>
  );
}


