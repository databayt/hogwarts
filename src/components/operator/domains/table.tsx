"use client";

import { useState, useCallback } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/table/data-table";
import { DataTableToolbar } from "@/components/table/data-table-toolbar";
import { useDataTable } from "@/components/table/use-data-table";
import { getDomains } from "./actions";

export type DomainRow = {
  id: string;
  schoolName: string;
  domain: string;
  status: string;
  createdAt?: string;
};

interface DomainsTableProps {
  initialData: DomainRow[];
  columns: ColumnDef<DomainRow, unknown>[];
  total: number;
  perPage?: number;
}

export function DomainsTable({ initialData, columns, total, perPage = 10 }: DomainsTableProps) {
  // State for incremental loading
  const [data, setData] = useState<DomainRow[]>(initialData);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  const hasMore = data.length < total;

  const handleLoadMore = useCallback(async () => {
    if (isLoading || !hasMore) return;

    setIsLoading(true);
    try {
      const nextPage = currentPage + 1;
      const result = await getDomains({ page: nextPage, perPage });

      if (result.success && result.data.length > 0) {
        setData(prev => [...prev, ...result.data]);
        setCurrentPage(nextPage);
      }
    } catch (error) {
      console.error('Failed to load more domain requests:', error);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, perPage, isLoading, hasMore]);

  // Use pageCount of 1 since we're handling all data client-side
  const { table } = useDataTable<DomainRow>({
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
      <DataTableToolbar table={table} />
    </DataTable>
  );
}












